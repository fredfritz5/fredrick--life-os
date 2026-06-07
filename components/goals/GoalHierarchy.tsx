'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DailyGoalCard } from './DailyGoalCard';
import { AddGoalModal } from './AddGoalModal';
import { getCompletionRate, getCurrentYear, getCurrentMonth, getCurrentWeekNumber } from '@/lib/utils';
import type { YearlyGoal, MonthlyGoal, WeeklyGoal, DailyGoal, Sector } from '@/types';

interface GoalHierarchyProps {
  sector: Sector;
  yearlyGoals: YearlyGoal[];
  monthlyGoals: MonthlyGoal[];
  weeklyGoals: WeeklyGoal[];
  dailyGoals: DailyGoal[];
  onRefresh: () => void;
}

export function GoalHierarchy({ sector, yearlyGoals, monthlyGoals, weeklyGoals, dailyGoals, onRefresh }: GoalHierarchyProps) {
  const [expandedYearly, setExpandedYearly] = useState<Set<string>>(new Set(yearlyGoals.map((g) => g.id)));
  const [expandedMonthly, setExpandedMonthly] = useState<Set<string>>(new Set());
  const [addModal, setAddModal] = useState<{ level: 'yearly' | 'monthly' | 'weekly' | 'daily'; parentId?: string } | null>(null);

  const currentYear = getCurrentYear();
  const currentMonth = getCurrentMonth();
  const currentWeek = getCurrentWeekNumber();

  // Calculate completions
  function getWeeklyProgress(wg: WeeklyGoal): number {
    const wgDailyGoals = dailyGoals.filter((d) => (d.weeklyGoalId ?? d.weekly_goal_id) === wg.id);
    return getCompletionRate(wgDailyGoals.filter((d) => d.status === 'completed').length, wgDailyGoals.length);
  }

  function getMonthlyProgress(mg: MonthlyGoal): number {
    const mgWeekly = weeklyGoals.filter((w) => (w.monthlyGoalId ?? w.monthly_goal_id) === mg.id);
    if (mgWeekly.length === 0) return 0;
    return Math.round(mgWeekly.reduce((sum, w) => sum + getWeeklyProgress(w), 0) / mgWeekly.length);
  }

  function getYearlyProgress(yg: YearlyGoal): number {
    const ygMonthly = monthlyGoals.filter((m) => (m.yearlyGoalId ?? m.yearly_goal_id) === yg.id);
    if (ygMonthly.length === 0) return 0;
    return Math.round(ygMonthly.reduce((sum, m) => sum + getMonthlyProgress(m), 0) / ygMonthly.length);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Goals</h3>
        <Button size="sm" variant="outline" onClick={() => setAddModal({ level: 'yearly' })}>
          <Plus className="h-4 w-4 mr-1" /> Yearly Goal
        </Button>
      </div>

      {yearlyGoals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <p className="mb-3">No yearly goals yet</p>
          <Button variant="outline" size="sm" onClick={() => setAddModal({ level: 'yearly' })}>
            <Plus className="h-4 w-4 mr-1" /> Add First Yearly Goal
          </Button>
        </div>
      )}

      {yearlyGoals.map((yg) => {
        const ygProgress = getYearlyProgress(yg);
        const isExpanded = expandedYearly.has(yg.id);
        const ygMonthlyGoals = monthlyGoals.filter((m) => (m.yearlyGoalId ?? m.yearly_goal_id) === yg.id);

        return (
          <div key={yg.id} className="border rounded-lg overflow-hidden">
            {/* Yearly goal header */}
            <div
              className="flex items-center gap-3 p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedYearly((prev) => {
                const next = new Set(prev);
                next.has(yg.id) ? next.delete(yg.id) : next.add(yg.id);
                return next;
              })}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Yearly {yg.year}</span>
                  <Badge variant="outline" className="text-xs">{ygProgress}%</Badge>
                </div>
                <p className="text-sm font-medium mt-0.5">{yg.text}</p>
                <Progress value={ygProgress} className="h-1 mt-2" />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); setAddModal({ level: 'monthly', parentId: yg.id }); }}
              >
                <Plus className="h-3 w-3 mr-1" /> Monthly
              </Button>
            </div>

            {isExpanded && (
              <div className="p-3 space-y-3 bg-background">
                {ygMonthlyGoals.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No monthly goals yet.{' '}
                    <button className="underline" onClick={() => setAddModal({ level: 'monthly', parentId: yg.id })}>Add one</button>
                  </p>
                )}

                {ygMonthlyGoals.map((mg) => {
                  const mgProgress = getMonthlyProgress(mg);
                  const mgExpanded = expandedMonthly.has(mg.id);
                  const mgWeeklyGoals = weeklyGoals.filter((w) => (w.monthlyGoalId ?? w.monthly_goal_id) === mg.id);
                  const isCurrentMonth = mg.month === currentMonth && mg.year === currentYear;

                  return (
                    <div key={mg.id} className="border rounded-lg overflow-hidden">
                      {/* Monthly goal row */}
                      <div
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors ${isCurrentMonth ? 'bg-primary/5' : ''}`}
                        onClick={() => setExpandedMonthly((prev) => {
                          const next = new Set(prev);
                          next.has(mg.id) ? next.delete(mg.id) : next.add(mg.id);
                          return next;
                        })}
                      >
                        {mgExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Month {mg.month}</span>
                            {isCurrentMonth && <Badge variant="outline" className="text-xs py-0 px-1">Current</Badge>}
                            <Badge variant="outline" className="text-xs ml-auto">{mgProgress}%</Badge>
                          </div>
                          <p className="text-sm mt-0.5">{mg.text}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-6 text-xs px-2"
                          onClick={(e) => { e.stopPropagation(); setAddModal({ level: 'weekly', parentId: mg.id }); }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {mgExpanded && (
                        <div className="px-4 pb-3 space-y-2 bg-background border-t">
                          {mgWeeklyGoals.length === 0 && (
                            <p className="text-xs text-muted-foreground py-2">
                              No weekly goals.{' '}
                              <button className="underline" onClick={() => setAddModal({ level: 'weekly', parentId: mg.id })}>Add one</button>
                            </p>
                          )}

                          {mgWeeklyGoals.map((wg) => {
                            const wgProgress = getWeeklyProgress(wg);
                            const wgDailyGoals = dailyGoals.filter((d) => (d.weeklyGoalId ?? d.weekly_goal_id) === wg.id);
                            const isCurrentWeek = (wg.weekNumber ?? wg.week_number) === currentWeek && wg.year === currentYear;

                            return (
                              <div key={wg.id} className="border rounded-md overflow-hidden">
                                <div className={`flex items-center gap-2 p-2 ${isCurrentWeek ? 'bg-primary/5' : 'bg-muted/20'}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">Wk {wg.weekNumber ?? wg.week_number}</span>
                                      {isCurrentWeek && <Badge variant="outline" className="text-xs py-0 px-1">Current</Badge>}
                                      <Badge variant="outline" className="text-xs ml-auto">{wgProgress}%</Badge>
                                    </div>
                                    <p className="text-xs font-medium mt-0.5">{wg.text}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0 h-6 text-xs px-2"
                                    onClick={() => setAddModal({ level: 'daily', parentId: wg.id })}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                {wgDailyGoals.length > 0 && (
                                  <div className="p-2 space-y-1 bg-background">
                                    {wgDailyGoals.map((dg) => (
                                      <DailyGoalCard key={dg.id} goal={dg} sector={sector} onUpdate={onRefresh} compact />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {addModal && (
        <AddGoalModal
          open
          onClose={() => setAddModal(null)}
          onAdded={() => { setAddModal(null); onRefresh(); }}
          level={addModal.level}
          sector={sector}
          yearlyGoals={yearlyGoals}
          monthlyGoals={monthlyGoals}
          weeklyGoals={weeklyGoals}
          preselectedParentId={addModal.parentId}
        />
      )}
    </div>
  );
}
