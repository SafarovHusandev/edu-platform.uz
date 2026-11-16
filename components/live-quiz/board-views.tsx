'use client';

import { useEffect, useState } from 'react';
import { Check, Flame, Users, Zap } from 'lucide-react';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { PlayerAvatar } from '@/components/live-quiz/player-avatars';
import { OptionShape, optionStyle } from '@/components/live-quiz/option-styles';
import { toServerUrl } from '@/lib/live-quiz';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { LiveLeaderboardEntry, PointsMultiplier } from '@/types/live-quiz';

// ---------- Taymer ----------

// Server soati bo'yicha qolgan vaqt. offset = serverNow - Date.now() (savol kelgan payt).
// 0 ga yetganda savolni o'zimiz yopmaymiz — serverdan question:end/result kutiladi.
export function useCountdown(endsAt: number | null | undefined, offset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (!endsAt) return null;
  return Math.max(0, endsAt - (now + offset));
}

export function CountdownRing({
  remainingMs,
  totalMs,
  className,
}: {
  remainingMs: number;
  totalMs: number;
  className?: string;
}) {
  const seconds = Math.ceil(remainingMs / 1000);
  const fraction = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0;
  const urgent = seconds <= 5;
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn('relative size-28 shrink-0', className)}
      role="timer"
      aria-label={`${seconds} soniya qoldi`}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-current opacity-15" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          className={cn(
            'fill-none transition-[stroke-dashoffset,stroke] duration-200 ease-linear',
            urgent ? 'stroke-[#FF4D5E]' : 'stroke-[#4ADE80]'
          )}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-heading font-bold tabular-nums',
          'text-[2em]',
          urgent && 'animate-pulse text-[#FF4D5E]'
        )}
      >
        {seconds}
      </span>
    </div>
  );
}

// ---------- Variantlar ----------

export type OptionTileState = 'normal' | 'correct' | 'dim';

export function OptionTile({
  index,
  text,
  state = 'normal',
  size = 'board',
  className,
}: {
  index: number;
  text: string;
  state?: OptionTileState;
  size?: 'board' | 'compact';
  className?: string;
}) {
  const style = optionStyle(index);
  return (
    <div
      className={cn(
        'relative flex min-h-16 items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-[0_6px_0_rgb(0_0_0/0.25)] transition-all duration-500',
        style.bg,
        size === 'board'
          ? 'text-[clamp(1.25rem,2.2vw,2.25rem)] font-bold'
          : // telefon: 360px da ~22px, katta ekranda 40px gacha
            'text-[clamp(1.375rem,1rem+1.6vw,2.5rem)] font-bold',
        state === 'dim' && 'scale-[0.97] opacity-30 saturate-50',
        state === 'correct' && 'ring-[6px] ring-white',
        className
      )}
    >
      <OptionShape
        index={index}
        className="size-[1.4em]"
        title={`${style.name} ${style.symbol}`}
      />
      <span className="min-w-0 flex-1 break-words leading-tight">{text}</span>
      {state === 'correct' && (
        <span className="flex size-[1.4em] shrink-0 items-center justify-center rounded-full bg-white">
          <Check className={cn('size-[0.9em]', style.text)} strokeWidth={4} />
        </span>
      )}
    </div>
  );
}

export function OptionGrid({
  options,
  correctIndex,
  size = 'board',
}: {
  options: string[];
  correctIndex?: number | null;
  size?: 'board' | 'compact';
}) {
  const revealed = correctIndex != null && correctIndex >= 0;
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', size === 'board' && 'gap-4')}>
      {options.map((text, i) => (
        <OptionTile
          key={i}
          index={i}
          text={text}
          size={size}
          state={revealed ? (i === correctIndex ? 'correct' : 'dim') : 'normal'}
        />
      ))}
    </div>
  );
}

// ---------- Reyting ----------

export function LeaderboardList({
  entries,
  limit,
  className,
}: {
  entries: LiveLeaderboardEntry[];
  limit?: number;
  className?: string;
}) {
  const list = limit ? entries.slice(0, limit) : entries;
  if (list.length === 0)
    return <p className="text-center text-2xl opacity-70">Hali ball to&apos;plangani yo&apos;q</p>;
  return (
    <ol className={cn('flex flex-col gap-2.5', className)}>
      {list.map((entry, i) => (
        <li
          key={entry.id ?? `${entry.name}-${i}`}
          className="live-rise flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3 text-[clamp(1.25rem,1.8vw,2rem)] font-bold"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <span className="w-10 text-center font-heading tabular-nums opacity-80">{entry.rank}</span>
          <PlayerAvatar avatar={entry.avatar} className="size-[1.6em]" />
          <span className="min-w-0 flex-1 truncate">{entry.name}</span>
          {entry.streak != null && entry.streak >= 2 && (
            <span className="flex items-center gap-1 text-[0.75em] font-semibold opacity-90">
              <Flame className="size-[1em] text-[#FFC62E]" aria-label="ketma-ket" /> {entry.streak}
            </span>
          )}
          <span className="font-heading tabular-nums">{formatNumber(entry.score)}</span>
        </li>
      ))}
    </ol>
  );
}

// ---------- Savol ekrani (doska va muharrirdagi "Ko'rib chiqish") ----------

export interface BoardQuestionData {
  index: number;
  total: number;
  text: string;
  image?: string | null;
  options: string[];
  timeLimit: number;
  pointsMultiplier: PointsMultiplier;
}

export function PointsBadge({ multiplier }: { multiplier: PointsMultiplier }) {
  if (multiplier === 1) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold',
        multiplier === 2 ? 'bg-[#FFC62E] text-[#3A2800]' : 'bg-white/15'
      )}
    >
      {multiplier === 2 ? (
        <>
          <Zap className="size-5" /> 2× ball
        </>
      ) : (
        'Ballsiz'
      )}
    </span>
  );
}

export function BoardQuestion({
  question,
  remainingMs,
  answered,
  correctIndex,
  footer,
}: {
  question: BoardQuestionData;
  // null — taymer ko'rsatilmaydi (natija bosqichi)
  remainingMs?: number | null;
  answered?: { answered: number; total: number } | null;
  correctIndex?: number | null;
  footer?: React.ReactNode;
}) {
  const image = toServerUrl(question.image);
  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 text-[clamp(1.1rem,1.6vw,1.6rem)]">
        <span className="rounded-full bg-white/15 px-4 py-1.5 font-heading font-bold tabular-nums">
          {question.index + 1} / {question.total}
        </span>
        <PointsBadge multiplier={question.pointsMultiplier} />
        {answered && (
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-semibold tabular-nums">
            <Users className="size-5" /> Javob berdi: {answered.answered} / {answered.total}
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
          <QuestionMarkdown text={question.text} variant="board" className="w-full" />
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="max-h-[38vh] max-w-full rounded-2xl object-contain"
            />
          )}
        </div>
        {remainingMs != null && (
          <CountdownRing
            remainingMs={remainingMs}
            totalMs={question.timeLimit * 1000}
            className="size-[clamp(6rem,11vw,10rem)] text-[clamp(1rem,1.6vw,1.6rem)]"
          />
        )}
      </div>

      <OptionGrid options={question.options} correctIndex={correctIndex} />
      {footer}
    </div>
  );
}
