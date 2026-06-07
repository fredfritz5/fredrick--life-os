import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const prospectId = new URL(req.url).searchParams.get('prospectId');
  if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 });

  const responses = await prisma.discoveryResponse.findMany({
    where: { userId: user.id, prospectId },
    include: { question: true },
    orderBy: { capturedAt: 'asc' },
  });

  return NextResponse.json(responses);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { prospectId, questionId, responseText } = await req.json();
  if (!prospectId || !questionId || !responseText) {
    return NextResponse.json({ error: 'prospectId, questionId, responseText required' }, { status: 400 });
  }

  // Update existing or create new
  const existing = await prisma.discoveryResponse.findFirst({
    where: { userId: user.id, prospectId, questionId },
  });

  let response;
  if (existing) {
    response = await prisma.discoveryResponse.update({
      where: { id: existing.id },
      data: { responseText, capturedAt: new Date() },
      include: { question: true },
    });
  } else {
    response = await prisma.discoveryResponse.create({
      data: { userId: user.id, prospectId, questionId, responseText },
      include: { question: true },
    });
  }

  return NextResponse.json(response, { status: 201 });
}
