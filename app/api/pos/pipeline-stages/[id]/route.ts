import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { name, color, sortOrder } = await req.json();

  await prisma.pipelineStage.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const prospectCount = await prisma.prospect.count({
    where: { pipelineStageId: params.id, userId: user.id },
  });

  if (prospectCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${prospectCount} prospect(s) are in this stage. Move them first.` },
      { status: 409 }
    );
  }

  await prisma.pipelineStage.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
