import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const restaurant = await prisma.restaurantResearch.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      quotes: {
        include: { themes: { include: { theme: true } } },
        orderBy: { capturedDate: 'desc' },
      },
    },
  });

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(restaurant);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const {
    restaurantName, location, ownerName, contactInfo, candidateStrength,
    candidateStrengthReasoning, automationAppetite, automationAppetiteNotes,
    digitalComfortLevel, whatsappOrderingLevel, whatsappOrderingNotes,
    mpesaPainPoints, loyaltyComments, status, notes, ordersPerDay, branches,
    lastContactDate, followUpDueDate, dateFirstEngaged,
  } = body;

  await prisma.restaurantResearch.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(restaurantName !== undefined && { restaurantName }),
      ...(location !== undefined && { location }),
      ...(ownerName !== undefined && { ownerName }),
      ...(contactInfo !== undefined && { contactInfo }),
      ...(candidateStrength !== undefined && { candidateStrength }),
      ...(candidateStrengthReasoning !== undefined && { candidateStrengthReasoning }),
      ...(automationAppetite !== undefined && { automationAppetite: Number(automationAppetite) }),
      ...(automationAppetiteNotes !== undefined && { automationAppetiteNotes }),
      ...(digitalComfortLevel !== undefined && { digitalComfortLevel: Number(digitalComfortLevel) }),
      ...(whatsappOrderingLevel !== undefined && { whatsappOrderingLevel }),
      ...(whatsappOrderingNotes !== undefined && { whatsappOrderingNotes }),
      ...(mpesaPainPoints !== undefined && { mpesaPainPoints }),
      ...(loyaltyComments !== undefined && { loyaltyComments }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(ordersPerDay !== undefined && { ordersPerDay: ordersPerDay ? Number(ordersPerDay) : null }),
      ...(branches !== undefined && { branches: branches ? Number(branches) : null }),
      ...(lastContactDate !== undefined && { lastContactDate: lastContactDate ? new Date(lastContactDate) : null }),
      ...(followUpDueDate !== undefined && { followUpDueDate: followUpDueDate ? new Date(followUpDueDate) : null }),
      ...(dateFirstEngaged !== undefined && { dateFirstEngaged: dateFirstEngaged ? new Date(dateFirstEngaged) : null }),
    },
  });

  const updated = await prisma.restaurantResearch.findFirst({
    where: { id: params.id, userId: user.id },
    include: { _count: { select: { quotes: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.restaurantResearch.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
