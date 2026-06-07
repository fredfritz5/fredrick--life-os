import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const courseId = new URL(req.url).searchParams.get('courseId');
  const status = new URL(req.url).searchParams.get('status');

  const assignments = await prisma.academicAssignment.findMany({
    where: {
      userId: user.id,
      ...(courseId && { courseId }),
      ...(status && { status }),
    },
    include: { course: { select: { courseName: true, courseCode: true } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { courseId, assignmentName, type, dueDate, notes } = await req.json();
  if (!courseId || !assignmentName) {
    return NextResponse.json({ error: 'courseId and assignmentName required' }, { status: 400 });
  }

  const course = await prisma.academicCourse.findFirst({ where: { id: courseId, userId: user.id } });
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  const assignment = await prisma.academicAssignment.create({
    data: {
      userId: user.id,
      courseId,
      assignmentName,
      type: type || 'homework',
      notes,
      ...(dueDate && { dueDate: new Date(dueDate) }),
    },
    include: { course: { select: { courseName: true, courseCode: true } } },
  });

  return NextResponse.json(assignment, { status: 201 });
}
