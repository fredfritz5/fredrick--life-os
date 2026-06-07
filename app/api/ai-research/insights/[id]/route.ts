import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { insightText, status } = await req.json();

  await prisma.researchInsight.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(insightText !== undefined && { insightText }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.researchInsight.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
