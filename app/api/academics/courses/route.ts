import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const courses = await prisma.academicCourse.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { assignments: true, studySessions: true } },
      assignments: { select: { id: true, status: true, dueDate: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { courseName, courseCode, semester, year, credits, instructor, status } = await req.json();
  if (!courseName) return NextResponse.json({ error: 'courseName required' }, { status: 400 });

  const course = await prisma.academicCourse.create({
    data: {
      userId: user.id,
      courseName,
      courseCode,
      semester,
      year: year ? Number(year) : null,
      credits: credits ? Number(credits) : null,
      instructor,
      status: status || 'current',
    },
    include: { _count: { select: { assignments: true, studySessions: true } } },
  });

  return NextResponse.json(course, { status: 201 });
}
