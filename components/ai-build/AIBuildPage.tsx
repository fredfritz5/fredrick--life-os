'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, CheckCircle2, Circle, Clock, Video, BookOpen, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface VideoItem {
  id: string; videoNumber: number; videoTitle: string;
  durationMinutes?: number; status: string; notes?: string; phaseId: string;
}
interface Phase {
  id: string; phaseNumber: number; phaseName: string; description?: string;
  status: string; targetStartDate?: string; actualStartDate?: string; actualEndDate?: string;
  _count: { videos: number; guides: number; labs: number; features: number };
  videos: { id: string; status: string }[];
  labs: { id: string; status: string }[];
}
interface CodeLogEntry {
  id: string; logDate: string; sectorContext?: string;
  whatWasBuilt: string; timeSpentMinutes?: number; blockers?: string; whyQuestion?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'not-started': '#94a3b8', 'in-progress': '#3b82f6', 'complete': '#22c55e',
};

export function AIBuildPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? null;
  const [phaseVideos, setPhaseVideos] = useState<VideoItem[]>([]);
  const [codeLogs, setCodeLogs] = useState<CodeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [addVideoOpen, setAddVideoOpen] = useState(false);

  const loadPhases = useCallback(async () => {
    const res = await fetch('/api/ai-build/phases');
    if (res.ok) setPhases(await res.json());
    setLoading(false);
  }, []);

  const loadCodeLogs = useCallback(async () => {
    const res = await fetch('/api/ai-build/code-log?limit=15');
    if (res.ok) setCodeLogs(await res.json());
  }, []);

  useEffect(() => {
    loadPhases();
    loadCodeLogs();
  }, [loadPhases, loadCodeLogs]);

  async function selectPhase(phase: Phase) {
    setSelectedPhaseId(phase.id);
    const res = await fetch(`/api/ai-build/videos?phaseId=${phase.id}`);
    if (res.ok) setPhaseVideos(await res.json());
  }

  async function updateVideoStatus(videoId: string, status: string) {
    await fetch(`/api/ai-build/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (selectedPhase) {
      setPhaseVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, status } : v));
    }
    loadPhases();
  }

  async function updatePhaseStatus(phaseId: string, status: string) {
    await fetch(`/api/ai-build/phases/${phaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadPhases();
  }

  if (loading) return <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;

  const totalVideos = phases.reduce((s, p) => s + (p._count.videos || 0), 0);
  const watchedVideos = phases.reduce((s, p) => s + p.videos.filter((v) => v.status !== 'not-watched').length, 0);
  const completedPhases = phases.filter((p) => p.status === 'complete').length;
  const currentPhase = phases.find((p) => p.status === 'in-progress') || phases.find((p) => p.status === 'not-started');

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold">{completedPhases}/{phases.length}</p>
          <p className="text-xs text-muted-foreground">Phases Done</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold">{watchedVideos}/{totalVideos}</p>
          <p className="text-xs text-muted-foreground">Videos Watched</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold text-indigo-600">{codeLogs.length}</p>
          <p className="text-xs text-muted-foreground">Code Sessions</p>
        </div>
      </div>

      {currentPhase && (
        <div className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200">
          <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">Current Phase</p>
          <p className="font-medium">Phase {currentPhase.phaseNumber}: {currentPhase.phaseName}</p>
          {totalVideos > 0 && <Progress value={Math.round((watchedVideos / totalVideos) * 100)} className="h-1.5 mt-2" />}
        </div>
      )}

      <Tabs defaultValue="phases">
        <TabsList>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="codelog">Code Log</TabsTrigger>
        </TabsList>

        {/* ── PHASES TAB ── */}
        <TabsContent value="phases" className="mt-4 space-y-2">
          {phases.map((p) => {
            const watched = p.videos.filter((v) => v.status !== 'not-watched').length;
            const pct = p._count.videos > 0 ? Math.round((watched / p._count.videos) * 100) : 0;
            return (
              <div key={p.id} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => selectedPhaseId === p.id ? setSelectedPhaseId(null) : selectPhase(p)}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[p.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Phase {p.phaseNumber}: {p.phaseName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{watched}/{p._count.videos} videos</span>
                      {p._count.labs > 0 && <span className="text-xs text-muted-foreground">{p._count.labs} labs</span>}
                    </div>
                    {p._count.videos > 0 && <Progress value={pct} className="h-1 mt-1.5" />}
                  </div>
                  <div className="flex gap-1">
                    {(['not-started', 'in-progress', 'complete'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={(e) => { e.stopPropagation(); updatePhaseStatus(p.id, s); }}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${p.status === s ? 'text-white border-transparent' : 'text-muted-foreground border-border hover:bg-muted'}`}
                        style={p.status === s ? { backgroundColor: STATUS_COLORS[s] } : {}}
                      >
                        {s === 'not-started' ? 'Not Started' : s === 'in-progress' ? 'Active' : 'Done'}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedPhase?.id === p.id && phaseVideos.length > 0 && (
                  <div className="border-t px-3 pb-3">
                    <div className="space-y-1 mt-2">
                      {phaseVideos.map((v) => (
                        <div key={v.id} className="flex items-center gap-2 py-1">
                          <button onClick={() => updateVideoStatus(v.id, v.status === 'not-watched' ? 'watched' : 'not-watched')}>
                            {v.status !== 'not-watched'
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : <Circle className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          <span className={`text-sm flex-1 ${v.status !== 'not-watched' ? 'line-through text-muted-foreground' : ''}`}>
                            {v.videoNumber}. {v.videoTitle}
                          </span>
                          {v.durationMinutes && <span className="text-xs text-muted-foreground">{v.durationMinutes}m</span>}
                          <select
                            value={v.status}
                            onChange={(e) => updateVideoStatus(v.id, e.target.value)}
                            className="text-xs border rounded px-1 h-6 bg-background"
                          >
                            <option value="not-watched">Not Watched</option>
                            <option value="watched">Watched</option>
                            <option value="rebuilt-from-memory">Rebuilt</option>
                            <option value="varied">Varied</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setAddVideoOpen(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Video to Phase
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ── VIDEOS TAB ── */}
        <TabsContent value="videos" className="mt-4">
          <div className="space-y-4">
            {phases.filter((p) => p._count.videos > 0).map((p) => (
              <div key={p.id}>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide">
                  Phase {p.phaseNumber}: {p.phaseName}
                  <span className="ml-2 font-normal">{p.videos.filter((v) => v.status !== 'not-watched').length}/{p._count.videos}</span>
                </p>
              </div>
            ))}
            {phases.every((p) => p._count.videos === 0) && (
              <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
                <Video className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No videos tracked yet</p>
                <p className="text-xs mt-1">Select a phase and add videos to start tracking</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── CODE LOG TAB ── */}
        <TabsContent value="codelog" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setLogFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log Code Session
          </Button>
          {codeLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{new Date(log.logDate).toLocaleDateString()}</p>
                  <div className="flex gap-2">
                    {log.sectorContext && <Badge variant="outline" className="text-xs">{log.sectorContext}</Badge>}
                    {log.timeSpentMinutes && <span className="text-xs text-muted-foreground">{log.timeSpentMinutes}m</span>}
                  </div>
                </div>
                <p className="text-sm font-medium">{log.whatWasBuilt}</p>
                {log.blockers && <p className="text-xs text-orange-600">🚫 {log.blockers}</p>}
                {log.whyQuestion && <p className="text-xs text-indigo-600 italic">❓ {log.whyQuestion}</p>}
              </CardContent>
            </Card>
          ))}
          {codeLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <p>No code sessions logged yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Session Modal */}
      {logFormOpen && (
        <LogSessionModal
          onClose={() => setLogFormOpen(false)}
          onAdded={() => { setLogFormOpen(false); loadCodeLogs(); }}
        />
      )}

      {/* Add Video Modal */}
      {addVideoOpen && selectedPhase && (
        <AddVideoModal
          phase={selectedPhase}
          onClose={() => setAddVideoOpen(false)}
          onAdded={() => { setAddVideoOpen(false); if (selectedPhase) selectPhase(selectedPhase); loadPhases(); }}
        />
      )}
    </div>
  );
}

function LogSessionModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    whatWasBuilt: '', timeSpentMinutes: '', sectorContext: 'ai-build', blockers: '', whyQuestion: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.whatWasBuilt.trim()) return;
    await fetch('/api/ai-build/code-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    toast.success('Session logged');
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Log Code Session</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Textarea placeholder="What was built? *" value={form.whatWasBuilt} onChange={(e) => setForm({ ...form, whatWasBuilt: e.target.value })} rows={3} required />
          <div className="flex gap-2">
            <Input type="number" placeholder="Minutes" value={form.timeSpentMinutes} onChange={(e) => setForm({ ...form, timeSpentMinutes: e.target.value })} className="flex-1" />
            <select className="flex-1 border rounded-md h-9 px-3 text-sm bg-background" value={form.sectorContext} onChange={(e) => setForm({ ...form, sectorContext: e.target.value })}>
              <option value="ai-build">AI Build</option>
              <option value="pos-sales">POS Sales</option>
              <option value="ai-research">AI Research</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input placeholder="Blockers / gotchas (optional)" value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
          <Input placeholder="WHY question (optional)" value={form.whyQuestion} onChange={(e) => setForm({ ...form, whyQuestion: e.target.value })} />
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">Log Session</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddVideoModal({ phase, onClose, onAdded }: { phase: Phase; onClose: () => void; onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/ai-build/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phaseId: phase.id, videoTitle: title, durationMinutes: duration ? Number(duration) : undefined }),
    });
    toast.success('Video added');
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Video — Phase {phase.phaseNumber}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Video title *" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input type="number" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Add</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
