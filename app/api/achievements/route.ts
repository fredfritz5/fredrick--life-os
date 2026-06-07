import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 5,
  });
  return NextResponse.json(achievements);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { title, description } = await request.json();
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const achievement = await prisma.achievement.create({
    data: {
      userId: user.id,
      title,
      description: description || null,
      date: new Date(format(new Date(), 'yyyy-MM-dd')),
    },
  });
  return NextResponse.json(achievement);
}
