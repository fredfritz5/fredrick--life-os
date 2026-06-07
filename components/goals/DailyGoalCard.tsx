'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, SkipForward, Image as ImageIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProofUploadModal } from './ProofUploadModal';
import { getSectorIcon } from '@/lib/utils';
import type { DailyGoal, Sector } from '@/types';

interface DailyGoalCardProps {
  goal: DailyGoal;
  sector: Sector;
  onUpdate: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function DailyGoalCard({ goal, sector, onUpdate, onDelete, compact = false }: DailyGoalCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending', badge: 'warning' as const },
    completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Done', badge: 'success' as const },
    skipped: { icon: SkipForward, color: 'text-muted-foreground', label: 'Skipped', badge: 'secondary' as const },
  };

  const config = statusConfig[goal.status];
  const StatusIcon = config.icon;
  const isOverride = goal.status === 'completed' && !!(goal.manualOverrideReason ?? goal.manual_override_reason);

  return (
    <>
      <div className={`group flex items-start gap-3 rounded-lg border p-3 transition-colors ${goal.status === 'completed' ? 'bg-muted/30 opacity-75' : 'bg-card hover:border-primary/50'}`}>
        <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${config.color}`} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm ${goal.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
            {goal.text}
          </p>

          {!compact && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {getSectorIcon(sector.icon)} {sector.name}
              </span>
              {isOverride && (
                <Badge variant="warning" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Override
                </Badge>
              )}
              {(goal.proofImageUrl ?? goal.proof_image_url) && !isOverride && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {goal.status === 'pending' && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setProofOpen(true)}>
              Complete
            </Button>
          )}
          {onDelete && !confirmingDelete && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {onDelete && confirmingDelete && (
            <>
              <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={() => { setConfirmingDelete(false); onDelete(); }}>
                Delete
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <ProofUploadModal
        goal={goal}
        sector={sector}
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        onVerified={onUpdate}
      />
    </>
  );
}
