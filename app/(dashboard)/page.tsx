import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TodayPanel } from '@/components/dashboard/TodayPanel';
import { WeekPanel } from '@/components/dashboard/WeekPanel';
import { MonthSnapshot } from '@/components/dashboard/MonthSnapshot';
import { PersonalSection } from '@/components/dashboard/PersonalSection';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { getTodayString, getCurrentWeekNumber, getCurrentYear, getCurrentMonth } from '@/lib/utils';
import { format } from 'date-fns';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id: string }).id;
  const today = new Date(getTodayString());
  const week = getCurrentWeekNumber();
  const year = getCurrentYear();
  const month = getCurrentMonth();
  const monthStart = new Date(`${year}-${String(month).padStart(2, '0')}-01`);

  const [profile, sectors, todayGoals, weeklyGoals, personalFacts, achievements, monthGoals] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.sector.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
      prisma.dailyGoal.findMany({
        where: { userId, date: today },
        include: {
          weeklyGoal: {
            include: {
              monthlyGoal: {
                include: { yearlyGoal: { include: { sector: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.weeklyGoal.findMany({
        where: { userId, year, weekNumber: week },
        include: {
          dailyGoals: true,
          monthlyGoal: {
            include: { yearlyGoal: { include: { sector: true } } },
          },
        },
      }),
      prisma.personalFact.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.achievement.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.dailyGoal.findMany({
        where: { userId, date: { gte: monthStart, lte: today } },
        select: { status: true },
      }),
    ]);

  const monthTotal = monthGoals.length;
  const monthCompleted = monthGoals.filter((g: { status: string }) => g.status === 'completed').length;

  return (
    <div className="space-y-8">
      <ProfileHeader profile={profile} userId={userId} />

      <TodayPanel
        goals={todayGoals as never[]}
        sectors={sectors as never[]}
        userId={userId}
      />

      <WeekPanel
        weeklyGoals={weeklyGoals as never[]}
        sectors={sectors as never[]}
        userId={userId}
        week={week}
        year={year}
      />

      <MonthSnapshot
        completed={monthCompleted}
        total={monthTotal}
        sectors={sectors as never[]}
        month={month}
        year={year}
      />

      <PersonalSection
        facts={personalFacts as never[]}
        achievements={achievements as never[]}
        userId={userId}
      />
    </div>
  );
}
