'use client';

import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getSectorIcon, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { AccountabilityCommitment, Sector } from '@/types';

type CommitmentStatus = 'active' | 'honored' | 'broken';

interface Props {
  initialCommitments: (AccountabilityCommitment & { sector?: { name: string; icon: string; color: string } })[];
  sectors: Sector[];
  userId: string;
}

export function AccountabilityClient({ initialCommitments, sectors, userId: _userId }: Props) {
  const [commitments, setCommitments] = useState(initialCommitments);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newSectorId, setNewSectorId] = useState<string>('none');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | CommitmentStatus>('all');

  async function addCommitment() {
    if (!newText.trim()) { toast.error('Enter your commitment'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/accountability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim(), sectorId: newSectorId }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setCommitments([data as AccountabilityCommitment & { sector?: { name: string; icon: string; color: string } }, ...commitments]);
      setNewText('');
      setNewSectorId('none');
      setAdding(false);
      toast.success('Commitment recorded');
    } catch {
      toast.error('Failed to save commitment');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: CommitmentStatus) {
    await fetch(`/api/accountability/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setCommitments(commitments.map((c) => c.id === id ? { ...c, status } : c));
    toast.success(`Marked as ${status}`);
  }

  const filtered = filterStatus === 'all' ? commitments : commitments.filter((c) => c.status === filterStatus);

  const stats = {
    active: commitments.filter((c) => c.status === 'active').length,
    honored: commitments.filter((c) => c.status === 'honored').length,
    broken: commitments.filter((c) => c.status === 'broken').length,
  };

  const honestyRate = (stats.honored + stats.broken) > 0
    ? Math.round((stats.honored / (stats.honored + stats.broken)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-600">{stats.honored}</div>
            <div className="text-xs text-muted-foreground">Honored</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-red-600">{stats.broken}</div>
            <div className="text-xs text-muted-foreground">Broken</div>
          </CardContent>
        </Card>
      </div>

      {honestyRate !== null && (
        <div className={`rounded-lg p-3 text-sm ${honestyRate >= 70 ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'}`}>
          {honestyRate >= 70 ? '✓' : '⚠️'} You honor <strong>{honestyRate}%</strong> of commitments you resolve. {honestyRate >= 80 ? 'Strong character.' : honestyRate >= 60 ? 'Room to improve.' : 'Be more careful before committing.'}
        </div>
      )}

      {adding ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">State Your Commitment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>I commit to…</Label>
              <Textarea
                placeholder="e.g. Shipping the payment integration by Friday, even if I have to work late."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={3}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Sector <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={newSectorId} onValueChange={setNewSectorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific sector</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {getSectorIcon(s.icon)} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancel</Button>
              <Button className="flex-1" onClick={addCommitment} disabled={saving || !newText.trim()}>
                {saving ? 'Saving…' : 'State Commitment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button className="w-full" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" /> State a Commitment
        </Button>
      )}

      <Separator />

      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'honored', 'broken'] as const).map((s) => (
          <Badge
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            className="cursor-pointer capitalize"
            onClick={() => setFilterStatus(s)}
          >
            {s} {s !== 'all' && `(${commitments.filter((c) => c.status === s).length})`}
          </Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          {filterStatus === 'all' ? 'No commitments yet. State your first one.' : `No ${filterStatus} commitments.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className={`border-l-4 ${c.status === 'honored' ? 'border-l-green-500' : c.status === 'broken' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${c.status !== 'active' ? 'text-muted-foreground' : ''}`}>{c.text}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatDate(String(c.date_made))}</span>
                      {c.sector && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {getSectorIcon(c.sector.icon)} {c.sector.name}
                        </span>
                      )}
                      <Badge
                        className="text-xs"
                        variant={c.status === 'honored' ? 'success' : c.status === 'broken' ? 'destructive' : 'warning'}
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>

                  {c.status === 'active' && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Mark Honored"
                        onClick={() => updateStatus(c.id, 'honored')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Mark Broken"
                        onClick={() => updateStatus(c.id, 'broken')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
