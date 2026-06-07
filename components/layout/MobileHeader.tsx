'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import type { Sector } from '@/types';

export function MobileHeader({ sectors }: { sectors: Sector[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-background/80 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="font-bold text-sm">Life OS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72">
            <Sidebar sectors={sectors} onClose={() => setOpen(false)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
