import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const prospect = await prisma.prospect.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      pipelineStage: true,
      deal: { include: { commissionPayments: { orderBy: { paymentDate: 'desc' } } } },
      touches: { orderBy: { touchDate: 'desc' } },
      discoveryResponses: { include: { question: true }, orderBy: { capturedAt: 'asc' } },
      prospectObjections: { include: { objection: true }, orderBy: { raisedDate: 'desc' } },
    },
  });

  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prospect);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const {
    restaurantName, location, ownerName, phone, instagram, linkedin,
    source, estimatedTier, pipelineStageId, status, compoundingNotes, lastTouchDate,
  } = body;

  if (pipelineStageId) {
    const stage = await prisma.pipelineStage.findFirst({ where: { id: pipelineStageId, userId: user.id } });
    if (!stage) return NextResponse.json({ error: 'Invalid pipeline stage' }, { status: 400 });
  }

  const updated = await prisma.prospect.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(restaurantName !== undefined && { restaurantName }),
      ...(location !== undefined && { location }),
      ...(ownerName !== undefined && { ownerName }),
      ...(phone !== undefined && { phone }),
      ...(instagram !== undefined && { instagram }),
      ...(linkedin !== undefined && { linkedin }),
      ...(source !== undefined && { source }),
      ...(estimatedTier !== undefined && { estimatedTier }),
      ...(pipelineStageId !== undefined && { pipelineStageId }),
      ...(status !== undefined && { status }),
      ...(compoundingNotes !== undefined && { compoundingNotes }),
      ...(lastTouchDate !== undefined && { lastTouchDate: new Date(lastTouchDate) }),
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prospect = await prisma.prospect.findFirst({
    where: { id: params.id, userId: user.id },
    include: { pipelineStage: true, deal: true, _count: { select: { touches: true, discoveryResponses: true } } },
  });

  return NextResponse.json(prospect);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.prospect.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
