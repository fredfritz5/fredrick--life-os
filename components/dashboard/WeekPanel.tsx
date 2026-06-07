'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getSectorIcon, getCompletionRate } from '@/lib/utils';
import type { WeeklyGoal, Sector, DailyGoal } from '@/types';

interface WeekPanelProps {
  weeklyGoals: WeeklyGoal[];
  sectors: Sector[];
  userId: string;
  week: number;
  year: number;
}

export function WeekPanel({ weeklyGoals, sectors, week, year }: WeekPanelProps) {
  if (weeklyGoals.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold">This Week</h2>
        <p className="text-sm text-muted-foreground">Week {week}, {year}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {weeklyGoals.map((wg) => {
          const dailyGoals = (wg.daily_goals || []) as DailyGoal[];
          const completed = dailyGoals.filter((d) => d.status === 'completed').length;
          const total = dailyGoals.length;
          const rate = getCompletionRate(completed, total);

          const sector = (wg as unknown as { monthly_goal?: { yearly_goal?: { sector?: Sector } } })?.monthly_goal?.yearly_goal?.sector;

          return (
            <Card key={wg.id} className="relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: sector?.color || '#6366f1' }}
              />
              <CardHeader className="pb-2 pl-5">
                <CardTitle className="text-sm flex items-center gap-2">
                  {sector && <span className="text-base">{getSectorIcon(sector.icon)}</span>}
                  <span className="flex-1 truncate">{wg.text}</span>
                  <Badge
                    variant={rate === 100 ? 'success' : rate >= 60 ? 'outline' : 'warning'}
                    className="text-xs shrink-0"
                  >
                    {rate}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-5 pb-3">
                <Progress value={rate} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1.5">{completed}/{total} daily goals done</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
