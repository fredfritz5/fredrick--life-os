import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const prospectId = new URL(req.url).searchParams.get('prospectId');
  if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 });

  const touches = await prisma.prospectTouch.findMany({
    where: { userId: user.id, prospectId },
    orderBy: { touchDate: 'desc' },
  });

  return NextResponse.json(touches);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { prospectId, channel, touchType, notes, outcome, touchDate } = body;

  if (!prospectId || !channel || !touchType) {
    return NextResponse.json({ error: 'prospectId, channel, touchType required' }, { status: 400 });
  }

  const prospect = await prisma.prospect.findFirst({ where: { id: prospectId, userId: user.id } });
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

  const touch = await prisma.prospectTouch.create({
    data: {
      userId: user.id,
      prospectId,
      channel,
      touchType,
      notes,
      outcome,
      touchDate: touchDate ? new Date(touchDate) : new Date(),
    },
  });

  // Update prospect lastTouchDate
  await prisma.prospect.updateMany({
    where: { id: prospectId, userId: user.id },
    data: { lastTouchDate: touch.touchDate },
  });

  return NextResponse.json(touch, { status: 201 });
}
