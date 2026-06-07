import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const facts = await prisma.personalFact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(facts);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { factType, content } = await request.json();
  if (!factType || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const fact = await prisma.personalFact.create({
    data: { userId: user.id, factType, content },
  });
  return NextResponse.json(fact);
}
