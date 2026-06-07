import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMonthName, getCompletionRate } from '@/lib/utils';
import type { Sector } from '@/types';

interface MonthSnapshotProps {
  completed: number;
  total: number;
  sectors: Sector[];
  month: number;
  year: number;
}

export function MonthSnapshot({ completed, total, sectors, month, year }: MonthSnapshotProps) {
  const rate = getCompletionRate(completed, total);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold">This Month</h2>
        <p className="text-sm text-muted-foreground">{getMonthName(month)} {year}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Month-to-Date Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <Progress value={rate} className="flex-1 h-3" />
            <span className="text-2xl font-bold tabular-nums">{rate}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {completed} of {total} daily goals completed so far this month
          </p>

          {rate < 60 && total > 5 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ Below 60% target — time to push harder
            </p>
          )}
          {rate >= 80 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              🔥 Strong month — keep the momentum!
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
