import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccountabilityClient } from '@/components/accountability/AccountabilityClient';
import type { Sector, AccountabilityCommitment } from '@/types';

export default async function AccountabilityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id: string }).id;

  const [commitments, sectors] = await Promise.all([
    prisma.accountabilityCommitment.findMany({
      where: { userId },
      include: { sector: { select: { name: true, icon: true, color: true } } },
      orderBy: { dateMade: 'desc' },
    }),
    prisma.sector.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accountability</h1>
        <p className="text-sm text-muted-foreground">Your personal commitments — stated publicly to yourself</p>
      </div>
      <AccountabilityClient
        initialCommitments={commitments as unknown as (AccountabilityCommitment & { sector?: { name: string; icon: string; color: string } })[]}
        sectors={sectors as Sector[]}
        userId={userId}
      />
    </div>
  );
}
