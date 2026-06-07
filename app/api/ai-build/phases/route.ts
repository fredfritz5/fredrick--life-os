import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const phases = await prisma.coursePhase.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { videos: true, guides: true, labs: true, features: true } },
      videos: { select: { id: true, status: true } },
      labs: { select: { id: true, status: true } },
    },
    orderBy: { phaseNumber: 'asc' },
  });

  return NextResponse.json(phases);
}
