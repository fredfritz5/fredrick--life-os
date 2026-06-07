import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const stages = await prisma.pipelineStage.findMany({
    where: { userId: user.id },
    include: { _count: { select: { prospects: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(stages);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { name, color } = await req.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const maxOrder = await prisma.pipelineStage.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  });

  const stage = await prisma.pipelineStage.create({
    data: {
      userId: user.id,
      name,
      color: color || '#6366f1',
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: { _count: { select: { prospects: true } } },
  });

  return NextResponse.json(stage, { status: 201 });
}
