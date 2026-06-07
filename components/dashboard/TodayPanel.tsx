'use client';

import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyGoalCard } from '@/components/goals/DailyGoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { getSectorIcon, formatDate, getTodayString } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { DailyGoal, Sector, WeeklyGoal } from '@/types';

interface TodayPanelProps {
  goals: DailyGoal[];
  sectors: Sector[];
  userId: string;
}

export function TodayPanel({ goals: initialGoals, sectors, userId: _userId }: TodayPanelProps) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [addOpen, setAddOpen] = useState(false);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);

  const today = getTodayString();
  const completed = goals.filter((g) => g.status === 'completed').length;
  const total = goals.length;

  const refreshGoals = useCallback(async () => {
    const res = await fetch(`/api/daily-goals?date=${today}`);
    if (res.ok) {
      const data = await res.json();
      setGoals(data as DailyGoal[]);
    }
    router.refresh();
  }, [today, router]);

  async function openAddGoal() {
    const res = await fetch('/api/weekly-goals');
    if (res.ok) {
      const data = await res.json();
      setWeeklyGoals(data as WeeklyGoal[]);
    }
    setAddOpen(true);
  }

  const bySector: Record<string, { sector: Sector; goals: DailyGoal[] }> = {};
  for (const goal of goals) {
    const sectorData = (goal.weeklyGoal as unknown as { monthlyGoal?: { yearlyGoal?: { sector?: Sector } } })?.monthlyGoal?.yearlyGoal?.sector
      ?? (goal.weekly_goal as unknown as { monthly_goal?: { yearly_goal?: { sector?: Sector } } })?.monthly_goal?.yearly_goal?.sector;
    if (!sectorData) continue;
    if (!bySector[sectorData.id]) bySector[sectorData.id] = { sector: sectorData, goals: [] };
    bySector[sectorData.id].goals.push(goal);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Today</h2>
          <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={completed === total && total > 0 ? 'success' : 'outline'} className="text-sm px-3">
            {completed}/{total} done
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshGoals}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={openAddGoal}>
            <Plus className="h-4 w-4 mr-1" /> Add Goal
          </Button>
        </div>
      </div>

      {total === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">No goals for today yet</p>
            <p className="text-sm mb-4">Add your first daily goal to get started</p>
            <Button onClick={openAddGoal}>
              <Plus className="h-4 w-4 mr-1" /> Add Today's First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.values(bySector).map(({ sector, goals: sectorGoals }) => {
            const sCompleted = sectorGoals.filter((g) => g.status === 'completed').length;
            return (
              <Card key={sector.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{getSectorIcon(sector.icon)}</span>
                    <span>{sector.name}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto text-xs"
                      style={{ borderColor: sector.color, color: sector.color }}
                    >
                      {sCompleted}/{sectorGoals.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sectorGoals.map((goal) => (
                    <DailyGoalCard
                      key={goal.id}
                      goal={goal}
                      sector={sector}
                      onUpdate={refreshGoals}
                      compact
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {goals.filter((g) => {
            const s1 = (g.weeklyGoal as unknown as { monthlyGoal?: { yearlyGoal?: { sector?: unknown } } })?.monthlyGoal?.yearlyGoal?.sector;
            const s2 = (g.weekly_goal as unknown as { monthly_goal?: { yearly_goal?: { sector?: unknown } } })?.monthly_goal?.yearly_goal?.sector;
            return !s1 && !s2;
          }).map((goal) => {
            const fallbackSector = sectors[0] || { id: '', name: 'Unknown', icon: 'circle', color: '#666', user_id: '', description: null, verification_criteria: null, vision_required: true, order: 0, created_at: '' };
            return <DailyGoalCard key={goal.id} goal={goal} sector={fallbackSector} onUpdate={refreshGoals} />;
          })}
        </div>
      )}

      <AddGoalModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={refreshGoals}
        level="daily"
        weeklyGoals={weeklyGoals}
      />
    </section>
  );
}
