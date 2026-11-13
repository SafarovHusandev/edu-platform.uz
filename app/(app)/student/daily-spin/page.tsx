'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Check,
  Clock,
  Crown,
  Flame,
  Gift,
  Loader2,
  PartyPopper,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
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
import { useCountUp } from '@/hooks/use-count-up';
import {
  useAnswerDailySpin,
  useDailySpinHistory,
  useDailySpinStatus,
  useDailySpin,
  type DailySpinAnswerResult,
} from '@/hooks/use-daily-spin';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const SPIN_DURATION_MS = 4500;
const SEGMENT_ANGLE = 45;

// 8 bo'lak: rangli bo'laklarda olmos, och bo'laklarda kichik belgilar.
// Baraban faqat rangli (olmosli) bo'lakda to'xtaydi. Yutuqni savolga javob hal qiladi:
// to'xtagach savol chiqadi, olmosni backend javobdan keyin beradi
const SEGMENTS = [
  { fill: 'url(#spin-blue)', prize: true },
  { fill: 'url(#spin-light)', icon: Sparkles },
  { fill: 'url(#spin-green)', prize: true },
  { fill: 'url(#spin-light)', icon: Gift },
  { fill: 'url(#spin-violet)', prize: true },
  { fill: 'url(#spin-light)', icon: Star },
  { fill: 'url(#spin-gold)', prize: true },
  { fill: 'url(#spin-light)', icon: Zap },
];
const PRIZE_SEGMENTS = SEGMENTS.flatMap((s, i) => (s.prize ? [i] : []));
const BULBS = 16;

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

const SPARKLES = [
  { className: 'top-6 left-[7%] size-4', delay: 0 },
  { className: 'top-20 left-[18%] size-3', delay: 900 },
  { className: 'top-8 right-[10%] size-5', delay: 400 },
  { className: 'bottom-24 right-[14%] size-3', delay: 1500 },
  { className: 'bottom-16 left-[10%] size-4', delay: 1200 },
];
const CONFETTI_COLORS = ['#FFD45C', '#FFFFFF', '#F59E0B', '#93C5FD', '#6EE7B7', '#F9A8D4'];
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37 + 5) % 97}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i * 113) % 700,
  round: i % 3 === 0,
}));

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface PendingQuestion {
  question: string;
  options: string[];
  expiresAt: number;
}

// Javob berilmagan savol brauzerda saqlanadi: sahifa yangilansa yo'qolmasin, aks
// holda o'quvchi muddat tugaguncha yangi aylantira olmay qoladi
const pendingKey = (userId: string) => `daily-spin-question:${userId}`;

function readPending(userId: string): PendingQuestion | null {
  try {
    const raw = window.localStorage.getItem(pendingKey(userId));
    const pending = raw ? (JSON.parse(raw) as PendingQuestion) : null;
    return pending && pending.expiresAt > Date.now() ? pending : null;
  } catch {
    return null;
  }
}

function writePending(userId: string, pending: PendingQuestion | null) {
  try {
    if (pending) window.localStorage.setItem(pendingKey(userId), JSON.stringify(pending));
    else window.localStorage.removeItem(pendingKey(userId));
  } catch {
    // saqlash imkoni yo'q (maxfiy rejim) — savol faqat sahifa yopilguncha turadi
  }
}

