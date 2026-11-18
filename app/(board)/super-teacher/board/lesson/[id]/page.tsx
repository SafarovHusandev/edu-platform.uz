'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Dumbbell,
  Flag,
  Loader2,
  Play,
  RotateCcw,
  Star,
  Trophy,
} from 'lucide-react';
import { BoardLayout, boardButton } from '@/components/super-teacher/board-layout';
import { useBoardSound } from '@/components/super-teacher/sound-toggle';
import { Confetti, type ConfettiHandle } from '@/components/board-lesson/confetti';
import { LessonBackdrop, SlideView } from '@/components/board-lesson/slide-view';
import { ExerciseView, StarRow, type ExerciseOutcome } from '@/components/board-lesson/exercise-view';
import { useBoardLesson } from '@/hooks/use-board-lessons';
import { ApiError } from '@/lib/api-client';
import { lessonTheme } from '@/lib/board-lesson';
import { sounds } from '@/lib/class-roster';
import { cn } from '@/lib/utils';
import type { BoardLesson } from '@/types/board-lesson';

const LIST_HREF = '/super-teacher/lessons';

type Phase = 'cover' | 'slides' | 'practice-intro' | 'practice' | 'finish';

function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) {
        if (dx < 0) onLeft();
        else onRight();
      }
    },
  };
}

