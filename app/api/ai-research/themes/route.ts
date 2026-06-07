import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const themes = await prisma.researchTheme.findMany({
    where: { userId: user.id },
    include: { _count: { select: { quotes: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(themes);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { themeName, description, color } = await req.json();
  if (!themeName) return NextResponse.json({ error: 'themeName required' }, { status: 400 });

  const theme = await prisma.researchTheme.create({
    data: { userId: user.id, themeName, description, color: color || '#6366f1' },
    include: { _count: { select: { quotes: true } } },
  });

  return NextResponse.json(theme, { status: 201 });
}
