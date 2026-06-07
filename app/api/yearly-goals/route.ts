import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const sectorId = searchParams.get('sectorId');

  const goals = await prisma.yearlyGoal.findMany({
    where: { userId: user.id, ...(sectorId ? { sectorId } : {}) },
    orderBy: { year: 'asc' },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { sectorId, year, text } = await request.json();
  if (!sectorId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const goal = await prisma.yearlyGoal.create({
    data: { userId: user.id, sectorId, year: year ?? new Date().getFullYear(), text },
  });

  return NextResponse.json(goal);
}
