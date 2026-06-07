import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const dealId = new URL(req.url).searchParams.get('dealId');

  const payments = await prisma.commissionPayment.findMany({
    where: {
      userId: user.id,
      ...(dealId && { dealId }),
    },
    include: {
      deal: { include: { prospect: { select: { restaurantName: true } } } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { dealId, amountKsh, paymentDate, notes } = await req.json();
  if (!dealId || !amountKsh) {
    return NextResponse.json({ error: 'dealId and amountKsh required' }, { status: 400 });
  }

  const deal = await prisma.deal.findFirst({ where: { id: dealId, userId: user.id } });
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const payment = await prisma.commissionPayment.create({
    data: {
      userId: user.id,
      dealId,
      amountKsh: Number(amountKsh),
      notes,
      ...(paymentDate && { paymentDate: new Date(paymentDate) }),
    },
    include: { deal: { include: { prospect: { select: { restaurantName: true } } } } },
  });

  return NextResponse.json(payment, { status: 201 });
}
