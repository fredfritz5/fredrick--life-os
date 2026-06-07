import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const insights = await prisma.researchInsight.findMany({
    where: { userId: user.id },
    include: { _count: { select: { supportingQuotes: true } } },
    orderBy: { insightDate: 'desc' },
  });

  return NextResponse.json(insights);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { insightText, status } = await req.json();
  if (!insightText) return NextResponse.json({ error: 'insightText required' }, { status: 400 });

  const insight = await prisma.researchInsight.create({
    data: { userId: user.id, insightText, status: status || 'raw' },
    include: { _count: { select: { supportingQuotes: true } } },
  });

  return NextResponse.json(insight, { status: 201 });
}
