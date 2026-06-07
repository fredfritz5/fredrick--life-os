'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { SECTOR_ICONS, SECTOR_COLORS, getSectorIcon } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

export default function NewSectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('circle');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [verificationCriteria, setVerificationCriteria] = useState('');
  const [visionRequired, setVisionRequired] = useState(true);

  async function handleCreate() {
    if (!name.trim()) { toast.error('Sector name required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon,
          color,
          description: description.trim() || null,
          verificationCriteria: verificationCriteria.trim() || null,
          visionRequired,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to create sector');
      }

      toast.success(`${name} sector created!`);
      router.push('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sector');
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ['Name & Icon', 'Description', 'Verification', 'Review'];
  const canNext = step === 1 ? !!name.trim() : step === 2 ? !!description.trim() : true;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Add New Sector</h1>
      </div>

      <div className="flex gap-1 mb-6">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full ${i < step ? 'bg-primary' : 'bg-muted'}`} />
            <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
          </div>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Name & Appearance</CardTitle>
              <CardDescription>What is this sector about?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sector Name</Label>
                <Input
                  placeholder="e.g. Creative Writing, Language Learning…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SECTOR_ICONS.map((i) => (
                    <button
                      key={i.value}
                      onClick={() => setIcon(i.value)}
                      className={`p-3 rounded-lg border text-lg text-center transition-colors ${icon === i.value ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground'}`}
                    >
                      {getSectorIcon(i.value)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>About This Sector</CardTitle>
              <CardDescription>Help the system understand your context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>One-sentence description</Label>
                <Textarea
                  placeholder="e.g. Tracking my daily writing practice to complete my first novel"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  autoFocus
                />
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Proof & Verification</CardTitle>
              <CardDescription>How should the AI verify that daily goals are genuinely done?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>What counts as valid proof for a daily goal?</Label>
                <Textarea
                  placeholder="e.g. A screenshot of the word count in their writing app, or a photo of handwritten pages"
                  value={verificationCriteria}
                  onChange={(e) => setVerificationCriteria(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Switch
                  id="vision-required"
                  checked={visionRequired}
                  onCheckedChange={setVisionRequired}
                />
                <div>
                  <Label htmlFor="vision-required" className="text-sm font-medium cursor-pointer">
                    Require photo/screenshot proof
                  </Label>
                  <p className="text-xs text-muted-foreground">Turn off for sectors like spiritual reflection</p>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {getSectorIcon(icon)}
                </div>
                <div>
                  <p className="font-bold" style={{ color }}>{name}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              {verificationCriteria && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Verification criteria</p>
                  <p className="text-sm">{verificationCriteria}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {visionRequired ? 'Vision verification enabled' : 'No vision verification (self-reported)'}
              </div>
            </CardContent>
          </>
        )}

        <div className="flex gap-2 px-6 pb-6">
          {step > 1 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep((s) => (s - 1) as Step)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          {step < 4 ? (
            <Button className="flex-1" onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating…' : 'Create Sector'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
