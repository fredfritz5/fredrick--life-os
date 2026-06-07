import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { status, notes } = await request.json();

  await prisma.accountabilityCommitment.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ updated: true });
}
