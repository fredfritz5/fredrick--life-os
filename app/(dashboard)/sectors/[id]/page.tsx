'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GoalHierarchy } from '@/components/goals/GoalHierarchy';
import { getSectorIcon, getCurrentYear } from '@/lib/utils';
import { toast } from 'sonner';
import type { Sector, YearlyGoal, MonthlyGoal, WeeklyGoal, DailyGoal, SectorNote, AccountabilityCommitment } from '@/types';

export default function SectorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sector, setSector] = useState<Sector | null>(null);
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [notes, setNotes] = useState<SectorNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [commitments, setCommitments] = useState<AccountabilityCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sectorsRes, ygRes, mgRes, wgRes, dgRes, notesRes, commitmentsRes] = await Promise.all([
        fetch('/api/sectors'),
        fetch(`/api/yearly-goals?sectorId=${id}`),
        fetch(`/api/monthly-goals?sectorId=${id}`),
        fetch(`/api/weekly-goals?sectorId=${id}`),
        fetch(`/api/daily-goals?sectorId=${id}&year=${getCurrentYear() - 1}`),
        fetch(`/api/sector-notes?sectorId=${id}`),
        fetch(`/api/accountability?sectorId=${id}`),
      ]);

      if (sectorsRes.status === 401) { router.push('/login'); return; }

      const [allSectors, yg, mg, wg, dg, n, c] = await Promise.all([
        sectorsRes.json(), ygRes.json(), mgRes.json(), wgRes.json(),
        dgRes.json(), notesRes.json(), commitmentsRes.json(),
      ]);

      const found = (allSectors as Sector[]).find((s) => s.id === id) || null;
      setSector(found);

      const sectorYearlyIds = new Set((yg as YearlyGoal[]).map((g) => g.id));
      const filteredMonthly = (mg as (MonthlyGoal & { yearlyGoalId?: string })[]).filter(
        (m) => sectorYearlyIds.has(m.yearlyGoalId || (m as unknown as { yearly_goal_id: string }).yearly_goal_id)
      );
      const filteredMonthlyIds = new Set(filteredMonthly.map((m) => m.id));
      const filteredWeekly = (wg as WeeklyGoal[]).filter((w) =>
        filteredMonthlyIds.has(w.monthly_goal_id || (w as unknown as { monthlyGoalId: string }).monthlyGoalId)
      );
      const filteredWeeklyIds = new Set(filteredWeekly.map((w) => w.id));
      const filteredDaily = (dg as DailyGoal[]).filter((d) =>
        filteredWeeklyIds.has(d.weekly_goal_id || (d as unknown as { weeklyGoalId: string }).weeklyGoalId)
      );

      setYearlyGoals(yg as YearlyGoal[]);
      setMonthlyGoals(filteredMonthly as MonthlyGoal[]);
      setWeeklyGoals(filteredWeekly as WeeklyGoal[]);
      setDailyGoals(filteredDaily as DailyGoal[]);
      setNotes(n as SectorNote[]);
      setCommitments(c as AccountabilityCommitment[]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sector data');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveNote() {
    if (!newNote.trim()) return;
    const res = await fetch('/api/sector-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectorId: id, text: newNote }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotes([data as SectorNote, ...notes]);
      setNewNote('');
      toast.success('Note saved');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
  if (!sector) return <div className="text-center py-20 text-muted-foreground">Sector not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${sector.color}20` }}
        >
          {getSectorIcon(sector.icon)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{sector.name}</h1>
          {sector.description && <p className="text-sm text-muted-foreground">{sector.description}</p>}
        </div>
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="notes">Journal</TabsTrigger>
          <TabsTrigger value="commitments">Commitments</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-4">
          <GoalHierarchy
            sector={sector}
            yearlyGoals={yearlyGoals}
            monthlyGoals={monthlyGoals}
            weeklyGoals={weeklyGoals}
            dailyGoals={dailyGoals}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <Textarea
                placeholder={`Journal about your ${sector.name} work today…`}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button className="mt-2" onClick={saveNote} disabled={!newNote.trim()}>
                Save Note
              </Button>
            </CardContent>
          </Card>

          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">{String(note.date)}</p>
                <p className="text-sm whitespace-pre-wrap">{note.text}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="commitments" className="mt-4 space-y-3">
          {commitments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <p>No commitments for this sector yet</p>
              <Link href="/accountability">
                <Button variant="outline" size="sm" className="mt-2">
                  Go to Accountability
                </Button>
              </Link>
            </div>
          ) : (
            commitments.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <span className={`text-sm font-medium ${c.status === 'honored' ? 'text-green-600' : c.status === 'broken' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {c.status === 'honored' ? '✓' : c.status === 'broken' ? '✗' : '○'}
                    </span>
                    <div>
                      <p className="text-sm">{c.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{String(c.date_made)}</p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
