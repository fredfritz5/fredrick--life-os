import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { assignmentName, type, dueDate, status, grade, notes } = await req.json();

  await prisma.academicAssignment.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(assignmentName !== undefined && { assignmentName }),
      ...(type !== undefined && { type }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status !== undefined && { status }),
      ...(grade !== undefined && { grade }),
      ...(notes !== undefined && { notes }),
    },
  });

  const updated = await prisma.academicAssignment.findFirst({
    where: { id: params.id, userId: user.id },
    include: { course: { select: { courseName: true, courseCode: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.academicAssignment.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