function LessonPlayer({ lesson }: { lesson: BoardLesson }) {
  const { muted, button: soundButton } = useBoardSound();
  const confetti = useRef<ConfettiHandle>(null);
  const slides = lesson.slides;
  const exercises = lesson.exercises;
  const theme = lessonTheme(lesson.theme);

  const [phase, setPhase] = useState<Phase>('cover');
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [exIndex, setExIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<(ExerciseOutcome | null)[]>([]);
  // Mashqni qaytadan boshlaganda ExerciseView holatini tozalash uchun
  const [round, setRound] = useState(0);

  const play = useCallback((fn: () => void) => !muted && fn(), [muted]);

  const startSlides = useCallback(
    (index = 0) => {
      setDirection('next');
      setSlideIndex(index);
      setPhase(slides.length ? 'slides' : 'practice-intro');
    },
    [slides.length]
  );

  const startPractice = useCallback(() => {
    setOutcomes(exercises.map(() => null));
    setExIndex(0);
    setRound((r) => r + 1);
    setPhase('practice');
    play(sounds.whoosh);
  }, [exercises, play]);

  const finish = useCallback(() => {
    setPhase('finish');
    play(sounds.fanfare);
    setTimeout(() => confetti.current?.rain(4000), 150);
  }, [play]);

  const nextSlide = useCallback(() => {
    if (slideIndex < slides.length - 1) {
      setDirection('next');
      setSlideIndex((i) => i + 1);
      play(sounds.whoosh);
    } else if (exercises.length) {
      setPhase('practice-intro');
      play(sounds.win);
    } else {
      finish();
    }
  }, [slideIndex, slides.length, exercises.length, play, finish]);

  const prevSlide = useCallback(() => {
    if (slideIndex === 0) return;
    setDirection('prev');
    setSlideIndex((i) => i - 1);
    play(sounds.whoosh);
  }, [slideIndex, play]);

  const solved = outcomes[exIndex] != null;
  const nextExercise = useCallback(() => {
    if (!solved) return;
    if (exIndex < exercises.length - 1) {
      setExIndex((i) => i + 1);
      play(sounds.whoosh);
    } else finish();
  }, [solved, exIndex, exercises.length, play, finish]);

  // Klaviatura va prezentatsiya pulti (PageUp/PageDown)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea,[role=dialog]')) return;
      const forward = ['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key);
      const back = ['ArrowLeft', 'PageUp'].includes(e.key);
      if (!forward && !back) return;
      if (phase === 'slides') {
        e.preventDefault();
        if (forward) nextSlide();
        else prevSlide();
      } else if (phase === 'practice' && forward && solved) {
        e.preventDefault();
        nextExercise();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, nextSlide, prevSlide, nextExercise, solved]);

  const swipe = useSwipe(nextSlide, prevSlide);

  const totalStars = outcomes.reduce((sum, o) => sum + (o?.stars ?? 0), 0);
  const maxStars = exercises.length * 3;

  return (
    <BoardLayout exitHref={LIST_HREF} controls={soundButton} className="isolate bg-transparent">
      <LessonBackdrop theme={lesson.theme} className="fixed inset-0 -z-10" />
      <Confetti ref={confetti} />

      {phase === 'cover' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <span
            className="lesson-bob flex size-[clamp(6rem,11vw,9rem)] items-center justify-center rounded-[30%] shadow-[0_12px_0_rgb(0_0_0/0.2)]"
            style={{ backgroundColor: theme.accent }}
          >
            <BookOpen className="size-[55%] text-[#1B1B3A]" strokeWidth={2.2} />
          </span>
          <div className="flex flex-col gap-3">
            {(lesson.subject || lesson.grade) && (
              <p className="text-[clamp(1.25rem,2vw,2rem)] font-semibold text-white/80">
                {[lesson.subject, lesson.grade ? `${lesson.grade}-sinf` : null].filter(Boolean).join(' · ')}
              </p>
            )}
            <h1 className="lesson-zoom-in font-heading text-[clamp(2.75rem,6vw,6rem)] font-bold leading-[1.05] text-balance drop-shadow-[0_4px_0_rgb(0_0_0/0.2)]">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="mx-auto max-w-4xl text-[clamp(1.25rem,2vw,2rem)] text-white/85">{lesson.description}</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {slides.length > 0 && (
              <button type="button" onClick={() => startSlides(0)} className={boardButton('primary', 'min-h-20 px-12 text-2xl')}>
                <Play className="size-7" /> Darsni boshlash
              </button>
            )}
            {exercises.length > 0 && (
              <button
                type="button"
                onClick={() => setPhase('practice-intro')}
                className={boardButton(slides.length ? 'secondary' : 'primary', slides.length ? '' : 'min-h-20 px-12 text-2xl')}
              >
                <Dumbbell className="size-6" /> Mashqqa o&apos;tish
              </button>
            )}
          </div>
          <p className="text-lg text-white/60">
            {slides.length} ta slayd · {exercises.length} ta mashq
          </p>
        </div>
      )}

      {phase === 'slides' && slides[slideIndex] && (
        <div className="flex flex-1 flex-col gap-6" {...swipe}>
          <div className="flex items-center gap-3 pr-0 text-lg text-white/75 lg:pr-80">
            <span className="truncate font-semibold">{lesson.title}</span>
          </div>
          <div
            key={slideIndex}
            className={cn(
              'flex min-h-0 flex-1 flex-col justify-center px-2 sm:px-6',
              direction === 'next' ? 'lesson-enter-next' : 'lesson-enter-prev'
            )}
          >
            <SlideView slide={slides[slideIndex]} lessonThemeKey={lesson.theme} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={prevSlide}
              disabled={slideIndex === 0}
              className={boardButton('secondary', 'px-0 sm:px-6')}
              aria-label="Oldingi slayd"
            >
              <ArrowLeft className="size-7" /> <span className="hidden sm:inline">Orqaga</span>
            </button>
            <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Slaydlar">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === slideIndex}
                  aria-label={`${i + 1}-slayd`}
                  onClick={() => {
                    setDirection(i > slideIndex ? 'next' : 'prev');
                    setSlideIndex(i);
                  }}
                  className={cn(
                    'h-4 rounded-full transition-all',
                    i === slideIndex ? 'w-12' : 'w-4 bg-white/35'
                  )}
                  style={i === slideIndex ? { backgroundColor: theme.accent } : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={nextSlide}
              className={boardButton(slideIndex === slides.length - 1 ? 'success' : 'primary', 'px-0 sm:px-8')}
              aria-label="Keyingi"
            >
              <span className="hidden sm:inline">
                {slideIndex < slides.length - 1 ? 'Keyingi' : exercises.length ? 'Mashq' : 'Yakunlash'}
              </span>
              {slideIndex < slides.length - 1 ? <ArrowRight className="size-7" /> : exercises.length ? <Dumbbell className="size-7" /> : <Flag className="size-7" />}
            </button>
          </div>
        </div>
      )}

      {phase === 'practice-intro' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <span
            className="lesson-zoom-in flex size-[clamp(7rem,13vw,11rem)] items-center justify-center rounded-full shadow-[0_12px_0_rgb(0_0_0/0.2)]"
            style={{ backgroundColor: theme.accent }}
          >
            <Dumbbell className="lesson-bob size-[55%] text-[#1B1B3A]" strokeWidth={2.2} />
          </span>
          <h1 className="lesson-zoom-in font-heading text-[clamp(3rem,7vw,7rem)] font-bold leading-none drop-shadow-[0_4px_0_rgb(0_0_0/0.2)]">
            Mashq vaqti!
          </h1>
          <p className="max-w-3xl text-[clamp(1.25rem,2.2vw,2.25rem)] text-white/85">
            {exercises.length} ta savol. Har bir to&apos;g&apos;ri javob uchun 3 tagacha
            <Star className="mx-2 inline size-[1em] fill-[#FFD166] text-[#FFD166]" />
            yulduz!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={startPractice} className={boardButton('success', 'min-h-20 px-12 text-2xl')}>
              <Play className="size-7" /> Boshladik!
            </button>
            {slides.length > 0 && (
              <button type="button" onClick={() => startSlides(slides.length - 1)} className={boardButton('secondary')}>
                <ArrowLeft className="size-6" /> Mavzuga qaytish
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'practice' && exercises[exIndex] && (
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-4 pr-0 lg:pr-80">
            <div className="flex flex-1 gap-1.5" aria-hidden>
              {exercises.map((_, i) => {
                const o = outcomes[i];
                return (
                  <span
                    key={i}
                    className={cn(
                      'h-3 flex-1 rounded-full transition-colors',
                      o ? (o.stars === 3 ? 'bg-[#FFD166]' : o.stars > 0 ? 'bg-white' : 'bg-white/40') : i === exIndex ? 'bg-white/50' : 'bg-white/15'
                    )}
                  />
                );
              })}
            </div>
            <span className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 font-heading text-2xl font-bold tabular-nums">
              <Star className="size-7 fill-[#FFD166] text-[#FFD166]" /> {totalStars}
            </span>
          </div>

          <div key={`${round}-${exIndex}`} className="lesson-enter-next flex flex-1 flex-col">
            <ExerciseView
              exercise={exercises[exIndex]}
              index={exIndex}
              total={exercises.length}
              onAnswer={(correct, point) => {
                if (correct) {
                  play(sounds.win);
                  confetti.current?.burst({ x: point.x, y: point.y });
                } else play(sounds.wrong);
              }}
              onSolved={(outcome) =>
                setOutcomes((list) => list.map((o, i) => (i === exIndex ? outcome : o)))
              }
            />
          </div>

          <div className={cn('flex justify-end transition-opacity', !solved && 'pointer-events-none opacity-0')}>
            <button type="button" onClick={nextExercise} className={boardButton('primary', 'min-h-20 px-12 text-2xl')}>
              {exIndex < exercises.length - 1 ? (
                <>
                  Keyingi savol <ArrowRight className="size-7" />
                </>
              ) : (
                <>
                  Natija <Trophy className="size-7" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {phase === 'finish' && (
        <FinishScreen
          accent={theme.accent}
          totalStars={totalStars}
          maxStars={maxStars}
          outcomes={outcomes}
          hasExercises={exercises.length > 0}
          onRetry={startPractice}
          onSlides={slides.length ? () => startSlides(0) : undefined}
        />
      )}
    </BoardLayout>
  );
}

function FinishScreen({
  accent,
  totalStars,
  maxStars,
  outcomes,
  hasExercises,
  onRetry,
  onSlides,
}: {
  accent: string;
  totalStars: number;
  maxStars: number;
  outcomes: (ExerciseOutcome | null)[];
  hasExercises: boolean;
  onRetry: () => void;
  onSlides?: () => void;
}) {
  const ratio = maxStars ? totalStars / maxStars : 1;
  const rating = ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : ratio > 0 ? 1 : 0;
  const title = !hasExercises
    ? 'Dars tugadi!'
    : rating === 3
      ? 'Ajoyib natija!'
      : rating === 2
        ? 'Yaxshi ish!'
        : 'Yana mashq qilamiz!';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
      <span
        className="lesson-zoom-in flex size-[clamp(7rem,13vw,11rem)] items-center justify-center rounded-full shadow-[0_12px_0_rgb(0_0_0/0.2)]"
        style={{ backgroundColor: accent }}
      >
        <Trophy className="lesson-bob size-[55%] text-[#1B1B3A]" strokeWidth={2.2} />
      </span>
      <h1 className="lesson-zoom-in font-heading text-[clamp(3rem,7vw,7rem)] font-bold leading-none drop-shadow-[0_4px_0_rgb(0_0_0/0.2)]">
        {title}
      </h1>
      {hasExercises && (
        <>
          <StarRow count={rating} className="text-[clamp(4rem,8vw,7rem)]" />
          <p className="font-heading text-[clamp(1.75rem,3vw,3rem)] font-bold tabular-nums">
            {totalStars} / {maxStars} yulduz
          </p>
          <div className="flex max-w-5xl flex-wrap justify-center gap-2">
            {outcomes.map((o, i) => (
              <span
                key={i}
                className={cn(
                  'live-rise flex items-center gap-2 rounded-2xl px-4 py-2 text-xl font-bold',
                  o?.stars ? 'bg-white/20' : 'bg-black/20 text-white/70'
                )}
                style={{ animationDelay: `${300 + i * 70}ms` }}
              >
                <span className="tabular-nums">{i + 1}</span>
                <StarRow count={o?.stars ?? 0} className="text-lg" />
              </span>
            ))}
          </div>
        </>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {hasExercises && (
          <button type="button" onClick={onRetry} className={boardButton('primary', 'min-h-20 px-10 text-2xl')}>
            <RotateCcw className="size-7" /> Qaytadan mashq
          </button>
        )}
        {onSlides && (
          <button type="button" onClick={onSlides} className={boardButton('secondary')}>
            <BookOpen className="size-6" /> Mavzuni takrorlash
          </button>
        )}
        <Link href={LIST_HREF} className={boardButton('secondary')}>
          <Flag className="size-6" /> Tugatish
        </Link>
      </div>
    </div>
  );
}

export default function BoardLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: lesson, isLoading, isError, error, refetch } = useBoardLesson(id);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#141B3D]">
        <Loader2 className="size-12 animate-spin text-white" />
      </div>
    );
  }

  if (isError || !lesson) {
    const status = error instanceof ApiError ? error.status : 0;
    return (
      <BoardLayout exitHref={LIST_HREF}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <h1 className="font-heading text-5xl font-bold">
            {status === 404 ? 'Dars topilmadi' : status === 403 ? "Ruxsat yo'q" : 'Darsni yuklab bo’lmadi'}
          </h1>
          {status !== 404 && status !== 403 && (
            <button type="button" onClick={() => refetch()} className={boardButton('primary')}>
              <RotateCcw className="size-6" /> Qayta urinish
            </button>
          )}
        </div>
      </BoardLayout>
    );
  }

  if (!lesson.slides.length && !lesson.exercises.length) {
    return (
      <BoardLayout exitHref={LIST_HREF}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <h1 className="font-heading text-5xl font-bold">Darsda hali slayd yoki mashq yo&apos;q</h1>
          <Link href={`/super-teacher/lessons/${lesson._id}/edit`} className={boardButton('primary')}>
            Tahrirlash
          </Link>
        </div>
      </BoardLayout>
    );
  }

  return <LessonPlayer key={lesson._id} lesson={lesson} />;
}
