'use client';

import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

// Ekran uxlab qolmasin (Screen Wake Lock API). Qo'llab-quvvatlanmasa jim o'tadi.
// Tab yashirilganda brauzer qulfni o'zi bo'shatadi — qaytganda qayta olinadi.
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;
    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const next = await wakeLock.request('screen');
        if (cancelled) next.release().catch(() => {});
        else sentinel = next;
      } catch {
        // Masalan, quvvat tejash rejimi — e'tiborsiz
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
