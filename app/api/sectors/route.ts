import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const sectors = await prisma.sector.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(sectors);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { name, icon, color, description, verificationCriteria, visionRequired } = body;

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const lastSector = await prisma.sector.findFirst({
    where: { userId: user.id },
    orderBy: { order: 'desc' },
  });

  const sector = await prisma.sector.create({
    data: {
      userId: user.id,
      name,
      icon: icon || 'circle',
      color: color || '#6366f1',
      description: description || null,
      verificationCriteria: verificationCriteria || null,
      visionRequired: visionRequired !== false,
      order: (lastSector?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(sector);
}
