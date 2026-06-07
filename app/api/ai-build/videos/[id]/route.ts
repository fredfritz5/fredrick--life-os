import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { status, notes, videoTitle, durationMinutes } = await req.json();

  await prisma.courseVideo.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(videoTitle !== undefined && { videoTitle }),
      ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? Number(durationMinutes) : null }),
      ...(status === 'watched' || status === 'rebuilt-from-memory' || status === 'varied'
        ? { watchedAt: new Date() }
        : {}),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.courseVideo.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
