import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const weekParam = new URL(req.url).searchParams.get('week');
  const weekStart = weekParam ? new Date(weekParam) : getMondayOfWeek(new Date());

  const target = await prisma.weeklySalesTarget.findUnique({
    where: { userId_weekStarting: { userId: user.id, weekStarting: weekStart } },
  });

  return NextResponse.json(target);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const {
    weekStarting,
    contactsTarget, discoveriesTarget, demosTarget, closesTarget,
    contactsActual, discoveriesActual, demosActual, closesActual,
    reflectionNote,
  } = body;

  const weekStart = weekStarting ? new Date(weekStarting) : getMondayOfWeek(new Date());

  const target = await prisma.weeklySalesTarget.upsert({
    where: { userId_weekStarting: { userId: user.id, weekStarting: weekStart } },
    create: {
      userId: user.id,
      weekStarting: weekStart,
      contactsTarget: contactsTarget ?? 0,
      discoveriesTarget: discoveriesTarget ?? 0,
      demosTarget: demosTarget ?? 0,
      closesTarget: closesTarget ?? 0,
      contactsActual: contactsActual ?? 0,
      discoveriesActual: discoveriesActual ?? 0,
      demosActual: demosActual ?? 0,
      closesActual: closesActual ?? 0,
      reflectionNote,
    },
    update: {
      ...(contactsTarget !== undefined && { contactsTarget }),
      ...(discoveriesTarget !== undefined && { discoveriesTarget }),
      ...(demosTarget !== undefined && { demosTarget }),
      ...(closesTarget !== undefined && { closesTarget }),
      ...(contactsActual !== undefined && { contactsActual }),
      ...(discoveriesActual !== undefined && { discoveriesActual }),
      ...(demosActual !== undefined && { demosActual }),
      ...(closesActual !== undefined && { closesActual }),
      ...(reflectionNote !== undefined && { reflectionNote }),
    },
  });

  return NextResponse.json(target);
}
