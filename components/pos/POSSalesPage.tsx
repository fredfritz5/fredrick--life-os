'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronDown, Trash2, Phone, Check, DollarSign, Target, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────
interface Stage {
  id: string; name: string; sortOrder: number; color: string; isDefault: boolean;
  _count?: { prospects: number };
}
interface ProspectSummary {
  id: string; restaurantName: string; location?: string; ownerName?: string; phone?: string;
  instagram?: string; estimatedTier: string; status: string; lastTouchDate?: string;
  compoundingNotes?: string;
  pipelineStage: Stage; deal?: { id: string; tier: string; monthlySubscriptionKsh: number; status: string };
  _count: { touches: number; discoveryResponses: number };
}
interface Touch {
  id: string; channel: string; touchType: string; notes?: string; outcome?: string; touchDate: string;
}
interface DiscoveryQuestion { id: string; category: string; questionText: string; sortOrder: number; }
interface DiscoveryResponse { id: string; questionId: string; responseText: string; question: DiscoveryQuestion; }
interface CommPayment { id: string; amountKsh: number; paymentDate: string; notes?: string; dealId: string; }
interface Deal {
  id: string; prospectId: string; tier: string; monthlySubscriptionKsh: number;
  status: string; notesForCompounding?: string; startDate: string;
  prospect: { restaurantName: string; location?: string; ownerName?: string };
  commissionPayments: CommPayment[];
}

interface Objection { id: string; name: string; standardResponse?: string; }

const TIER_COLORS: Record<string, string> = {
  Starter: '#22c55e', Professional: '#3b82f6', Enterprise: '#8b5cf6', unknown: '#94a3b8',
};
const COMMISSION_RATE = 0.17;

