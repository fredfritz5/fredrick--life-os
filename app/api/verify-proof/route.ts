import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyProofImage } from '@/lib/gemini';
import { format, subDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const goalId = formData.get('goalId') as string;
    const goalText = formData.get('goalText') as string;
    const verificationCriteria = formData.get('verificationCriteria') as string;
    const sectorId = formData.get('sectorId') as string;

    if (!file || !goalId || !goalText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const todayImageBase64 = Buffer.from(uint8Array).toString('base64');

    // Look up yesterday's proof image from the same sector
    const yesterday = new Date(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    const yesterdayGoals = await prisma.dailyGoal.findMany({
      where: {
        userId: user.id,
        date: yesterday,
        status: 'completed',
        proofImageUrl: { not: null },
        weeklyGoal: {
          monthlyGoal: { yearlyGoal: { sectorId } },
        },
      },
      take: 1,
    });

    let yesterdayImageBase64: string | null = null;
    if (yesterdayGoals.length > 0 && yesterdayGoals[0].proofImageUrl) {
      try {
        const imgRes = await fetch(yesterdayGoals[0].proofImageUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        yesterdayImageBase64 = Buffer.from(imgBuffer).toString('base64');
      } catch {
        // Can't fetch yesterday's image — skip comparison
      }
    }

    const verificationResult = await verifyProofImage({
      goalText,
      verificationCriteria: verificationCriteria || 'Provide clear evidence of the stated task being completed.',
      todayImageBase64,
      yesterdayImageBase64,
      todayMimeType: file.type || 'image/jpeg',
    });

    const verified =
      verificationResult.matches_goal &&
      verificationResult.different_from_yesterday &&
      verificationResult.confidence >= 0.6;

    // Store base64 data URL as proof (no external storage needed)
    const proofDataUrl = `data:${file.type};base64,${todayImageBase64}`;

    if (verified) {
      await prisma.dailyGoal.updateMany({
        where: { id: goalId, userId: user.id },
        data: {
          status: 'completed',
          proofImageUrl: proofDataUrl,
          verificationResultJson: verificationResult as object,
          completedAt: new Date(),
          manualOverrideReason: null,
        },
      });
    } else {
      await prisma.dailyGoal.updateMany({
        where: { id: goalId, userId: user.id },
        data: {
          proofImageUrl: proofDataUrl,
          verificationResultJson: verificationResult as object,
        },
      });
    }

    return NextResponse.json({ verified, result: verificationResult });
  } catch (err: unknown) {
    console.error('Verify proof error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
