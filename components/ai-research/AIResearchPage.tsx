'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Star, TrendingUp, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Restaurant {
  id: string; restaurantName: string; location?: string; ownerName?: string;
  candidateStrength: string; status: string; automationAppetite: number;
  digitalComfortLevel: number; whatsappOrderingLevel: string; _count: { quotes: number };
}
interface Theme { id: string; themeName: string; description?: string; color: string; _count: { quotes: number }; }
interface QuoteItem {
  id: string; quoteText: string; context?: string; capturedDate: string;
  restaurant: { restaurantName: string };
  themes: { theme: Theme }[];
}
interface Insight { id: string; insightText: string; insightDate: string; status: string; _count: { supportingQuotes: number }; }

const STRENGTH_COLORS = { Strong: '#22c55e', Medium: '#eab308', Weak: '#ef4444' };
const STATUS_LABELS: Record<string, string> = {
  'active-research': 'Active', 'monitoring': 'Monitoring', 'future-prospect': 'Future', 'not-suitable': 'Not Suitable',
};

export function AIResearchPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const [addRestaurantOpen, setAddRestaurantOpen] = useState(false);
  const [addQuoteOpen, setAddQuoteOpen] = useState(false);
  const [addThemeOpen, setAddThemeOpen] = useState(false);
  const [addInsightOpen, setAddInsightOpen] = useState(false);

  const loadAll = useCallback(async () => {
    const [rRes, tRes, qRes, iRes] = await Promise.all([
      fetch('/api/ai-research/restaurants'),
      fetch('/api/ai-research/themes'),
      fetch('/api/ai-research/quotes'),
      fetch('/api/ai-research/insights'),
    ]);
    if (rRes.ok) setRestaurants(await rRes.json());
    if (tRes.ok) setThemes(await tRes.json());
    if (qRes.ok) setQuotes(await qRes.json());
    if (iRes.ok) setInsights(await iRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) return <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;

  const strongCandidates = restaurants.filter((r) => r.candidateStrength === 'Strong').length;

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold">{restaurants.length}</p>
          <p className="text-xs text-muted-foreground">Restaurants</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold text-green-600">{strongCandidates}</p>
          <p className="text-xs text-muted-foreground">Strong Candidates</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold text-indigo-600">{quotes.length}</p>
          <p className="text-xs text-muted-foreground">Quotes Captured</p>
        </div>
      </div>

      <Tabs defaultValue="restaurants">
        <TabsList>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="quotes">Quote Bank</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* ── RESTAURANTS TAB ── */}
        <TabsContent value="restaurants" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setAddRestaurantOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Restaurant
          </Button>
          {restaurants.map((r) => (
            <Card key={r.id} className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setSelectedRestaurant(r)}>
              <CardContent className="pt-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.restaurantName}</p>
                    {r.location && <p className="text-xs text-muted-foreground">{r.location}</p>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-medium" style={{ color: STRENGTH_COLORS[r.candidateStrength as keyof typeof STRENGTH_COLORS] || '#94a3b8' }}>
                      {r.candidateStrength}
                    </span>
                    <Badge variant="outline" className="text-xs">{STATUS_LABELS[r.status] || r.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>🤖 Appetite: {r.automationAppetite}/5</span>
                  <span>📱 WhatsApp: {r.whatsappOrderingLevel}</span>
                  <span>💬 {r._count.quotes} quotes</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {restaurants.length === 0 && (
            <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
              <p>No restaurants researched yet</p>
            </div>
          )}
        </TabsContent>

        {/* ── QUOTES TAB ── */}
        <TabsContent value="quotes" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setAddQuoteOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Capture Quote
          </Button>
          {quotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="pt-3 space-y-2">
                <p className="text-sm italic">&ldquo;{q.quoteText}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {q.themes.map((qt) => (
                      <span key={qt.theme.id} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${qt.theme.color}20`, color: qt.theme.color }}>
                        {qt.theme.themeName}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{q.restaurant.restaurantName}</p>
                </div>
                {q.context && <p className="text-xs text-muted-foreground">Context: {q.context}</p>}
              </CardContent>
            </Card>
          ))}
          {quotes.length === 0 && (
            <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
              <Quote className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No quotes captured yet</p>
            </div>
          )}
        </TabsContent>

        {/* ── THEMES TAB ── */}
        <TabsContent value="themes" className="mt-4 space-y-3">
          <Button size="sm" variant="outline" className="w-full" onClick={() => setAddThemeOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Theme
          </Button>
          {themes.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.themeName}</p>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{t._count.quotes} quotes</span>
            </div>
          ))}
        </TabsContent>

        {/* ── INSIGHTS TAB ── */}
        <TabsContent value="insights" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setAddInsightOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Insight
          </Button>
          {insights.map((i) => (
            <Card key={i.id}>
              <CardContent className="pt-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">{i.insightText}</p>
                  <select
                    value={i.status}
                    onChange={async (e) => {
                      await fetch(`/api/ai-research/insights/${i.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: e.target.value }),
                      });
                      loadAll();
                    }}
                    className="text-xs border rounded px-1 h-6 bg-background shrink-0"
                  >
                    <option value="raw">Raw</option>
                    <option value="validated">Validated</option>
                    <option value="acted-on">Acted On</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(i.insightDate).toLocaleDateString()} · {i._count.supportingQuotes} quotes</p>
              </CardContent>
            </Card>
          ))}
          {insights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No insights yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Restaurant Detail Slide-over */}
      {selectedRestaurant && (
        <RestaurantDetailPanel
          restaurant={selectedRestaurant}
          themes={themes}
          onClose={() => setSelectedRestaurant(null)}
          onUpdated={loadAll}
        />
      )}

      {/* Modals */}
      {addRestaurantOpen && <AddRestaurantModal onClose={() => setAddRestaurantOpen(false)} onAdded={() => { setAddRestaurantOpen(false); loadAll(); }} />}
      {addQuoteOpen && <AddQuoteModal restaurants={restaurants} themes={themes} onClose={() => setAddQuoteOpen(false)} onAdded={() => { setAddQuoteOpen(false); loadAll(); }} />}
      {addThemeOpen && <AddThemeModal onClose={() => setAddThemeOpen(false)} onAdded={() => { setAddThemeOpen(false); loadAll(); }} />}
      {addInsightOpen && <AddInsightModal onClose={() => setAddInsightOpen(false)} onAdded={() => { setAddInsightOpen(false); loadAll(); }} />}
    </div>
  );
}

