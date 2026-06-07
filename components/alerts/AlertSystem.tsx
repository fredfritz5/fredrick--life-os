'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { playAlertTone } from '@/lib/audio';

export function AlertSystem() {
  const checkedRef = useRef(false);

  useEffect(() => {
    async function checkAlerts() {
      if (checkedRef.current) return;

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isEveningWindow = hour === 21 && minute <= 5;

      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) return;
        const { missedGoals, decliningAlerts } = await res.json();

        if (isEveningWindow && missedGoals?.length > 0) {
          playAlertTone('missed');
          toast.warning(`⏰ ${missedGoals.length} goal${missedGoals.length > 1 ? 's' : ''} still incomplete today`, {
            description: missedGoals.slice(0, 3).map((g: { text: string }) => `• ${g.text}`).join('\n'),
            duration: 10000,
          });
        }

        if (decliningAlerts?.length > 0) {
          playAlertTone('declining');
          toast.error(`📉 Sector productivity below 60% (7-day average)`, {
            description: decliningAlerts.join(', '),
            duration: 8000,
          });
        }
      } catch {
        // Silent fail — alerts are non-critical
      }

      checkedRef.current = true;
    }

    const timer = setTimeout(checkAlerts, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
