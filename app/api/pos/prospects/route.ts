import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const stageId = searchParams.get('stageId');

  const prospects = await prisma.prospect.findMany({
    where: {
      userId: user.id,
      ...(status && { status }),
      ...(stageId && { pipelineStageId: stageId }),
    },
    include: {
      pipelineStage: true,
      deal: true,
      _count: { select: { touches: true, discoveryResponses: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(prospects);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { restaurantName, location, ownerName, phone, instagram, linkedin, source, estimatedTier, pipelineStageId } = body;

  if (!restaurantName || !pipelineStageId) {
    return NextResponse.json({ error: 'restaurantName and pipelineStageId are required' }, { status: 400 });
  }

  // Verify stage belongs to user
  const stage = await prisma.pipelineStage.findFirst({ where: { id: pipelineStageId, userId: user.id } });
  if (!stage) return NextResponse.json({ error: 'Invalid pipeline stage' }, { status: 400 });

  const prospect = await prisma.prospect.create({
    data: {
      userId: user.id,
      restaurantName,
      location,
      ownerName,
      phone,
      instagram,
      linkedin,
      source,
      estimatedTier: estimatedTier || 'unknown',
      pipelineStageId,
    },
    include: { pipelineStage: true, deal: true, _count: { select: { touches: true, discoveryResponses: true } } },
  });

  return NextResponse.json(prospect, { status: 201 });
}