function RestaurantDetailPanel({ restaurant, themes, onClose, onUpdated }: {
  restaurant: Restaurant; themes: Theme[]; onClose: () => void; onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...restaurant });

  async function save() {
    await fetch(`/api/ai-research/restaurants/${restaurant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setEditing(false);
    onUpdated();
    toast.success('Updated');
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <h2 className="font-semibold text-lg truncate">{restaurant.restaurantName}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
            <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {editing ? (
            <div className="space-y-3">
              <Input placeholder="Restaurant name" value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
              <Input placeholder="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input placeholder="Owner name" value={form.ownerName || ''} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Candidate Strength</p>
                  <select className="w-full border rounded-md h-9 px-2 text-sm bg-background" value={form.candidateStrength} onChange={(e) => setForm({ ...form, candidateStrength: e.target.value })}>
                    <option>Strong</option><option>Medium</option><option>Weak</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">WhatsApp Orders</p>
                  <select className="w-full border rounded-md h-9 px-2 text-sm bg-background" value={form.whatsappOrderingLevel} onChange={(e) => setForm({ ...form, whatsappOrderingLevel: e.target.value })}>
                    <option value="none">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Automation Appetite (1-5): {form.automationAppetite}</p>
                <input type="range" min="1" max="5" value={form.automationAppetite} onChange={(e) => setForm({ ...form, automationAppetite: Number(e.target.value) })} className="w-full" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <select className="w-full border rounded-md h-9 px-2 text-sm bg-background" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active-research">Active Research</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="future-prospect">Future Prospect</option>
                  <option value="not-suitable">Not Suitable</option>
                </select>
              </div>
              <Button className="w-full" onClick={save}>Save Changes</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Strength</p><p className="font-medium" style={{ color: STRENGTH_COLORS[restaurant.candidateStrength as keyof typeof STRENGTH_COLORS] }}>{restaurant.candidateStrength}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{STATUS_LABELS[restaurant.status] || restaurant.status}</p></div>
                <div><p className="text-xs text-muted-foreground">Automation Appetite</p><p className="font-medium">{restaurant.automationAppetite}/5</p></div>
                <div><p className="text-xs text-muted-foreground">Digital Comfort</p><p className="font-medium">{restaurant.digitalComfortLevel}/5</p></div>
                <div><p className="text-xs text-muted-foreground">WhatsApp Orders</p><p className="font-medium capitalize">{restaurant.whatsappOrderingLevel}</p></div>
                <div><p className="text-xs text-muted-foreground">Quotes</p><p className="font-medium">{restaurant._count.quotes}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddRestaurantModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ restaurantName: '', location: '', ownerName: '', candidateStrength: 'Medium', automationAppetite: 3, digitalComfortLevel: 3, whatsappOrderingLevel: 'none' });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/ai-research/restaurants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    toast.success('Restaurant added'); onAdded();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Add Restaurant</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Restaurant name *" value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} required />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="border rounded-md h-9 px-2 text-sm bg-background" value={form.candidateStrength} onChange={(e) => setForm({ ...form, candidateStrength: e.target.value })}><option>Strong</option><option>Medium</option><option>Weak</option></select>
            <select className="border rounded-md h-9 px-2 text-sm bg-background" value={form.whatsappOrderingLevel} onChange={(e) => setForm({ ...form, whatsappOrderingLevel: e.target.value })}><option value="none">No WhatsApp orders</option><option value="low">Low volume</option><option value="medium">Medium volume</option><option value="high">High volume</option></select>
          </div>
          <div className="flex gap-2"><Button type="submit" className="flex-1">Add</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}

function AddQuoteModal({ restaurants, themes, onClose, onAdded }: { restaurants: Restaurant[]; themes: Theme[]; onClose: () => void; onAdded: () => void }) {
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? '');
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !restaurantId) return;
    await fetch('/api/ai-research/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantResearchId: restaurantId, quoteText: text, context, themeIds: selectedThemes }) });
    toast.success('Quote captured'); onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Capture Quote</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)}>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.restaurantName}</option>)}
          </select>
          <Textarea placeholder="Quote text *" value={text} onChange={(e) => setText(e.target.value)} rows={3} required />
          <Input placeholder="Context (situation where it was said)" value={context} onChange={(e) => setContext(e.target.value)} />
          {themes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tag themes</p>
              <div className="flex gap-2 flex-wrap">
                {themes.map((t) => (
                  <button key={t.id} type="button" onClick={() => setSelectedThemes((prev) => prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id])}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedThemes.includes(t.id) ? 'text-white border-transparent' : 'text-muted-foreground border-border'}`}
                    style={selectedThemes.includes(t.id) ? { backgroundColor: t.color } : {}}
                  >{t.themeName}</button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2"><Button type="submit" className="flex-1">Capture</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}

function AddThemeModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#6366f1');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch('/api/ai-research/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ themeName: name, description: desc, color }) });
    toast.success('Theme added'); onAdded();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Add Theme</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer border" />
            <Input placeholder="Theme name *" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" required />
          </div>
          <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="flex gap-2"><Button type="submit" className="flex-1">Add</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}

function AddInsightModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [text, setText] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch('/api/ai-research/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ insightText: text }) });
    toast.success('Insight added'); onAdded();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Add Insight</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <Textarea placeholder="What pattern or insight did you observe? *" value={text} onChange={(e) => setText(e.target.value)} rows={3} required />
          <div className="flex gap-2"><Button type="submit" className="flex-1">Add</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}
