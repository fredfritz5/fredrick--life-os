import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';
import { getWeek, getYear } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const sectorId = searchParams.get('sectorId');

  const goals = await prisma.weeklyGoal.findMany({
    where: {
      userId: user.id,
      ...(sectorId ? { monthlyGoal: { yearlyGoal: { sectorId } } } : {}),
    },
    include: {
      dailyGoals: true,
      monthlyGoal: {
        include: { yearlyGoal: { include: { sector: true } } },
      },
    },
    orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { monthlyGoalId, year, weekNumber, text } = await request.json();
  if (!monthlyGoalId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const now = new Date();
  const goal = await prisma.weeklyGoal.create({
    data: {
      userId: user.id,
      monthlyGoalId,
      year: year ?? getYear(now),
      weekNumber: weekNumber ?? getWeek(now, { weekStartsOn: 1 }),
      text,
    },
  });

  return NextResponse.json(goal);
}
