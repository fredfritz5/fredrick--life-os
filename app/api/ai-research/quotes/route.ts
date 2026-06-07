import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const restaurantId = new URL(req.url).searchParams.get('restaurantId');
  const themeId = new URL(req.url).searchParams.get('themeId');

  const quotes = await prisma.restaurantQuote.findMany({
    where: {
      userId: user.id,
      ...(restaurantId && { restaurantResearchId: restaurantId }),
      ...(themeId && { themes: { some: { themeId } } }),
    },
    include: {
      restaurant: { select: { restaurantName: true } },
      themes: { include: { theme: true } },
    },
    orderBy: { capturedDate: 'desc' },
  });

  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { restaurantResearchId, quoteText, context, themeIds } = await req.json();
  if (!restaurantResearchId || !quoteText) {
    return NextResponse.json({ error: 'restaurantResearchId and quoteText required' }, { status: 400 });
  }

  const quote = await prisma.restaurantQuote.create({
    data: {
      userId: user.id,
      restaurantResearchId,
      quoteText,
      context,
      ...(themeIds?.length && {
        themes: {
          create: (themeIds as string[]).map((themeId) => ({ themeId })),
        },
      }),
    },
    include: {
      restaurant: { select: { restaurantName: true } },
      themes: { include: { theme: true } },
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
