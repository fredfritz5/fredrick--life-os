'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import { getCompletionRate } from '@/lib/utils';
import type { Sector } from '@/types';

interface DailyGoalRaw {
  date: string;
  status: string;
  proof_image_url: string | null;
  manual_override_reason: string | null;
  completed_at: string | null;
  weekly_goal?: {
    monthly_goal?: {
      yearly_goal?: {
        sector_id: string;
        sector?: { id: string; name: string; color: string };
      };
    };
  };
}

interface Props {
  sectors: Sector[];
  dailyGoals: DailyGoalRaw[];
}

export function AnalyticsDashboard({ sectors, dailyGoals }: Props) {
  const [range, setRange] = useState<30 | 90>(30);

  const cutoff = format(subDays(new Date(), range), 'yyyy-MM-dd');
  const filtered = dailyGoals.filter((g) => g.date >= cutoff);

  // --- Daily completion line chart ---
  const allDays = eachDayOfInterval({ start: subDays(new Date(), range - 1), end: new Date() });
  const completionByDay = useMemo(() => {
    const dayMap: Record<string, { completed: number; total: number }> = {};
    for (const day of allDays) {
      dayMap[format(day, 'yyyy-MM-dd')] = { completed: 0, total: 0 };
    }
    for (const g of filtered) {
      if (!dayMap[g.date]) continue;
      dayMap[g.date].total++;
      if (g.status === 'completed') dayMap[g.date].completed++;
    }
    return Object.entries(dayMap).map(([date, { completed, total }]) => ({
      date: format(parseISO(date), 'MMM d'),
      rate: total > 0 ? Math.round((completed / total) * 100) : null,
      completed,
      total,
    }));
  }, [filtered, allDays]);

  // --- Sector radar ---
  const radarData = useMemo(() =>
    sectors.map((sector) => {
      const sectorGoals = filtered.filter((g) =>
        g.weekly_goal?.monthly_goal?.yearly_goal?.sector_id === sector.id
      );
      return {
        sector: sector.name.split(' ')[0],
        rate: getCompletionRate(
          sectorGoals.filter((g) => g.status === 'completed').length,
          sectorGoals.length
        ),
        fullMark: 100,
        color: sector.color,
      };
    }), [sectors, filtered]);

  // --- Honesty index ---
  const honestyData = useMemo(() => {
    const completed = filtered.filter((g) => g.status === 'completed');
    const verifiedProof = completed.filter((g) => g.proof_image_url && !g.manual_override_reason);
    const overrides = completed.filter((g) => !!g.manual_override_reason);
    const noProofRequired = completed.filter((g) => !g.proof_image_url && !g.manual_override_reason);
    return {
      total: completed.length,
      verifiedProof: verifiedProof.length,
      overrides: overrides.length,
      noProofRequired: noProofRequired.length,
      honestyRate: completed.length > 0
        ? Math.round(((verifiedProof.length + noProofRequired.length) / completed.length) * 100)
        : 100,
    };
  }, [filtered]);

  // --- Time of day ---
  const timeOfDayData = useMemo(() => {
    const buckets = { Morning: 0, Afternoon: 0, Evening: 0 };
    for (const g of filtered) {
      if (g.status !== 'completed' || !g.completed_at) continue;
      const hour = new Date(g.completed_at).getHours();
      if (hour < 12) buckets.Morning++;
      else if (hour < 18) buckets.Afternoon++;
      else buckets.Evening++;
    }
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  // --- Sector 7-day rates for alert ---
  const sectorAlerts = useMemo(() => {
    const sevenDaysCutoff = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    return sectors.filter((sector) => {
      const sectorGoals = dailyGoals.filter((g) =>
        g.date >= sevenDaysCutoff &&
        g.weekly_goal?.monthly_goal?.yearly_goal?.sector_id === sector.id
      );
      if (sectorGoals.length < 3) return false;
      const rate = sectorGoals.filter((g) => g.status === 'completed').length / sectorGoals.length;
      return rate < 0.6;
    });
  }, [sectors, dailyGoals]);

  return (
    <div className="space-y-6">
      {sectorAlerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ Sectors below 60% (7-day): {sectorAlerts.map((s) => s.name).join(', ')}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Badge
          variant={range === 30 ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setRange(30)}
        >Last 30 days</Badge>
        <Badge
          variant={range === 90 ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setRange(90)}
        >Last 90 days</Badge>
      </div>

      {/* Completion line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Completion Rate</CardTitle>
          <CardDescription>% of daily goals completed each day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={completionByDay}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={range === 30 ? 4 : 10} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Completion']} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sector radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sector Balance</CardTitle>
            <CardDescription>Completion rate by sector</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <Radar name="Rate" dataKey="rate" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time of day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Time of Day</CardTitle>
            <CardDescription>When do you get things done?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {timeOfDayData.map((entry, i) => (
                    <Cell key={i} fill={['#f59e0b', '#6366f1', '#8b5cf6'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Honesty index */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Honesty Index</CardTitle>
          <CardDescription>What % of completions had verified proof vs manual override</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold text-primary">{honestyData.honestyRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Honesty Rate</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{honestyData.verifiedProof}</div>
              <div className="text-xs text-muted-foreground mt-1">Verified by AI</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{honestyData.overrides}</div>
              <div className="text-xs text-muted-foreground mt-1">Manual Override</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{honestyData.noProofRequired}</div>
              <div className="text-xs text-muted-foreground mt-1">No Proof Needed</div>
            </div>
          </div>

          {honestyData.honestyRate < 70 && honestyData.total > 5 && (
            <div className="mt-4 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
              ⚠️ High override rate detected. Consider if you're being honest with yourself about goal completion.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-sector breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sector Breakdown</CardTitle>
          <CardDescription>Completion rate per sector for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sectors.map((sector) => {
            const sectorGoals = filtered.filter((g) =>
              g.weekly_goal?.monthly_goal?.yearly_goal?.sector_id === sector.id
            );
            const completed = sectorGoals.filter((g) => g.status === 'completed').length;
            const total = sectorGoals.length;
            const rate = getCompletionRate(completed, total);

            return (
              <div key={sector.id} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <span className="text-sm font-medium truncate">{sector.name}</span>
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${rate}%`, backgroundColor: sector.color }}
                  />
                </div>
                <span className="text-sm tabular-nums w-12 text-right">{rate}%</span>
                <span className="text-xs text-muted-foreground w-16 text-right">{completed}/{total}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
