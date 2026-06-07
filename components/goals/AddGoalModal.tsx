'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrentYear, getCurrentMonth, getCurrentWeekNumber, getTodayString } from '@/lib/utils';
import type { Sector, YearlyGoal, MonthlyGoal, WeeklyGoal } from '@/types';

type GoalLevel = 'yearly' | 'monthly' | 'weekly' | 'daily';

interface AddGoalModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  level: GoalLevel;
  sector?: Sector;
  yearlyGoals?: YearlyGoal[];
  monthlyGoals?: MonthlyGoal[];
  weeklyGoals?: WeeklyGoal[];
  preselectedParentId?: string;
}

export function AddGoalModal({
  open, onClose, onAdded, level,
  sector, yearlyGoals, monthlyGoals, weeklyGoals, preselectedParentId,
}: AddGoalModalProps) {
  const [text, setText] = useState('');
  const [parentId, setParentId] = useState(preselectedParentId || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) { toast.error('Please enter goal text'); return; }
    setSaving(true);
    try {
      let url = '';
      let body: Record<string, unknown> = { text: text.trim() };

      if (level === 'yearly') {
        if (!sector) throw new Error('Sector required');
        url = '/api/yearly-goals';
        body = { text: text.trim(), sectorId: sector.id, year: getCurrentYear() };
      } else if (level === 'monthly') {
        if (!parentId) throw new Error('Select a yearly goal');
        url = '/api/monthly-goals';
        body = { text: text.trim(), yearlyGoalId: parentId, year: getCurrentYear(), month: getCurrentMonth() };
      } else if (level === 'weekly') {
        if (!parentId) throw new Error('Select a monthly goal');
        url = '/api/weekly-goals';
        body = { text: text.trim(), monthlyGoalId: parentId, year: getCurrentYear(), weekNumber: getCurrentWeekNumber() };
      } else {
        if (!parentId) throw new Error('Select a weekly goal');
        url = '/api/daily-goals';
        body = { text: text.trim(), weeklyGoalId: parentId, date: getTodayString() };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save goal');
      }

      toast.success('Goal added!');
      setText('');
      setParentId(preselectedParentId || '');
      onAdded();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  }

  const levelLabel = { yearly: 'Yearly', monthly: 'Monthly', weekly: 'Weekly', daily: 'Daily' }[level];
  const placeholder = {
    yearly: 'e.g. Launch MVP of AI restaurant platform',
    monthly: 'e.g. Complete backend API for order management',
    weekly: 'e.g. Build and test the payment integration',
    daily: 'e.g. Write payment webhook handler',
  }[level];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {levelLabel} Goal</DialogTitle>
          <DialogDescription>
            {sector ? `For sector: ${sector.name}` : 'Set a concrete, achievable goal'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {level !== 'yearly' && (
            <div className="space-y-2">
              <Label>
                {level === 'monthly' ? 'Yearly Goal' : level === 'weekly' ? 'Monthly Goal' : 'Weekly Goal'}
              </Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent goal…" />
                </SelectTrigger>
                <SelectContent>
                  {level === 'monthly' && yearlyGoals?.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.text}</SelectItem>
                  ))}
                  {level === 'weekly' && monthlyGoals?.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.text}</SelectItem>
                  ))}
                  {level === 'daily' && weeklyGoals?.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{levelLabel} Goal</Label>
            <Input
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Goal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
