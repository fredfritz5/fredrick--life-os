'use client';

import { useState } from 'react';
import { Edit2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  userId: string;
}

export function ProfileHeader({ profile, userId: _userId }: ProfileHeaderProps) {
  const [editingFocus, setEditingFocus] = useState(false);
  const [focus, setFocus] = useState(profile?.currentFocus ?? profile?.current_focus ?? 'Building the future of AI in Africa');

  async function saveFocus() {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentFocus: focus }),
    });
    if (res.ok) {
      setEditingFocus(false);
      toast.success('Focus updated');
    }
  }

  const displayName = profile?.displayName ?? profile?.display_name ?? 'FO';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-14 w-14 shrink-0">
        <AvatarImage src={profile?.profilePhotoUrl ?? profile?.profile_photo_url ?? undefined} />
        <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold">{displayName !== 'FO' ? displayName : 'Fredrick Ochieng'}</h1>

        {editingFocus ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && saveFocus()}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveFocus}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1 group">
            <p className="text-sm text-muted-foreground italic">"{focus}"</p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditingFocus(true)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
