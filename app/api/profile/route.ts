import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { displayName, currentFocus, bio } = body;

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(displayName !== undefined && { displayName }),
      ...(currentFocus !== undefined && { currentFocus }),
      ...(bio !== undefined && { bio }),
    },
    create: {
      userId: user.id,
      displayName: displayName || 'Fredrick Ochieng',
      currentFocus: currentFocus || null,
      bio: bio || null,
    },
  });

  return NextResponse.json(profile);
}
