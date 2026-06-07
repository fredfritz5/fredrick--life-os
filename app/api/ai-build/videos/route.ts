import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const phaseId = new URL(req.url).searchParams.get('phaseId');

  const videos = await prisma.courseVideo.findMany({
    where: { userId: user.id, ...(phaseId && { phaseId }) },
    orderBy: [{ phaseId: 'asc' }, { videoNumber: 'asc' }],
  });

  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { phaseId, videoTitle, durationMinutes } = await req.json();
  if (!phaseId || !videoTitle) {
    return NextResponse.json({ error: 'phaseId and videoTitle required' }, { status: 400 });
  }

  const maxNum = await prisma.courseVideo.aggregate({
    where: { userId: user.id, phaseId },
    _max: { videoNumber: true },
  });

  const video = await prisma.courseVideo.create({
    data: {
      userId: user.id,
      phaseId,
      videoTitle,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      videoNumber: (maxNum._max.videoNumber ?? 0) + 1,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
