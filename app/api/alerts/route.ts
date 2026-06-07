import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { subDays, format } from 'date-fns';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date(format(new Date(), 'yyyy-MM-dd'));
    const sevenDaysAgo = new Date(format(subDays(new Date(), 7), 'yyyy-MM-dd'));

    const [missedGoals, recentGoals] = await Promise.all([
      prisma.dailyGoal.findMany({
        where: { userId: user.id, date: today, status: 'pending' },
        include: {
          weeklyGoal: {
            include: {
              monthlyGoal: {
                include: { yearlyGoal: { include: { sector: { select: { name: true, color: true } } } } },
              },
            },
          },
        },
      }),
      prisma.dailyGoal.findMany({
        where: { userId: user.id, date: { gte: sevenDaysAgo, lte: today } },
        include: {
          weeklyGoal: {
            include: {
              monthlyGoal: {
                include: { yearlyGoal: { include: { sector: { select: { id: true, name: true } } } } },
              },
            },
          },
        },
      }),
    ]);

    const sectorRates: Record<string, { name: string; completed: number; total: number }> = {};
    for (const goal of recentGoals) {
      const sector = goal.weeklyGoal?.monthlyGoal?.yearlyGoal?.sector;
      if (!sector) continue;
      if (!sectorRates[sector.id]) sectorRates[sector.id] = { name: sector.name, completed: 0, total: 0 };
      sectorRates[sector.id].total++;
      if (goal.status === 'completed') sectorRates[sector.id].completed++;
    }

    const decliningAlerts = Object.values(sectorRates)
      .filter(({ completed, total }) => total >= 3 && completed / total < 0.6)
      .map(({ name }) => name);

    return NextResponse.json({ missedGoals, decliningAlerts });
  } catch (err) {
    console.error('Alerts error:', err);
    return NextResponse.json({ missedGoals: [], decliningAlerts: [] });
  }
}
