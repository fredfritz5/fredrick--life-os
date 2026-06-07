import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { courseName, courseCode, semester, year, credits, instructor, status } = await req.json();

  await prisma.academicCourse.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      ...(courseName !== undefined && { courseName }),
      ...(courseCode !== undefined && { courseCode }),
      ...(semester !== undefined && { semester }),
      ...(year !== undefined && { year: year ? Number(year) : null }),
      ...(credits !== undefined && { credits: credits ? Number(credits) : null }),
      ...(instructor !== undefined && { instructor }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  await prisma.academicCourse.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
