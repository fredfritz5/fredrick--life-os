'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Shield, Plus, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { cn, getSectorIcon } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Sector } from '@/types';

interface SidebarProps {
  sectors: Sector[];
  onClose?: () => void;
}

export function Sidebar({ sectors, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/accountability', label: 'Accountability', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-2xl">🎯</span>
          <div>
            <div className="font-bold text-sm leading-none">Life OS</div>
            <div className="text-xs text-muted-foreground leading-none mt-0.5">Fredrick Ochieng</div>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1 mb-6">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sectors</span>
            <Link href="/sectors/new" onClick={onClose}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            {sectors.map((sector) => (
              <Link
                key={sector.id}
                href={`/sectors/${sector.id}`}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === `/sectors/${sector.id}`
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span className="text-base leading-none">{getSectorIcon(sector.icon)}</span>
                <span className="truncate">{sector.name}</span>
                <span
                  className="ml-auto h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: sector.color }}
                />
              </Link>
            ))}
            <Link
              href="/sectors/new"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add Sector
            </Link>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t space-y-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
