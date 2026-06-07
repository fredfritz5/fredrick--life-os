import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const questions = await prisma.discoveryQuestion.findMany({
    where: { userId: user.id },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { category, questionText } = await req.json();
  if (!category || !questionText) {
    return NextResponse.json({ error: 'category and questionText required' }, { status: 400 });
  }

  const maxOrder = await prisma.discoveryQuestion.aggregate({
    where: { userId: user.id, category },
    _max: { sortOrder: true },
  });

  const question = await prisma.discoveryQuestion.create({
    data: {
      userId: user.id,
      category,
      questionText,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      isDefault: false,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
