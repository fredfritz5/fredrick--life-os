import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { quoteText, context, themeIds } = await req.json();

  await prisma.restaurantQuote.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(quoteText !== undefined && { quoteText }),
      ...(context !== undefined && { context }),
    },
  });

  // Update themes if provided
  if (themeIds !== undefined) {
    await prisma.quoteTheme.deleteMany({ where: { quoteId: params.id } });
    if (themeIds.length > 0) {
      await prisma.quoteTheme.createMany({
        data: (themeIds as string[]).map((themeId) => ({ quoteId: params.id, themeId })),
      });
    }
  }

  const quote = await prisma.restaurantQuote.findUnique({
    where: { id: params.id },
    include: {
      restaurant: { select: { restaurantName: true } },
      themes: { include: { theme: true } },
    },
  });

  return NextResponse.json(quote);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.restaurantQuote.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
