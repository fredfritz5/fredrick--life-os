import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { themeName, description, color } = await req.json();

  await prisma.researchTheme.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(themeName !== undefined && { themeName }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.researchTheme.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