// ─── Main Component ───────────────────────────────
export function POSSalesPage({ sectorId }: { sectorId: string }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [questions, setQuestions] = useState<DiscoveryQuestion[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Detail panel
  const [selectedProspect, setSelectedProspect] = useState<ProspectSummary | null>(null);
  const [prospectTouches, setProspectTouches] = useState<Touch[]>([]);
  const [prospectResponses, setProspectResponses] = useState<DiscoveryResponse[]>([]);
  const [detailTab, setDetailTab] = useState('overview');

  // Forms
  const [addProspectOpen, setAddProspectOpen] = useState(false);
  const [addTouchOpen, setAddTouchOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [selectedDealForPayment, setSelectedDealForPayment] = useState<Deal | null>(null);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Weekly targets
  const [targets, setTargets] = useState<Record<string, number>>({
    contactsTarget: 0, discoveriesTarget: 0, demosTarget: 0, closesTarget: 0,
    contactsActual: 0, discoveriesActual: 0, demosActual: 0, closesActual: 0,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesRes, prospectsRes, dealsRes, qRes, objRes] = await Promise.all([
        fetch('/api/pos/pipeline-stages'),
        fetch('/api/pos/prospects'),
        fetch('/api/pos/deals'),
        fetch('/api/pos/discovery-questions'),
        fetch('/api/pos/objections'),
      ]);

      if (stagesRes.status === 401) return;

      const [s, p, d, q, o] = await Promise.all([
        stagesRes.json(), prospectsRes.json(), dealsRes.json(), qRes.json(), objRes.json(),
      ]);

      if ((s as Stage[]).length === 0) {
        await runSetup();
        return;
      }

      setStages(s);
      setProspects(p);
      setDeals(d);
      setQuestions(q);
      setObjections(o);

      // Load weekly targets
      const tRes = await fetch('/api/pos/weekly-targets');
      if (tRes.ok) {
        const t = await tRes.json();
        if (t) setTargets(t);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function runSetup() {
    setSeeding(true);
    await fetch('/api/setup', { method: 'POST' });
    setSeeding(false);
    await loadAll();
  }

  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadProspectDetail(prospect: ProspectSummary) {
    setSelectedProspect(prospect);
    setDetailTab('overview');
    const [tRes, rRes] = await Promise.all([
      fetch(`/api/pos/touches?prospectId=${prospect.id}`),
      fetch(`/api/pos/discovery-responses?prospectId=${prospect.id}`),
    ]);
    if (tRes.ok) setProspectTouches(await tRes.json());
    if (rRes.ok) setProspectResponses(await rRes.json());
  }

  async function moveProspect(prospectId: string, toStageId: string) {
    await fetch(`/api/pos/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineStageId: toStageId }),
    });
    await loadAll();
    if (selectedProspect?.id === prospectId) {
      const stage = stages.find((s) => s.id === toStageId);
      if (stage) setSelectedProspect((p) => p ? { ...p, pipelineStage: stage } : p);
    }
  }

  async function saveTarget(field: string, value: string) {
    const updated = { ...targets, [field]: Number(value) };
    setTargets(updated);
    await fetch('/api/pos/weekly-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  }

  if (loading || seeding) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground animate-pulse">
        {seeding ? 'Setting up CRM defaults…' : 'Loading…'}
      </div>
    );
  }

  const activeProspects = prospects.filter((p) => p.status === 'active');
  const wonProspects = prospects.filter((p) => p.status === 'won');
  const totalMRR = deals.filter((d) => d.status === 'active').reduce((s, d) => s + d.monthlySubscriptionKsh, 0);
  const totalCommission = deals.filter((d) => d.status === 'active').reduce((s, d) => s + Math.round(d.monthlySubscriptionKsh * COMMISSION_RATE), 0);

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Active Prospects" value={activeProspects.length} />
        <KpiCard label="Won" value={wonProspects.length} />
        <KpiCard label="MRR" value={`KSh ${totalMRR.toLocaleString()}`} />
        <KpiCard label="Monthly Commission" value={`KSh ${totalCommission.toLocaleString()}`} accent />
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="deals">Deals & Commission</TabsTrigger>
          <TabsTrigger value="targets">Weekly Targets</TabsTrigger>
          <TabsTrigger value="discovery">Discovery Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── PIPELINE TAB ── */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">{activeProspects.length} active prospects across {stages.filter(s => s.name !== 'Won' && s.name !== 'Lost').length} stages</p>
            <Button size="sm" onClick={() => setAddProspectOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Prospect
            </Button>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {stages.map((stage) => {
                const stageProspects = prospects.filter((p) => p.pipelineStage.id === stage.id);
                return (
                  <div
                    key={stage.id}
                    className="w-64 shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingId) moveProspect(draggingId, stage.id);
                      setDraggingId(null);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1 truncate">
                        {stage.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{stageProspects.length}</span>
                    </div>
                    <div className="space-y-2 min-h-24 p-2 rounded-lg border border-dashed border-border bg-muted/20">
                      {stageProspects.map((p) => (
                        <ProspectKanbanCard
                          key={p.id}
                          prospect={p}
                          stages={stages}
                          onDragStart={() => setDraggingId(p.id)}
                          onMove={(stageId) => moveProspect(p.id, stageId)}
                          onClick={() => loadProspectDetail(p)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── PROSPECTS TAB ── */}
        <TabsContent value="prospects" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">{prospects.length} total prospects</p>
            <Button size="sm" onClick={() => setAddProspectOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Prospect
            </Button>
          </div>
          <div className="space-y-2">
            {prospects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 cursor-pointer"
                onClick={() => loadProspectDetail(p)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{p.restaurantName}</p>
                    <Badge className="text-xs shrink-0" style={{ backgroundColor: `${TIER_COLORS[p.estimatedTier]}20`, color: TIER_COLORS[p.estimatedTier], border: 'none' }}>
                      {p.estimatedTier}
                    </Badge>
                  </div>
                  {p.location && <p className="text-xs text-muted-foreground">{p.location}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.pipelineStage.color }} />
                  <span className="text-xs text-muted-foreground">{p.pipelineStage.name}</span>
                  <span className="text-xs text-muted-foreground">{p._count.touches}t</span>
                </div>
              </div>
            ))}
            {prospects.length === 0 && (
              <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                <p className="mb-3">No prospects yet</p>
                <Button size="sm" onClick={() => setAddProspectOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add First Prospect</Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── DEALS & COMMISSION TAB ── */}
        <TabsContent value="deals" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold">{deals.filter(d => d.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Active Deals</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">KSh {totalMRR.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total MRR</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">KSh {totalCommission.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Monthly Commission</p>
            </div>
          </div>

          <div className="space-y-3">
            {deals.map((deal) => {
              const commission = Math.round(deal.monthlySubscriptionKsh * COMMISSION_RATE);
              const paid = deal.commissionPayments.reduce((s, p) => s + p.amountKsh, 0);
              return (
                <Card key={deal.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{deal.prospect.restaurantName}</p>
                        {deal.prospect.location && <p className="text-xs text-muted-foreground">{deal.prospect.location}</p>}
                      </div>
                      <div className="text-right">
                        <Badge style={{ backgroundColor: `${TIER_COLORS[deal.tier]}20`, color: TIER_COLORS[deal.tier], border: 'none' }}>{deal.tier}</Badge>
                        <p className={`text-xs mt-1 ${deal.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>{deal.status}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <p className="font-semibold">KSh {deal.monthlySubscriptionKsh.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">MRR</p>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600">KSh {commission.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Commission/mo</p>
                      </div>
                      <div>
                        <p className="font-semibold text-green-600">KSh {paid.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Paid so far</p>
                      </div>
                    </div>
                    {deal.commissionPayments.length > 0 && (
                      <div className="space-y-1">
                        {deal.commissionPayments.slice(0, 3).map((pay) => (
                          <div key={pay.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{new Date(pay.paymentDate).toLocaleDateString()}</span>
                            <span>KSh {pay.amountKsh.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full" onClick={() => { setSelectedDealForPayment(deal); setAddPaymentOpen(true); }}>
                      <Plus className="h-3 w-3 mr-1" /> Log Commission Payment
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {deals.length === 0 && (
              <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                <p>No deals yet — close a prospect to create your first deal</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── WEEKLY TARGETS TAB ── */}
        <TabsContent value="targets" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">This Week&apos;s Targets</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(['contacts', 'discoveries', 'demos', 'closes'] as const).map((metric) => {
                  const target = targets[`${metric}Target`] ?? 0;
                  const actual = targets[`${metric}Actual`] ?? 0;
                  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
                  return (
                    <div key={metric} className="space-y-2">
                      <p className="text-sm font-medium capitalize">{metric}</p>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Target</p>
                          <Input
                            type="number" min="0"
                            value={target}
                            onChange={(e) => saveTarget(`${metric}Target`, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Actual</p>
                          <Input
                            type="number" min="0"
                            value={actual}
                            onChange={(e) => saveTarget(`${metric}Actual`, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DISCOVERY QUESTIONS TAB ── */}
        <TabsContent value="discovery" className="mt-4 space-y-3">
          {(['orders', 'inventory', 'finance', 'staff', 'growth', 'custom'] as const).map((cat) => {
            const catQs = questions.filter((q) => q.category === cat);
            if (catQs.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide">{cat}</p>
                <div className="space-y-2">
                  {catQs.map((q) => (
                    <div key={q.id} className="flex items-start gap-2 p-3 border rounded-lg bg-card">
                      <span className="text-muted-foreground text-sm shrink-0">Q{q.sortOrder + 1}.</span>
                      <p className="text-sm flex-1">{q.questionText}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <AddQuestionForm onAdded={loadAll} />
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <PipelineStagesSettings stages={stages} onChanged={loadAll} />
          <ObjectionsSettings objections={objections} onChanged={loadAll} />
        </TabsContent>
      </Tabs>

      {/* ── ADD PROSPECT MODAL ── */}
      {addProspectOpen && (
        <AddProspectModal
          stages={stages}
          onClose={() => setAddProspectOpen(false)}
          onAdded={() => { setAddProspectOpen(false); loadAll(); }}
        />
      )}

      {/* ── PROSPECT DETAIL SLIDE-OVER ── */}
      {selectedProspect && (
        <ProspectDetailPanel
          prospect={selectedProspect}
          touches={prospectTouches}
          responses={prospectResponses}
          questions={questions}
          stages={stages}
          deals={deals}
          detailTab={detailTab}
          onTabChange={setDetailTab}
          onClose={() => setSelectedProspect(null)}
          onStageChange={(stageId) => moveProspect(selectedProspect.id, stageId)}
          onRefresh={() => {
            loadAll();
            loadProspectDetail(selectedProspect);
          }}
          onOpenAddDeal={() => setAddDealOpen(true)}
        />
      )}

      {/* ── ADD TOUCH MODAL ── */}
      {addTouchOpen && selectedProspect && (
        <AddTouchModal
          prospectId={selectedProspect.id}
          onClose={() => setAddTouchOpen(false)}
          onAdded={() => {
            setAddTouchOpen(false);
            loadAll();
            loadProspectDetail(selectedProspect);
          }}
        />
      )}

      {/* ── ADD DEAL MODAL ── */}
      {addDealOpen && selectedProspect && (
        <AddDealModal
          prospect={selectedProspect}
          onClose={() => setAddDealOpen(false)}
          onAdded={() => { setAddDealOpen(false); loadAll(); setSelectedProspect(null); }}
        />
      )}

      {/* ── LOG PAYMENT MODAL ── */}
      {addPaymentOpen && selectedDealForPayment && (
        <LogPaymentModal
          deal={selectedDealForPayment}
          onClose={() => { setAddPaymentOpen(false); setSelectedDealForPayment(null); }}
          onAdded={() => { setAddPaymentOpen(false); setSelectedDealForPayment(null); loadAll(); }}
        />
      )}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────
function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="p-3 border rounded-lg text-center">
      <p className={`text-xl font-bold ${accent ? 'text-indigo-600' : ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Kanban Card ────────────────────────────────
function ProspectKanbanCard({
  prospect, stages, onDragStart, onMove, onClick,
}: {
  prospect: ProspectSummary; stages: Stage[];
  onDragStart: () => void; onMove: (id: string) => void; onClick: () => void;
}) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-2.5 bg-card border rounded-md cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0" onClick={onClick}>
          <p className="text-sm font-medium truncate">{prospect.restaurantName}</p>
          {prospect.ownerName && <p className="text-xs text-muted-foreground truncate">{prospect.ownerName}</p>}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: `${TIER_COLORS[prospect.estimatedTier]}20`, color: TIER_COLORS[prospect.estimatedTier] }}>
              {prospect.estimatedTier}
            </span>
            {prospect._count.touches > 0 && (
              <span className="text-xs text-muted-foreground">{prospect._count.touches} touches</span>
            )}
          </div>
        </div>
        <button
          className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
          onClick={(e) => { e.stopPropagation(); setShowMove(!showMove); }}
          title="Move to stage"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {showMove && (
        <div className="mt-2 space-y-1">
          {stages.filter((s) => s.id !== prospect.pipelineStage.id).map((s) => (
            <button
              key={s.id}
              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted flex items-center gap-2"
              onClick={() => { setShowMove(false); onMove(s.id); }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Prospect Detail Panel ───────────────────────
function ProspectDetailPanel({
  prospect, touches, responses, questions, stages, deals,
  detailTab, onTabChange, onClose, onStageChange, onRefresh, onOpenAddDeal,
}: {
  prospect: ProspectSummary; touches: Touch[]; responses: DiscoveryResponse[];
  questions: DiscoveryQuestion[]; stages: Stage[]; deals: Deal[];
  detailTab: string; onTabChange: (t: string) => void;
  onClose: () => void; onStageChange: (id: string) => void;
  onRefresh: () => void; onOpenAddDeal: () => void;
}) {
  const [addTouchOpen, setAddTouchOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(prospect.compoundingNotes ?? '');
  const deal = deals.find((d) => d.prospectId === prospect.id);

  async function saveNote() {
    await fetch(`/api/pos/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compoundingNotes: note }),
    });
    setEditingNote(false);
    toast.success('Notes saved');
  }

  async function deleteProspect() {
    await fetch(`/api/pos/prospects/${prospect.id}`, { method: 'DELETE' });
    onClose();
    onRefresh();
    toast.success('Prospect deleted');
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background shadow-xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{prospect.restaurantName}</h2>
            {prospect.ownerName && <p className="text-sm text-muted-foreground">{prospect.ownerName}</p>}
            {prospect.location && <p className="text-xs text-muted-foreground">{prospect.location}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage selector */}
        <div className="px-4 py-2 border-b bg-muted/20 flex items-center gap-2 flex-wrap">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => onStageChange(s.id)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                prospect.pipelineStage.id === s.id
                  ? 'text-white border-transparent'
                  : 'text-muted-foreground border-border hover:bg-muted'
              }`}
              style={prospect.pipelineStage.id === s.id ? { backgroundColor: s.color, borderColor: s.color } : {}}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={detailTab} onValueChange={onTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="touches">Touches ({touches.length})</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            {deal && <TabsTrigger value="deal">Deal</TabsTrigger>}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {prospect.phone && <InfoRow label="Phone" value={prospect.phone} />}
                {prospect.instagram && <InfoRow label="Instagram" value={prospect.instagram} />}
                <InfoRow label="Tier" value={prospect.estimatedTier} />
                <InfoRow label="Status" value={prospect.status} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Compounding Notes</p>
                  <button className="text-xs text-indigo-600" onClick={() => setEditingNote(!editingNote)}>
                    {editingNote ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editingNote ? (
                  <div className="space-y-2">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="text-sm" />
                    <Button size="sm" onClick={saveNote}>Save</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {prospect.compoundingNotes || 'No notes yet'}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                {!deal && (
                  <Button size="sm" className="flex-1" onClick={onOpenAddDeal}>
                    <DollarSign className="h-3.5 w-3.5 mr-1" /> Close Deal
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setAddTouchOpen(true)}>
                  <Phone className="h-3.5 w-3.5 mr-1" /> Log Touch
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={deleteProspect}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="touches" className="p-4 space-y-3">
              <Button size="sm" className="w-full" onClick={() => setAddTouchOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Log New Touch
              </Button>
              {touches.map((t) => (
                <div key={t.id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{t.channel}</Badge>
                      <Badge variant="outline" className="text-xs">{t.touchType}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(t.touchDate).toLocaleDateString()}</span>
                  </div>
                  {t.outcome && <p className="text-xs text-muted-foreground">Outcome: {t.outcome}</p>}
                  {t.notes && <p className="text-xs whitespace-pre-wrap">{t.notes}</p>}
                </div>
              ))}
              {touches.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No touches yet</p>}
            </TabsContent>

            <TabsContent value="discovery" className="p-4 space-y-4">
              {(['orders', 'inventory', 'finance', 'staff', 'growth'] as const).map((cat) => {
                const catQs = questions.filter((q) => q.category === cat);
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{cat}</p>
                    <div className="space-y-2">
                      {catQs.map((q) => {
                        const resp = responses.find((r) => r.questionId === q.id);
                        return (
                          <DiscoveryResponseRow
                            key={q.id}
                            question={q}
                            response={resp}
                            prospectId={prospect.id}
                            onSaved={onRefresh}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {deal && (
              <TabsContent value="deal" className="p-4 space-y-3">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge style={{ backgroundColor: `${TIER_COLORS[deal.tier]}20`, color: TIER_COLORS[deal.tier], border: 'none' }}>{deal.tier}</Badge>
                    <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>{deal.status}</Badge>
                  </div>
                  <p className="text-2xl font-bold">KSh {deal.monthlySubscriptionKsh.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-indigo-600 font-medium">Commission: KSh {Math.round(deal.monthlySubscriptionKsh * COMMISSION_RATE).toLocaleString()}/mo</p>
                </div>
                {deal.commissionPayments.map((pay) => (
                  <div key={pay.id} className="flex justify-between text-sm p-2 border rounded">
                    <span>{new Date(pay.paymentDate).toLocaleDateString()}</span>
                    <span className="font-medium">KSh {pay.amountKsh.toLocaleString()}</span>
                  </div>
                ))}
              </TabsContent>
            )}
          </div>
        </Tabs>

        {addTouchOpen && (
          <AddTouchModal
            prospectId={prospect.id}
            onClose={() => setAddTouchOpen(false)}
            onAdded={() => { setAddTouchOpen(false); onRefresh(); }}
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function DiscoveryResponseRow({
  question, response, prospectId, onSaved,
}: {
  question: DiscoveryQuestion; response?: DiscoveryResponse; prospectId: string; onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(response?.responseText ?? '');

  async function save() {
    if (!text.trim()) return;
    await fetch('/api/pos/discovery-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectId, questionId: question.id, responseText: text }),
    });
    setEditing(false);
    onSaved();
  }

  return (
    <div className="p-2.5 border rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{question.questionText}</p>
      {editing ? (
        <div className="space-y-1">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="text-xs" />
          <div className="flex gap-1">
            <Button size="sm" className="h-6 text-xs px-2" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          {response ? (
            <p className="text-sm flex-1 text-foreground">{response.responseText}</p>
          ) : (
            <p className="text-sm flex-1 text-muted-foreground italic">Not answered</p>
          )}
          <button className="text-xs text-indigo-600 shrink-0" onClick={() => setEditing(true)}>
            {response ? 'Edit' : 'Answer'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Prospect Modal ──────────────────────────
function AddProspectModal({ stages, onClose, onAdded }: { stages: Stage[]; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    restaurantName: '', location: '', ownerName: '', phone: '', instagram: '',
    estimatedTier: 'unknown', pipelineStageId: stages[0]?.id ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.restaurantName || !form.pipelineStageId) return;
    setSaving(true);
    const res = await fetch('/api/pos/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success('Prospect added'); onAdded(); }
    else { const e = await res.json(); toast.error(e.error); }
  }

  return (
    <ModalOverlay onClose={onClose} title="Add Prospect">
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Restaurant name *" value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} required />
        <Input placeholder="Location (e.g. Nairobi CBD)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Instagram handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.estimatedTier} onChange={(e) => setForm({ ...form, estimatedTier: e.target.value })}>
          <option value="unknown">Tier Unknown</option>
          <option value="Starter">Starter (KSh 10,000/mo)</option>
          <option value="Professional">Professional (KSh 25,000/mo)</option>
          <option value="Enterprise">Enterprise (KSh 50,000/mo)</option>
        </select>
        <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.pipelineStageId} onChange={(e) => setForm({ ...form, pipelineStageId: e.target.value })}>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Adding…' : 'Add Prospect'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Add Touch Modal ─────────────────────────────
function AddTouchModal({ prospectId, onClose, onAdded }: { prospectId: string; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ channel: 'WhatsApp', touchType: 'initial-contact', outcome: '', notes: '' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/pos/touches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectId, ...form }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Touch logged'); onAdded(); }
  }

  return (
    <ModalOverlay onClose={onClose} title="Log Touch">
      <form onSubmit={submit} className="space-y-3">
        <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
          {['WhatsApp', 'in-person', 'LinkedIn', 'phone', 'email'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.touchType} onChange={(e) => setForm({ ...form, touchType: e.target.value })}>
          {['initial-contact', 'discovery', 'demo', 'follow-up', 'closing-call', 'post-sale', 'custom'].map((t) => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
        </select>
        <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
          <option value="">Outcome (optional)</option>
          {['no-response', 'meeting-scheduled', 'objection-raised', 'advanced', 'declined', 'other'].map((o) => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
        </select>
        <Textarea placeholder="Notes…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Log Touch'}</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Add Deal Modal ──────────────────────────────
function AddDealModal({ prospect, onClose, onAdded }: { prospect: ProspectSummary; onClose: () => void; onAdded: () => void }) {
  const [tier, setTier] = useState('Starter');
  const [saving, setSaving] = useState(false);
  const PRICES: Record<string, number> = { Starter: 10000, Professional: 25000, Enterprise: 50000 };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/pos/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectId: prospect.id, tier, monthlySubscriptionKsh: PRICES[tier] }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Deal created! 🎉'); onAdded(); }
    else { const e = await res.json(); toast.error(e.error); }
  }

  return (
    <ModalOverlay onClose={onClose} title={`Close Deal — ${prospect.restaurantName}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(PRICES).map(([t, price]) => (
            <button
              key={t} type="button"
              onClick={() => setTier(t)}
              className={`p-3 border rounded-lg text-center transition-colors ${tier === t ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'hover:bg-muted'}`}
            >
              <p className="font-semibold text-sm">{t}</p>
              <p className="text-xs text-muted-foreground">KSh {price.toLocaleString()}/mo</p>
              <p className="text-xs text-indigo-600 mt-1">KSh {Math.round(price * COMMISSION_RATE).toLocaleString()} comm.</p>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Confirm Deal'}</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Log Payment Modal ───────────────────────────
function LogPaymentModal({ deal, onClose, onAdded }: { deal: Deal; onClose: () => void; onAdded: () => void }) {
  const defaultAmount = Math.round(deal.monthlySubscriptionKsh * COMMISSION_RATE);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/pos/commission-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: deal.id, amountKsh: Number(amount), notes }),
    });
    setSaving(false);
    toast.success('Payment logged');
    onAdded();
  }

  return (
    <ModalOverlay onClose={onClose} title={`Commission Payment — ${deal.prospect.restaurantName}`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Amount (KSh)</p>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
          <p className="text-xs text-muted-foreground mt-1">Expected: KSh {defaultAmount.toLocaleString()}/mo</p>
        </div>
        <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Log Payment'}</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Add Question Form ───────────────────────────
function AddQuestionForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('custom');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch('/api/pos/discovery-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, questionText: text }),
    });
    setText('');
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Custom Question
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 p-3 border rounded-lg">
      <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={category} onChange={(e) => setCategory(e.target.value)}>
        {['orders', 'inventory', 'finance', 'staff', 'growth', 'custom'].map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <Textarea placeholder="Question text…" value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">Add</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Pipeline Stages Settings ────────────────────
function PipelineStagesSettings({ stages, onChanged }: { stages: Stage[]; onChanged: () => void }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  async function addStage() {
    if (!newName.trim()) return;
    await fetch('/api/pos/pipeline-stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, color: newColor }),
    });
    setNewName('');
    onChanged();
  }

  async function deleteStage(id: string) {
    const res = await fetch(`/api/pos/pipeline-stages/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); toast.error(e.error); return; }
    onChanged();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Pipeline Stages</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {stages.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm flex-1">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s._count?.prospects ?? 0} prospects</span>
            {!s.isDefault && (
              <button onClick={() => deleteStage(s.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer border" />
          <Input placeholder="New stage name…" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
          <Button size="sm" onClick={addStage}>Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Objections Settings ─────────────────────────
function ObjectionsSettings({ objections, onChanged }: { objections: Objection[]; onChanged: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Objection Bank</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {objections.map((o) => (
          <div key={o.id} className="border rounded-lg overflow-hidden">
            <button
              className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted flex justify-between items-center"
              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
            >
              <span>{o.name}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded === o.id ? 'rotate-180' : ''}`} />
            </button>
            {expanded === o.id && o.standardResponse && (
              <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground bg-muted/20">
                {o.standardResponse}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Modal Overlay ───────────────────────────────
function ModalOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
