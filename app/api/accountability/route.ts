import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const sectorId = searchParams.get('sectorId');

  const commitments = await prisma.accountabilityCommitment.findMany({
    where: { userId: user.id, ...(sectorId ? { sectorId } : {}) },
    include: { sector: { select: { name: true, icon: true, color: true } } },
    orderBy: { dateMade: 'desc' },
  });

  return NextResponse.json(commitments);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { text, sectorId, notes } = await request.json();
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

  const commitment = await prisma.accountabilityCommitment.create({
    data: {
      userId: user.id,
      text,
      sectorId: sectorId && sectorId !== 'none' ? sectorId : null,
      notes: notes || null,
      dateMade: new Date(format(new Date(), 'yyyy-MM-dd')),
    },
    include: { sector: { select: { name: true, icon: true, color: true } } },
  });

  return NextResponse.json(commitment);
}
