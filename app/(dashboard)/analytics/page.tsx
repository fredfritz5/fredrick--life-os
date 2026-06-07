import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { format, subDays } from 'date-fns';
import type { Sector } from '@/types';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id: string }).id;
  const today = new Date(format(new Date(), 'yyyy-MM-dd'));
  const ninetyDaysAgo = new Date(format(subDays(new Date(), 90), 'yyyy-MM-dd'));

  const [sectors, dailyGoals] = await Promise.all([
    prisma.sector.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
    prisma.dailyGoal.findMany({
      where: { userId, date: { gte: ninetyDaysAgo, lte: today } },
      select: {
        date: true,
        status: true,
        proofImageUrl: true,
        manualOverrideReason: true,
        completedAt: true,
        weeklyGoal: {
          select: {
            monthlyGoal: {
              select: {
                yearlyGoal: {
                  select: {
                    sectorId: true,
                    sector: { select: { id: true, name: true, color: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Your performance trends across all sectors</p>
      </div>
      <AnalyticsDashboard
        sectors={sectors as Sector[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dailyGoals={dailyGoals as any[]}
      />
    </div>
  );
}
