import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { questionText, category } = await req.json();

  await prisma.discoveryQuestion.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(questionText !== undefined && { questionText }),
      ...(category !== undefined && { category }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.discoveryQuestion.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
