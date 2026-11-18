'use client';

import { useState } from 'react';
import { Check, Eye, Star, X } from 'lucide-react';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { OptionShape, optionStyle } from '@/components/live-quiz/option-styles';
import { boardButton } from '@/components/super-teacher/board-layout';
import { PRAISES, RETRY_HINTS, starsForAttempts } from '@/lib/board-lesson';
import { pickRandom } from '@/lib/class-roster';
import { toServerUrl } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { BoardLessonExercise } from '@/types/board-lesson';

export interface ExerciseOutcome {
  stars: number;
  wrongAttempts: number;
  revealed: boolean;
}

export function StarRow({ count, max = 3, className }: { count: number; max?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={`${count} / ${max} yulduz`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-[1em]',
            i < count ? 'lesson-star-pop fill-[#FFD166] text-[#FFD166]' : 'fill-white/15 text-white/25'
          )}
          style={i < count ? { animationDelay: `${i * 160}ms` } : undefined}
        />
      ))}
    </span>
  );
}

// Doskadagi mashq: o'quvchi chiqib variantni bosadi. Xato — silkinadi va o'chadi,
// to'g'ri — konfetti, maqtov va yulduzlar. O'qituvchi javobni ochib ko'rsata oladi.
export function ExerciseView({
  exercise,
  index,
  total,
  onAnswer,
  onSolved,
}: {
  exercise: BoardLessonExercise;
  index: number;
  total: number;
  // Har bosishda (ovoz/konfetti uchun): to'g'ri bo'lsa — bosilgan nuqta
  onAnswer?: (correct: boolean, point: { x: number; y: number }) => void;
  onSolved: (outcome: ExerciseOutcome) => void;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [shaking, setShaking] = useState<number | null>(null);
  const [solved, setSolved] = useState<ExerciseOutcome | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const image = toServerUrl(exercise.image);

  const choose = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (solved || wrong.includes(i)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const point = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    if (i === exercise.correctIndex) {
      const outcome = { stars: starsForAttempts(wrong.length, false), wrongAttempts: wrong.length, revealed: false };
      setSolved(outcome);
      setMessage(pickRandom(PRAISES));
      onAnswer?.(true, point);
      onSolved(outcome);
    } else {
      setWrong((w) => [...w, i]);
      setShaking(i);
      setMessage(pickRandom(RETRY_HINTS));
      onAnswer?.(false, point);
    }
  };

  const reveal = () => {
    if (solved) return;
    const outcome = { stars: 0, wrongAttempts: wrong.length, revealed: true };
    setSolved(outcome);
    setMessage("To'g'ri javob shu!");
    onSolved(outcome);
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 text-[clamp(1.1rem,1.6vw,1.6rem)]">
        <span className="rounded-full bg-white/15 px-4 py-1.5 font-heading font-bold tabular-nums">
          {index + 1} / {total}
        </span>
        <span
          key={message ?? 'none'}
          className={cn(
            'live-pop-in rounded-full px-5 py-1.5 font-heading font-bold',
            !message && 'invisible',
            solved && !solved.revealed ? 'bg-[#FFD166] text-[#3A2800]' : 'bg-white/15'
          )}
          aria-live="polite"
        >
          {message ?? '·'}
        </span>
        {solved && !solved.revealed && <StarRow count={solved.stars} className="text-[1.6em]" />}
        {!solved && (
          <button type="button" onClick={reveal} className={boardButton('secondary', 'ml-auto min-h-14 text-lg')}>
            <Eye className="size-6" /> Javobni ko&apos;rsatish
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <QuestionMarkdown text={exercise.text} variant="board" className="w-full" />
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="max-h-[34vh] max-w-full rounded-2xl object-contain shadow-xl" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {exercise.options.map((text, i) => {
          const style = optionStyle(i);
          const isCorrect = i === exercise.correctIndex;
          const isWrong = wrong.includes(i);
          const state = solved ? (isCorrect ? 'correct' : 'dim') : isWrong ? 'wrong' : 'normal';
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => choose(i, e)}
              onAnimationEnd={() => shaking === i && setShaking(null)}
              disabled={!!solved || isWrong}
              className={cn(
                'relative flex min-h-24 items-center gap-4 rounded-2xl px-6 py-5 text-left text-white shadow-[0_8px_0_rgb(0_0_0/0.28)] transition-[transform,opacity,filter] duration-300 select-none',
                'text-[clamp(1.4rem,2.4vw,2.5rem)] font-bold',
                'active:translate-y-1 active:shadow-[0_3px_0_rgb(0_0_0/0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70',
                style.bg,
                state === 'wrong' && 'opacity-35 grayscale',
                state === 'dim' && 'scale-[0.97] opacity-30 saturate-50',
                state === 'correct' && 'lesson-zoom-in ring-[8px] ring-white',
                shaking === i && 'lesson-shake'
              )}
            >
              <OptionShape index={i} className="size-[1.3em]" title={`${style.name} ${style.symbol}`} />
              <span className="min-w-0 flex-1 break-words leading-tight">{text}</span>
              {state === 'correct' && (
                <span className="flex size-[1.4em] shrink-0 items-center justify-center rounded-full bg-white">
                  <Check className={cn('size-[0.95em]', style.text)} strokeWidth={4} />
                </span>
              )}
              {state === 'wrong' && (
                <span className="flex size-[1.4em] shrink-0 items-center justify-center rounded-full bg-black/30">
                  <X className="size-[0.95em]" strokeWidth={4} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