function delay(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

// Markazdan (0,0) boshlanadigan sektor; burchak tepadan soat yo'nalishida
function segmentPath(index: number, r = 100) {
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(r * Math.cos(rad)).toFixed(3)} ${(r * Math.sin(rad)).toFixed(3)}`;
  };
  const start = index * SEGMENT_ANGLE;
  return `M0 0 L${toXY(start)} A${r} ${r} 0 0 1 ${toXY(start + SEGMENT_ANGLE)} Z`;
}

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

// Yarim tungacha qolgan vaqt (yangi kunlik aylanishlar)
function NextSpinCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight.getTime() - now) / 1000));
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60];
  return (
    <span className="flex flex-col items-center gap-2 text-center text-primary-foreground/80">
      <span className="flex items-center gap-1.5 text-base">
        <Clock className="size-5" /> Yangi aylanishlargacha
      </span>
      <span className="flex gap-1.5 font-heading text-2xl font-bold text-primary-foreground tabular-nums sm:text-3xl">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="rounded-xl bg-white/15 px-2.5 py-1.5">
              {String(part).padStart(2, '0')}
            </span>
            {i < 2 && <span className="text-primary-foreground/60">:</span>}
          </span>
        ))}
      </span>
    </span>
  );
}

// Savolga javob berish uchun qolgan vaqt
function AnswerCountdown({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (left === 0) onExpire();
  }, [left, onExpire]);
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-heading font-bold tabular-nums',
        left <= 30 ? 'bg-destructive-soft text-destructive' : 'bg-primary-soft text-primary'
      )}
    >
      <Clock className="size-4" />
      {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
    </span>
  );
}

function WonDiamonds({ value }: { value: number }) {
  const current = useCountUp(value, 900, 300);
  return <>+{Math.round(current)}</>;
}

function Wheel({
  rotation,
  spinning,
  busy,
  winIndex,
  onStop,
}: {
  rotation: number;
  spinning: boolean;
  busy: boolean;
  winIndex: number | null;
  onStop: () => void;
}) {
  return (
    <div className="relative aspect-square w-full max-w-[360px]">
      <span
        aria-hidden
        className="animate-pulse-slow absolute -inset-8 rounded-full bg-gold/25 blur-3xl"
      />

      {/* Tashqi oltin gardish va chiroqlar */}
      <div className="absolute inset-0 rounded-full bg-linear-to-b from-[#FFE58A] via-gold to-[#B45309] p-[3%] shadow-[0_24px_60px_-12px_rgb(0_0_0/0.55)]">
        <div className="relative size-full rounded-full bg-[oklch(0.25_0.12_268)] p-[5%] shadow-[inset_0_4px_12px_rgb(0_0_0/0.5)]">
          {Array.from({ length: BULBS }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute inset-0"
              style={{ transform: `rotate(${(360 / BULBS) * i}deg)` }}
            >
              <span
                className="spin-bulb absolute top-[1.2%] left-1/2 size-[3%] -translate-x-1/2 rounded-full"
                style={{
                  animationDelay: i % 2 ? '0s' : busy ? '0.15s' : '0.6s',
                  animationDuration: busy ? '0.3s' : '1.2s',
                }}
              />
            </span>
          ))}

          {/* Aylanadigan qism */}
          <div
            onTransitionEnd={onStop}
            className="relative size-full rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.7, 0.1, 1)`
                : undefined,
            }}
          >
            <svg viewBox="-100 -100 200 200" className="size-full drop-shadow-md">
              <defs>
                {[
                  ['spin-blue', '#4F67FF', '#1E2FA8'],
                  ['spin-green', '#2BC48D', '#0B6B4C'],
                  ['spin-violet', '#9B7BFF', '#5B32D6'],
                  ['spin-gold', '#FFDB6E', '#D98A0B'],
                  ['spin-light', '#FFFFFF', '#E3E8FA'],
                ].map(([id, from, to]) => (
                  <radialGradient
                    key={id}
                    id={id}
                    cx="0"
                    cy="0"
                    r="100"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.2" stopColor={from} />
                    <stop offset="1" stopColor={to} />
                  </radialGradient>
                ))}
              </defs>
              {SEGMENTS.map((segment, i) => (
                <path
                  key={i}
                  d={segmentPath(i)}
                  fill={segment.fill}
                  stroke="rgb(255 255 255 / 0.7)"
                  strokeWidth="1"
                />
              ))}
              {winIndex !== null && (
                <path d={segmentPath(winIndex)} fill="#FFFFFF" className="spin-win" />
              )}
            </svg>

            {/* Bo'lak belgilari — bo'lak markaziga, tashqariga qaratib */}
            {SEGMENTS.map((segment, i) => {
              const Icon = segment.icon;
              return (
                <span
                  key={i}
                  aria-hidden
                  className="absolute inset-0 flex justify-center pt-[11%]"
                  style={{ transform: `rotate(${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg)` }}
                >
                  {Icon ? (
                    <Icon className="size-[9%] text-primary/70" />
                  ) : (
                    <span className="flex aspect-square w-[15%] items-center justify-center rounded-full bg-white/90 shadow-md">
                      <DiamondIcon className="h-auto w-[70%]" />
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Markaz */}
      <div className="absolute top-1/2 left-1/2 z-10 flex size-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-linear-to-b from-white to-[#E3E8FA] shadow-[0_6px_20px_rgb(0_0_0/0.35)] ring-4 ring-gold">
        <DiamondIcon className={cn('h-auto w-[58%]', busy ? 'animate-spin' : 'animate-float')} />
      </div>

      {/* Ko'rsatkich */}
      <div
        className={cn(
          'absolute -top-4 left-1/2 z-20 -translate-x-1/2 drop-shadow-[0_4px_6px_rgb(0_0_0/0.35)]',
          spinning && 'spin-tick'
        )}
      >
        <svg viewBox="0 0 40 52" className="h-13 w-10">
          <path
            d="M20 50 L4 18 A17 17 0 1 1 36 18 Z"
            fill="url(#spin-pointer)"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="16" r="5" fill="#FFFFFF" />
          <defs>
            <linearGradient id="spin-pointer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE58A" />
              <stop offset="1" stopColor="#E08A00" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function SpinQuestionDialog({
  open,
  pending,
  selected,
  submitting,
  result,
  onSelect,
  onExpire,
  onClose,
}: {
  open: boolean;
  pending: PendingQuestion | null;
  selected: number | null;
  submitting: boolean;
  result: DailySpinAnswerResult | null;
  onSelect: (index: number) => void;
  onExpire: () => void;
  onClose: () => void;
}) {
  if (!pending) return null;
  const won = !!result?.correct && result.diamondsWon > 0;
  return (
    // Javob berilguncha oyna yopilmaydi: aylanish allaqachon ishlatilgan
    <Dialog open={open} onOpenChange={(next) => !next && result && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden rounded-3xl p-6 sm:max-w-lg"
      >
        {won && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className={cn(
                  'lb-confetti absolute -top-3 h-3 w-1.5',
                  c.round && 'size-2 rounded-full'
                )}
                style={{ left: c.left, backgroundColor: c.color, ...delay(c.delay) }}
              />
            ))}
          </div>
        )}
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-heading text-xl">
              {!result
                ? 'Savolga javob bering'
                : result.correct
                  ? (
                      <span className="inline-flex items-center gap-2">
                        To&apos;g&apos;ri! <PartyPopper className="size-5 text-gold" />
                      </span>
                    )
                  : "Noto'g'ri javob"}
            </DialogTitle>
            {!result && <AnswerCountdown expiresAt={pending.expiresAt} onExpire={onExpire} />}
          </div>
        </DialogHeader>

        <p className="text-lg leading-snug font-semibold wrap-break-word">{pending.question}</p>

        <div className="flex flex-col gap-2.5">
          {pending.options.map((option, index) => {
            const isCorrect = result?.correctIndex === index;
            const isWrongPick = !!result && selected === index && !isCorrect;
            const isPicked = !result && selected === index;
            return (
              <button
                key={index}
                type="button"
                disabled={!!result || submitting}
                onClick={() => onSelect(index)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left font-semibold transition-colors',
                  isCorrect
                    ? 'border-success bg-success-soft text-success'
                    : isWrongPick
                      ? 'border-destructive bg-destructive-soft text-destructive'
                      : isPicked
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border bg-card enabled:hover:border-primary/40',
                  result && !isCorrect && !isWrongPick && 'opacity-60'
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold',
                    isCorrect
                      ? 'bg-success text-white'
                      : isWrongPick
                        ? 'bg-destructive text-white'
                        : isPicked
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-secondary-foreground'
                  )}
                >
                  {isCorrect ? (
                    <Check className="size-4" />
                  ) : isWrongPick ? (
                    <X className="size-4" />
                  ) : isPicked && submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    (OPTION_LETTERS[index] ?? index + 1)
                  )}
                </span>
                <span className="min-w-0 wrap-break-word">{option}</span>
              </button>
            );
          })}
        </div>

        {result && (
          <div className="lb-fade-up flex flex-col items-center gap-1 text-center">
            {won ? (
              <>
                <p className="flex items-center gap-2 font-heading text-4xl font-bold text-gold-foreground">
                  <DiamondIcon className="lb-pop size-9" />
                  <WonDiamonds value={result.diamondsWon} />
                </p>
                <p className="font-semibold">olmos hisobingizga qo&apos;shildi</p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Bu safar olmos yo&apos;q, lekin to&apos;g&apos;ri javobni endi bilasiz.
              </p>
            )}
            {!!result.streakCount && result.streakCount > 1 && (
              <span className="mt-1 flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 text-sm font-bold text-gold-foreground">
                <Flame className="size-3.5 fill-[#F59E0B] text-[#EA580C]" />
                {result.streakCount} kunlik seriya
              </span>
            )}
          </div>
        )}

        {result && (
          <DialogFooter>
            <Button size="lg" className="w-full" onClick={onClose}>
              Yopish
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function DailySpinPage() {
  const isPremium = useAuthStore((s) => s.user?.tarif === 'premium');
  const { data: status, isLoading, isError, refetch } = useDailySpinStatus();
  const spin = useDailySpin();
  const answer = useAnswerDailySpin();
  const userId = useAuthStore((s) => s.user?._id);

  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winIndex, setWinIndex] = useState<number | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [pending, setPending] = useState<PendingQuestion | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<DailySpinAnswerResult | null>(null);
  const { data: history } = useDailySpinHistory(5);

  // Sahifa yangilanganda javob berilmagan savolni bir marta tiklaymiz
  const [restoredFor, setRestoredFor] = useState<string | null>(null);
  if (userId && restoredFor !== userId) {
    setRestoredFor(userId);
    const saved = readPending(userId);
    if (saved) {
      setPending(saved);
      setQuestionOpen(true);
    }
  }

  const canSpin = !!status?.canSpin && !spin.isPending && !isAnimating;
  const busy = spin.isPending || isAnimating;

  function handleSpin() {
    if (!canSpin) return;
    setShowWin(false);
    spin.mutate(undefined, {
      onSuccess: (result) => {
        const target = PRIZE_SEGMENTS[Math.floor(Math.random() * PRIZE_SEGMENTS.length)];
        const center = target * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
        const next: PendingQuestion = {
          question: result.question.question,
          options: result.question.options,
          expiresAt: Date.now() + (result.answerWithinMinutes ?? 5) * 60_000,
        };
        if (userId) writePending(userId, next);
        setPending(next);
        setSelected(null);
        setAnswerResult(null);
        setWinIndex(target);
        setIsAnimating(true);
        setRotation((prev) => {
          const offset = (((-center - prev) % 360) + 360) % 360;
          return prev + 360 * 6 + offset + jitter;
        });
      },
    });
  }

  function handleStop() {
    if (!isAnimating) return;
    setIsAnimating(false);
    setShowWin(true);
    setTimeout(() => setQuestionOpen(true), 900);
  }

  function discardQuestion() {
    if (userId) writePending(userId, null);
    setPending(null);
    setQuestionOpen(false);
    setSelected(null);
    setAnswerResult(null);
    setShowWin(false);
  }

  function handleExpire() {
    discardQuestion();
    toast.error('Javob berish vaqti tugadi');
    refetch();
  }

  function handleAnswer(index: number) {
    if (answer.isPending || answerResult) return;
    setSelected(index);
    answer.mutate(index, {
      onSuccess: (result) => {
        if (userId) writePending(userId, null);
        setAnswerResult(result);
      },
      onError: (error) => {
        // 400: muddat tugagan yoki savol bekor — tarmoq xatosida esa qayta urinsin
        if (error instanceof ApiError && error.status === 400) discardQuestion();
        else setSelected(null);
      },
    });
  }

  // Noto'g'ri javoblar (0 olmos) yutuqlar ro'yxatiga kirmaydi
  const wins = history?.filter((win) => win.diamondsWon > 0) ?? [];
  const standardCapReached = !isPremium && status && !status.canSpin && status.maxSpinsToday <= 1;
  const days = status ? streakDays(status.streakCount, status.spinsUsedToday > 0) : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Kunlik baraban" />

      {isLoading ? (
        <div className="h-[560px] animate-pulse rounded-3xl bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="relative flex flex-col items-center gap-7 overflow-hidden rounded-3xl bg-linear-to-b from-primary to-[oklch(0.33_0.19_268)] px-5 py-8 text-primary-foreground shadow-xl shadow-primary/25 sm:p-10">
            <span
              aria-hidden
              className="absolute -bottom-24 -left-16 size-64 rounded-full bg-white/10 blur-3xl"
            />
            <span
              aria-hidden
              className="absolute -top-20 -right-20 size-64 rounded-full bg-[#93C5FD]/15 blur-3xl"
            />
            {SPARKLES.map((s) => (
              <Sparkles
                key={s.className}
                aria-hidden
                className={cn('lb-twinkle absolute text-white/70', s.className)}
                style={delay(s.delay)}
              />
            ))}
            <span className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-base font-semibold backdrop-blur-sm">
              <Sparkles className="size-4.5 text-gold" /> Aylantiring, savolga javob bering — olmos yuting
            </span>

            <Wheel
              rotation={rotation}
              spinning={isAnimating}
              busy={busy}
              winIndex={showWin ? winIndex : null}
              onStop={handleStop}
            />

            {status?.canSpin || busy ? (
              <>
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!canSpin}
                  className={cn(
                    'lb-shine relative rounded-2xl bg-linear-to-b from-[#FFD45C] to-gold px-16 py-4 text-xl font-bold text-admin shadow-[0_6px_0_#B45309] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_#B45309] active:translate-y-1 active:shadow-[0_2px_0_#B45309] disabled:pointer-events-none disabled:opacity-70',
                    canSpin && 'spin-cta'
                  )}
                >
                  {busy ? 'Aylanmoqda...' : 'Aylantirish'}
                </button>
                {status && (
                  <span className="relative flex items-center gap-2 text-base text-primary-foreground/80 sm:text-lg">
                    Qolgan aylanishlar:
                    <span className="flex gap-1">
                      {Array.from({ length: status.maxSpinsToday }, (_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'size-3 rounded-full transition-colors',
                            i < status.spinsRemainingToday ? 'bg-gold' : 'bg-white/25'
                          )}
                        />
                      ))}
                    </span>
                    <strong className="text-primary-foreground">
                      {status.spinsRemainingToday} / {status.maxSpinsToday}
                    </strong>
                  </span>
                )}
              </>
            ) : (
              <NextSpinCountdown />
            )}
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            {status && (
              <section className="lb-fade-up flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Seriya</span>
                  <span className="flex items-center gap-1 font-heading text-lg font-bold text-[#B45309] dark:text-gold">
                    <Flame
                      className={cn(
                        'size-6 fill-[#F59E0B] text-[#EA580C]',
                        status.streakCount > 0 && 'animate-float'
                      )}
                    />
                    {status.streakCount} kun
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {days.map((day, i) => (
                    <span
                      key={i}
                      className={cn(
                        'flex h-11 items-center justify-center rounded-xl text-sm font-bold',
                        day.filled
                          ? 'lb-pop bg-linear-to-b from-[#FFD45C] to-gold text-admin shadow-sm shadow-gold/40'
                          : day.isToday
                            ? 'animate-pulse border-[1.5px] border-dashed border-gold text-secondary-foreground'
                            : 'bg-muted text-muted-foreground'
                      )}
                      style={day.filled ? delay(i * 70) : undefined}
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
                <span className="text-[15px] text-muted-foreground">
                  {status.spinsUsedToday > 0
                    ? 'Ertaga ham kirsangiz seriya davom etadi.'
                    : 'Bugun aylantirsangiz seriya davom etadi.'}
                </span>
              </section>
            )}

            {wins.length > 0 && (
              <section
                className="lb-fade-up flex flex-col gap-1 rounded-[20px] border border-border bg-card p-5"
                style={delay(100)}
              >
                <span className="mb-1.5 text-lg font-bold">So&apos;nggi yutuqlar</span>
                {wins.map((win, i) => (
                  <div
                    key={i}
                    className="lb-fade-up flex items-center justify-between rounded-xl px-2 py-2 text-base transition-colors hover:bg-muted/60"
                    style={delay(150 + i * 60)}
                  >
                    <span className="text-secondary-foreground">{spinTime(win.createdAt)}</span>
                    <span className="flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 font-heading text-base font-semibold text-gold-foreground">
                      <DiamondIcon className="size-4" />+{win.diamondsWon}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {!isPremium && (
              <section
                className={cn(
                  'lb-fade-up relative flex flex-col gap-3 overflow-hidden rounded-[20px] border p-5',
                  standardCapReached
                    ? 'border-gold/60 bg-linear-to-br from-gold-soft to-card'
                    : 'border-border bg-card'
                )}
                style={delay(200)}
              >
                <span
                  aria-hidden
                  className="animate-pulse-slow absolute -top-10 -right-10 size-32 rounded-full bg-gold/25 blur-2xl"
                />
                <span className="relative flex items-center gap-2 text-lg font-bold">
                  <Crown className="animate-float size-6 fill-gold text-gold" /> Premium bilan
                  kuniga 3 marta
                </span>
                <span className="relative text-[15px] text-muted-foreground">
                  Standart tarifda kuniga 1 ta, Premiumda esa 3 ta aylanish beriladi.
                </span>
                <Button
                  size="lg"
                  className="lb-shine relative text-base"
                  render={<Link href="/premium" />}
                >
                  Premium olish
                </Button>
              </section>
            )}
          </div>
        </div>
      )}

      <SpinQuestionDialog
        open={questionOpen}
        pending={pending}
        selected={selected}
        submitting={answer.isPending}
        result={answerResult}
        onSelect={handleAnswer}
        onExpire={handleExpire}
        onClose={discardQuestion}
      />
    </div>
  );
}
