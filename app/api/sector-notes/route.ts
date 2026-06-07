import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const sectorId = searchParams.get('sectorId');
  if (!sectorId) return NextResponse.json({ error: 'sectorId required' }, { status: 400 });

  const notes = await prisma.sectorNote.findMany({
    where: { userId: user.id, sectorId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { sectorId, text } = await request.json();
  if (!sectorId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const note = await prisma.sectorNote.create({
    data: {
      userId: user.id,
      sectorId,
      text,
      date: new Date(format(new Date(), 'yyyy-MM-dd')),
    },
  });

  return NextResponse.json(note);
}
