import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const phase = await prisma.coursePhase.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      videos: { orderBy: { videoNumber: 'asc' } },
      guides: { orderBy: { createdAt: 'asc' } },
      labs: { orderBy: { createdAt: 'asc' } },
      features: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!phase) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(phase);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { status, targetStartDate, targetEndDate, actualStartDate, actualEndDate, description } = await req.json();

  await prisma.coursePhase.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(status !== undefined && { status }),
      ...(description !== undefined && { description }),
      ...(targetStartDate !== undefined && { targetStartDate: targetStartDate ? new Date(targetStartDate) : null }),
      ...(targetEndDate !== undefined && { targetEndDate: targetEndDate ? new Date(targetEndDate) : null }),
      ...(actualStartDate !== undefined && { actualStartDate: actualStartDate ? new Date(actualStartDate) : null }),
      ...(actualEndDate !== undefined && { actualEndDate: actualEndDate ? new Date(actualEndDate) : null }),
    },
  });

  return NextResponse.json({ success: true });
}
