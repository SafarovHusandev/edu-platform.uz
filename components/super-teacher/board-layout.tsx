'use client';

import { useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { LogOut, Maximize, Minimize } from 'lucide-react';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { cn } from '@/lib/utils';

function subscribeFullscreen(cb: () => void) {
  document.addEventListener('fullscreenchange', cb);
  return () => document.removeEventListener('fullscreenchange', cb);
}

const getFullscreen = () => !!document.fullscreenElement;
const getFullscreenServer = () => false;

// Doska tugmalari: sensorli ekran uchun kamida 64px, hover'ga tayanmaydi
export const boardButtonClass =
  'inline-flex min-h-16 min-w-16 items-center justify-center gap-2.5 rounded-2xl px-6 text-xl font-bold transition-[transform,opacity,background-color] select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60';

export const boardButtonVariants = {
  primary: 'bg-white text-[#141B3D]',
  secondary: 'bg-white/15 text-white',
  danger: 'bg-[#D01937] text-white',
  success: 'bg-[#26890C] text-white',
} as const;

export function boardButton(variant: keyof typeof boardButtonVariants = 'primary', className?: string) {
  return cn(boardButtonClass, boardButtonVariants[variant], className);
}

// Barcha "doska rejimi" sahifalari uchun umumiy layout: sidebar/header yo'q,
// yuqori kontrastli to'q fon, juda katta shrift, to'liq ekran va Wake Lock.
export function BoardLayout({
  children,
  exitHref,
  exitLabel = 'Chiqish',
  onExit,
  controls,
  className,
}: {
  children: React.ReactNode;
  exitHref: string;
  exitLabel?: string;
  // Navigatsiyadan oldin (masalan, tasdiq so'rash). false qaytarsa — chiqilmaydi
  onExit?: () => boolean | void;
  // Burchakdagi panelga qo'shimcha tugmalar (masalan, ovozni o'chirish)
  controls?: React.ReactNode;
  className?: string;
}) {
  useWakeLock(true);
  const isFullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreen, getFullscreenServer);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  return (
    // `dark` — loyiha tokenlari (dialog, toast'dan tashqari) shu daraxtda to'q rejimda
    <div
      className={cn(
        'dark relative flex min-h-svh flex-col bg-[#141B3D] text-xl text-white antialiased',
        className
      )}
    >
      <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
        {controls}
        <button
          type="button"
          onClick={toggleFullscreen}
          className={boardButton('secondary', 'min-h-14 min-w-14 px-0 sm:min-h-16 sm:min-w-16')}
          aria-label={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
          title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
        >
          {isFullscreen ? <Minimize className="size-7" /> : <Maximize className="size-7" />}
        </button>
        <Link
          href={exitHref}
          onClick={(e) => {
            if (onExit?.() === false) {
              e.preventDefault();
              return;
            }
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          }}
          className={boardButton('secondary', 'min-h-14 px-4 text-lg sm:min-h-16 sm:px-5')}
        >
          <LogOut className="size-6" /> {exitLabel}
        </Link>
      </div>
      <main className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-24 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
