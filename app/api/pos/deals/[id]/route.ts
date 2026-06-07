import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { tier, monthlySubscriptionKsh, status, notesForCompounding } = await req.json();

  await prisma.deal.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(tier !== undefined && { tier }),
      ...(monthlySubscriptionKsh !== undefined && { monthlySubscriptionKsh: Number(monthlySubscriptionKsh) }),
      ...(status !== undefined && { status }),
      ...(notesForCompounding !== undefined && { notesForCompounding }),
    },
  });

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      prospect: { select: { restaurantName: true, location: true, ownerName: true } },
      commissionPayments: { orderBy: { paymentDate: 'desc' } },
    },
  });

  return NextResponse.json(deal);
}
