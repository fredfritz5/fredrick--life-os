import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? format(new Date(), 'yyyy-MM-dd');

  const goals = await prisma.dailyGoal.findMany({
    where: { userId: user.id, date: new Date(date) },
    include: {
      weeklyGoal: {
        include: {
          monthlyGoal: {
            include: {
              yearlyGoal: { include: { sector: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { weeklyGoalId, date, text } = await request.json();
  if (!weeklyGoalId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const goal = await prisma.dailyGoal.create({
    data: {
      userId: user.id,
      weeklyGoalId,
      date: new Date(date ?? format(new Date(), 'yyyy-MM-dd')),
      text,
    },
  });

  return NextResponse.json(goal);
}
