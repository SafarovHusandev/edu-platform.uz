'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import {
  useDailySpinHistory,
  useDailySpinStatus,
  useDailySpin,
  type DailySpinResult,
} from '@/hooks/use-daily-spin';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const SPIN_DURATION_MS = 3000;
// Dizayndagi baraban: ko'k / och / yashil / och / ko'k / och / oltin / och
const WHEEL_GRADIENT = [
  'var(--accent-foreground) 0deg 45deg',
  'var(--background) 45deg 90deg',
  'var(--success) 90deg 135deg',
  'var(--background) 135deg 180deg',
  'var(--accent-foreground) 180deg 225deg',
  'var(--background) 225deg 270deg',
  'var(--gold) 270deg 315deg',
  'var(--background) 315deg 360deg',
].join(', ');

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

// "Bugun · 21:10" / "Kecha · 21:09" / "21.10 · 19:42"
function spinTime(value: string) {
  const date = new Date(value);
  const time = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Bugun · ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Kecha · ${time}`;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm} · ${time}`;
}

// Oxirgi 7 kun (bugun oxirida): seriyaga kirgan kunlar to'ldiriladi
function streakDays(streak: number, spunToday: boolean) {
  return Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const filled = spunToday ? daysAgo < streak : daysAgo >= 1 && daysAgo <= streak;
    return { label: WEEKDAYS[date.getDay()], filled, isToday: daysAgo === 0 };
  });
}

export default function DailySpinPage() {
  const isPremium = useAuthStore((s) => s.user?.tarif === 'premium');
  const { data: status, isLoading, isError, refetch } = useDailySpinStatus();
  const spin = useDailySpin();

  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingResult, setPendingResult] = useState<DailySpinResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const { data: history } = useDailySpinHistory(5);

  const canSpin = !!status?.canSpin && !spin.isPending && !isAnimating;
  const busy = spin.isPending || isAnimating;

  function handleSpin() {
    if (!canSpin) return;
    spin.mutate(undefined, {
      onSuccess: (result) => {
        setPendingResult(result);
        setIsAnimating(true);
        setRotation((prev) => prev + 360 * 5 + Math.floor(Math.random() * 360));
      },
    });
  }

  function handleTransitionEnd() {
    if (!isAnimating) return;
    setIsAnimating(false);
    if (pendingResult) {
      setResultOpen(true);
    }
  }

  const standardCapReached = !isPremium && status && !status.canSpin && status.maxSpinsToday <= 1;
  const days = status ? streakDays(status.streakCount, status.spinsUsedToday > 0) : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Kunlik baraban" />

      {isLoading ? (
        <div className="h-[480px] animate-pulse rounded-3xl bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-5 py-8 text-primary-foreground sm:p-8">
            <div className="relative aspect-square w-full max-w-[340px]">
              <div
                aria-hidden
                className="absolute -top-2 left-1/2 z-10 size-0 -translate-x-1/2 border-x-16 border-t-[30px] border-x-transparent border-t-gold"
              />
              <div
                onTransitionEnd={handleTransitionEnd}
                className="absolute inset-0 rounded-full border-10 border-white/20"
                style={{
                  background: `conic-gradient(${WHEEL_GRADIENT})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: isAnimating
                    ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                    : undefined,
                }}
              />
              <div className="absolute left-1/2 top-1/2 flex size-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
                {busy ? (
                  <Loader2 className="size-7 animate-spin text-primary" />
                ) : (
                  <DiamondIcon className="size-9" />
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin}
              className="rounded-2xl bg-gold px-12 py-4 text-lg font-bold text-admin transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {busy ? 'Aylanmoqda...' : 'Aylantirish'}
            </button>

            {status && (
              <span className="text-center text-primary-foreground/80">
                {status.canSpin ? (
                  <>
                    Qolgan aylanishlar:{' '}
                    <strong className="text-primary-foreground">
                      {status.spinsRemainingToday} / {status.maxSpinsToday}
                    </strong>
                    {isPremium ? ' · Premium: kuniga 3x' : ''}
                  </>
                ) : (
                  'Bugungi aylanishlar tugadi — ertaga yana kiring!'
                )}
              </span>
            )}
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            {status && (
              <section className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5">
                <div className="flex justify-between">
                  <span className="font-bold">Seriya</span>
                  <span className="font-heading font-bold text-[#B45309] dark:text-gold">
                    {status.streakCount} kun
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {days.map((day, i) => (
                    <span
                      key={i}
                      className={cn(
                        'flex h-10 items-center justify-center rounded-[10px] text-xs font-bold',
                        day.filled
                          ? 'bg-gold text-admin'
                          : day.isToday
                            ? 'border-[1.5px] border-dashed border-muted-foreground/50 text-secondary-foreground'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {status.spinsUsedToday > 0
                    ? 'Ertaga ham kirsangiz seriya davom etadi.'
                    : 'Bugun aylantirsangiz seriya davom etadi.'}
                </span>
              </section>
            )}

            {history && history.length > 0 && (
              <section className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-5">
                <span className="font-bold">So&apos;nggi yutuqlar</span>
                {history.map((win, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{spinTime(win.createdAt)}</span>
                    <span className="font-heading font-semibold text-gold-foreground">
                      +{win.diamondsWon}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {!isPremium && (
              <section
                className={cn(
                  'flex flex-col gap-3 rounded-[20px] p-5',
                  standardCapReached ? 'bg-gold-soft' : 'border border-border bg-card'
                )}
              >
                <span className="flex items-center gap-2 font-bold">
                  <Crown className="size-5 text-gold" /> Premium bilan kuniga 3 marta
                </span>
                <span className="text-sm text-muted-foreground">
                  Standart tarifda kuniga 1 ta, Premiumda esa 3 ta aylanish beriladi.
                </span>
                <Button render={<Link href="/premium" />}>Premium olish</Button>
              </section>
            )}
          </div>
        </div>
      )}

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="rounded-3xl p-6 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-2xl">Tabriklaymiz!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2 py-3">
            <span className="mb-1 flex size-24 items-center justify-center rounded-3xl bg-gold-soft">
              <DiamondIcon className="size-14" />
            </span>
            <p className="font-heading text-4xl font-bold text-gold-foreground">
              +{pendingResult?.diamondsWon ?? 0}
            </p>
            <p className="font-semibold">olmos hisobingizga qo&apos;shildi</p>
            {pendingResult && pendingResult.streakCount > 1 && (
              <span className="mt-1 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-gold-foreground">
                {pendingResult.streakCount} kunlik seriya
              </span>
            )}
          </div>
          <DialogFooter>
            <Button size="lg" className="w-full" onClick={() => setResultOpen(false)}>
              Qabul qilish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
