import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.dailyGoal.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { status, manualOverrideReason, verificationResultJson, proofImageUrl } = body;

  const goal = await prisma.dailyGoal.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(status && { status }),
      ...(manualOverrideReason !== undefined && { manualOverrideReason }),
      ...(verificationResultJson !== undefined && { verificationResultJson }),
      ...(proofImageUrl !== undefined && { proofImageUrl }),
      ...(status === 'completed' && { completedAt: new Date() }),
    },
  });

  return NextResponse.json({ updated: goal.count });
}
