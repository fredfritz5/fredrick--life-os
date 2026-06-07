import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const limit = Number(new URL(req.url).searchParams.get('limit') || '20');

  const logs = await prisma.codeLog.findMany({
    where: { userId: user.id },
    orderBy: { logDate: 'desc' },
    take: limit,
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { sectorContext, whatWasBuilt, timeSpentMinutes, blockers, whyQuestion, logDate } = await req.json();

  if (!whatWasBuilt) return NextResponse.json({ error: 'whatWasBuilt required' }, { status: 400 });

  const log = await prisma.codeLog.create({
    data: {
      userId: user.id,
      sectorContext,
      whatWasBuilt,
      timeSpentMinutes: timeSpentMinutes ? Number(timeSpentMinutes) : null,
      blockers,
      whyQuestion,
      ...(logDate && { logDate: new Date(logDate) }),
    },
  });

  return NextResponse.json(log, { status: 201 });
}
