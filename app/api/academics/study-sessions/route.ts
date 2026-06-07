import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const courseId = new URL(req.url).searchParams.get('courseId');

  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id, ...(courseId && { courseId }) },
    include: { course: { select: { courseName: true } } },
    orderBy: { sessionDate: 'desc' },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { courseId, durationMinutes, topicCovered, keyTakeaways, sessionDate } = await req.json();
  if (!courseId || !durationMinutes) {
    return NextResponse.json({ error: 'courseId and durationMinutes required' }, { status: 400 });
  }

  const course = await prisma.academicCourse.findFirst({ where: { id: courseId, userId: user.id } });
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      courseId,
      durationMinutes: Number(durationMinutes),
      topicCovered,
      keyTakeaways,
      ...(sessionDate && { sessionDate: new Date(sessionDate) }),
    },
    include: { course: { select: { courseName: true } } },
  });

  return NextResponse.json(session, { status: 201 });
}
