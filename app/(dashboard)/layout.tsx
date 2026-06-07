import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { AlertSystem } from '@/components/alerts/AlertSystem';
import type { Sector } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id: string }).id;

  const sectors = await prisma.sector.findMany({
    where: { userId },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex md:w-64 md:flex-col md:shrink-0">
        <Sidebar sectors={sectors as Sector[]} />
      </div>

      <MobileHeader sectors={sectors as Sector[]} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
            {children}
          </div>
        </main>
      </div>

      <AlertSystem />
    </div>
  );
}
