import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const deals = await prisma.deal.findMany({
    where: { userId: user.id },
    include: {
      prospect: { select: { restaurantName: true, location: true, ownerName: true } },
      commissionPayments: { orderBy: { paymentDate: 'desc' } },
    },
    orderBy: { startDate: 'desc' },
  });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { prospectId, tier, monthlySubscriptionKsh, notesForCompounding } = await req.json();

  if (!prospectId || !tier || !monthlySubscriptionKsh) {
    return NextResponse.json({ error: 'prospectId, tier, monthlySubscriptionKsh required' }, { status: 400 });
  }

  const prospect = await prisma.prospect.findFirst({ where: { id: prospectId, userId: user.id } });
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

  const existing = await prisma.deal.findUnique({ where: { prospectId } });
  if (existing) return NextResponse.json({ error: 'Deal already exists for this prospect' }, { status: 409 });

  const deal = await prisma.deal.create({
    data: {
      userId: user.id,
      prospectId,
      tier,
      monthlySubscriptionKsh: Number(monthlySubscriptionKsh),
      notesForCompounding,
    },
    include: {
      prospect: { select: { restaurantName: true, location: true, ownerName: true } },
      commissionPayments: true,
    },
  });

  // Mark prospect as won
  await prisma.prospect.updateMany({
    where: { id: prospectId, userId: user.id },
    data: { status: 'won' },
  });

  return NextResponse.json(deal, { status: 201 });
}
