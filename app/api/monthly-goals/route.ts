import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const sectorId = searchParams.get('sectorId');

  const goals = await prisma.monthlyGoal.findMany({
    where: {
      userId: user.id,
      ...(sectorId ? { yearlyGoal: { sectorId } } : {}),
    },
    include: { yearlyGoal: { select: { sectorId: true } } },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { yearlyGoalId, year, month, text } = await request.json();
  if (!yearlyGoalId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const now = new Date();
  const goal = await prisma.monthlyGoal.create({
    data: {
      userId: user.id,
      yearlyGoalId,
      year: year ?? now.getFullYear(),
      month: month ?? now.getMonth() + 1,
      text,
    },
  });

  return NextResponse.json(goal);
}
