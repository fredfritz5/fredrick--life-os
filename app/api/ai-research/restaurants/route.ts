import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const status = new URL(req.url).searchParams.get('status');

  const restaurants = await prisma.restaurantResearch.findMany({
    where: { userId: user.id, ...(status && { status }) },
    include: {
      _count: { select: { quotes: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(restaurants);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { restaurantName, location, ownerName, contactInfo, candidateStrength, automationAppetite, digitalComfortLevel } = body;

  if (!restaurantName) return NextResponse.json({ error: 'restaurantName required' }, { status: 400 });

  const restaurant = await prisma.restaurantResearch.create({
    data: {
      userId: user.id,
      restaurantName,
      location,
      ownerName,
      contactInfo,
      candidateStrength: candidateStrength || 'Medium',
      automationAppetite: automationAppetite ? Number(automationAppetite) : 3,
      digitalComfortLevel: digitalComfortLevel ? Number(digitalComfortLevel) : 3,
    },
    include: { _count: { select: { quotes: true } } },
  });

  return NextResponse.json(restaurant, { status: 201 });
}
