import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const objections = await prisma.objection.findMany({
    where: { userId: user.id },
    include: { _count: { select: { prospectObjections: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(objections);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { name, standardResponse } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const objection = await prisma.objection.create({
    data: { userId: user.id, name, standardResponse, isDefault: false },
    include: { _count: { select: { prospectObjections: true } } },
  });

  return NextResponse.json(objection, { status: 201 });
}
