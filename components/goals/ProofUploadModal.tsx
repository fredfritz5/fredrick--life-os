'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { DailyGoal, Sector } from '@/types';

interface ProofUploadModalProps {
  goal: DailyGoal;
  sector: Sector;
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

type Step = 'upload' | 'verifying' | 'result' | 'override';

export function ProofUploadModal({ goal, sector, open, onClose, onVerified }: ProofUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    result: { matches_goal: boolean; different_from_yesterday: boolean; confidence: number; reasoning: string; concerns: string[] };
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleVerify() {
    if (!selectedFile) return;
    setStep('verifying');
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('goalId', goal.id);
      fd.append('goalText', goal.text);
      fd.append('verificationCriteria', sector.verificationCriteria ?? sector.verification_criteria ?? '');
      fd.append('sectorId', sector.id);

      const res = await fetch('/api/verify-proof', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Verification request failed');

      const data = await res.json();
      setVerificationResult(data);
      setStep('result');
    } catch {
      toast.error('Verification failed. Please try again.');
      setStep('upload');
    }
  }

  async function handleManualOverride() {
    if (!overrideReason.trim()) { toast.error('Please provide a reason'); return; }
    setOverriding(true);
    try {
      const res = await fetch(`/api/daily-goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          manualOverrideReason: overrideReason,
          completedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to save override');
      toast.success('Goal marked complete with manual override logged.');
      onVerified();
      handleClose();
    } catch {
      toast.error('Failed to save override');
    } finally {
      setOverriding(false);
    }
  }

  async function markCompleteNoProof() {
    const res = await fetch(`/api/daily-goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      toast.success('Goal marked complete!');
      onVerified();
      handleClose();
    }
  }

  function handleClose() {
    setStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setVerificationResult(null);
    setOverrideReason('');
    onClose();
  }

  const confidencePct = verificationResult ? Math.round(verificationResult.result.confidence * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{step === 'verifying' ? '🔍' : step === 'result' ? (verificationResult?.verified ? '✅' : '❌') : '📸'}</span>
            {step === 'upload' && 'Submit Proof'}
            {step === 'verifying' && 'Verifying…'}
            {step === 'result' && (verificationResult?.verified ? 'Goal Verified!' : 'Verification Failed')}
            {step === 'override' && 'Manual Override'}
          </DialogTitle>
          <DialogDescription className="text-left">
            <span className="font-medium text-foreground">{goal.text}</span>
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {(sector.visionRequired ?? sector.vision_required ?? true) ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Upload a photo or screenshot as proof. The AI will verify it matches your goal.
                </p>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded object-contain" />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload a photo or screenshot</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} capture="environment" />
                {selectedFile && <p className="text-xs text-muted-foreground text-center">{selectedFile.name}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleVerify} disabled={!selectedFile}>
                    Verify Proof
                  </Button>
                </div>
                <button
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center underline"
                  onClick={() => setStep('override')}
                >
                  Can't upload? Use manual override
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This sector doesn't require vision verification. Mark as complete directly.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                  <Button className="flex-1" onClick={markCompleteNoProof}>
                    Mark Complete
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your proof with AI…</p>
          </div>
        )}

        {step === 'result' && verificationResult && (
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${verificationResult.verified ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-start gap-3">
                {verificationResult.verified
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  : <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                }
                <div>
                  <p className="font-medium text-sm">{verificationResult.verified ? 'Proof accepted' : 'Proof rejected'}</p>
                  <p className="text-sm mt-1 text-muted-foreground">{verificationResult.result.reasoning}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 text-xs flex-wrap">
              <Badge variant={verificationResult.result.matches_goal ? 'success' : 'destructive'}>
                {verificationResult.result.matches_goal ? '✓ Matches goal' : '✗ Doesn\'t match goal'}
              </Badge>
              <Badge variant={verificationResult.result.different_from_yesterday ? 'success' : 'destructive'}>
                {verificationResult.result.different_from_yesterday ? '✓ New work' : '✗ Same as yesterday'}
              </Badge>
              <Badge variant="outline">{confidencePct}% confidence</Badge>
            </div>

            {verificationResult.result.concerns.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="font-medium flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Concerns:</p>
                {verificationResult.result.concerns.map((c, i) => (
                  <p key={i} className="text-muted-foreground ml-5">• {c}</p>
                ))}
              </div>
            )}

            {verificationResult.verified ? (
              <Button className="w-full" onClick={() => { onVerified(); handleClose(); }}>
                Done
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep('upload'); setSelectedFile(null); setPreviewUrl(null); }}>
                  Try Again
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setStep('override')}>
                  Override
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'override' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
              Manual overrides are logged and shown in your Honesty Index analytics.
            </div>
            <div className="space-y-2">
              <Label>Why are you overriding verification?</Label>
              <Textarea
                placeholder="Explain why you completed this goal and couldn't provide standard proof…"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>Back</Button>
              <Button className="flex-1" onClick={handleManualOverride} disabled={overriding || !overrideReason.trim()}>
                {overriding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Override
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
