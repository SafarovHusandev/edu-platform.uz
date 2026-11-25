'use client';

import { use, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import {
  TgAvatar,
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgSkeletonList,
  gradeLabel,
} from '@/components/tg/tg-ui';
import { attemptStudent } from '@/components/tg/tg-quiz-utils';
import { usePendingReviews, useQuizWithAnswers, useReviewOpenEnded } from '@/hooks/use-quizzes';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';
import type { Attempt, Question } from '@/types';

const QUEUE_LIMIT = 100;

// Tezkor ball tugmalari: maks. 10 gacha — har biri, kattaroqda — 0/25/50/75/100%
function quickScores(max: number) {
  if (max <= 10) return Array.from({ length: max + 1 }, (_, i) => i);
  return [...new Set([0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(max * k)))];
}

function quizOf(attempt: Attempt) {
  return typeof attempt.quiz === 'object'
    ? { _id: attempt.quiz._id, title: attempt.quiz.title }
    : { _id: attempt.quiz, title: 'Test' };
}

function GradingCard({
  attempt,
  position,
  total,
  onDone,
  onSkip,
}: {
  attempt: Attempt;
  position: number;
  total: number;
  onDone: () => void;
  onSkip: () => void;
}) {
  const quiz = quizOf(attempt);
  const { data: quizData, isLoading } = useQuizWithAnswers(quiz._id);
  const review = useReviewOpenEnded(quiz._id);
  const student = attemptStudent(attempt);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const allQuestions = quizData?.questions ?? [];
  const openQuestions: Question[] = allQuestions.filter((q) => q.type === 'open_ended');
  const openIds = new Set(openQuestions.map((q) => q._id));
  const autoPoints = attempt.answers
    .filter((a) => !openIds.has(a.question))
    .reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
  const autoTotal = (attempt.totalPoints ?? 0) - openQuestions.reduce((s, q) => s + q.points, 0);
  const allScored = openQuestions.every((q) => scores[q._id] !== undefined);
  const entered = openQuestions.reduce((s, q) => s + (scores[q._id] ?? 0), 0);

  function save() {
    review.mutate(
      {
        attemptId: attempt._id,
        reviewedAnswers: openQuestions.map((q) => {
          const points = Math.min(q.points, Math.max(0, scores[q._id] ?? 0));
          return {
            questionId: q._id,
            pointsEarned: points,
            isCorrect: points > 0 && points >= q.points / 2,
            feedback: feedback[q._id]?.trim() || undefined,
          };
        }),
      },
      {
        onSuccess: () => {
          haptic('success');
          onDone();
        },
        onError: () => haptic('error'),
      }
    );
  }

  return (
    <>
      <TgHeader
        title="Baholash"
        action={
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground tabular-nums">
            {position} / {total}
          </span>
        }
      />

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
        <TgAvatar name={student?.name} src={student?.avatar} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">
            {student?.name ?? "O'quvchi"}
            {gradeLabel(student?.grade) && ` · ${gradeLabel(student?.grade)}`}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {[
              quiz.title,
              attempt.attemptNumber ? `${attempt.attemptNumber}-urinish` : null,
              `avto ${autoPoints}/${Math.max(0, autoTotal)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-[11px] text-muted-foreground">Jami</span>
          <span className="font-heading text-sm font-bold tabular-nums">
            {autoPoints + entered}/{attempt.totalPoints ?? 0}
          </span>
        </span>
      </div>

      {isLoading ? (
        <TgSkeletonList count={2} height={180} />
      ) : openQuestions.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Bu testda ochiq savollar topilmadi.
        </p>
      ) : (
        openQuestions.map((question) => {
          const order = allQuestions.findIndex((q) => q._id === question._id) + 1;
          const given = attempt.answers.find((a) => a.question === question._id)?.givenAnswer;
          const selected = scores[question._id];
          return (
            <article
              key={question._id}
              className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5"
            >
              <div className="flex justify-between gap-2">
                <span className="min-w-0 font-bold wrap-break-word">
                  {order}. {question.text}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">maks. {question.points}</span>
              </div>
              <div className="rounded-xl bg-background px-3 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
                {typeof given === 'string' && given.trim() ? (
                  given
                ) : (
                  <span className="text-muted-foreground italic">Javob berilmagan</span>
                )}
              </div>
              {question.sampleAnswer && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold text-primary">
                    Namuna javobni ko&apos;rish
                  </summary>
                  <p className="mt-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-secondary-foreground">
                    {question.sampleAnswer}
                  </p>
                </details>
              )}
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ball">
                {quickScores(question.points).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected === value}
                    onClick={() => {
                      haptic('selection');
                      setScores((prev) => ({ ...prev, [question._id]: value }));
                    }}
                    className={cn(
                      'h-10 min-w-10 rounded-xl px-2 font-heading text-sm font-bold tabular-nums transition-colors',
                      selected === value
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-background'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <input
                aria-label="Izoh"
                placeholder="Izoh (ixtiyoriy)"
                value={feedback[question._id] ?? ''}
                onChange={(e) => setFeedback((prev) => ({ ...prev, [question._id]: e.target.value }))}
                className="h-11 rounded-xl border border-input bg-background px-3 text-[15px] outline-none focus:border-primary"
              />
            </article>
          );
        })
      )}

      <TgMainButton
        text={total > 1 ? 'Saqlash va keyingisi' : 'Saqlash'}
        onClick={save}
        loading={review.isPending}
        disabled={isLoading || openQuestions.length === 0 || !allScored}
        secondary={
          total > 1 ? (
            <button
              type="button"
              onClick={onSkip}
              className="h-12 rounded-[14px] border border-border bg-card px-4 text-[15px] font-semibold"
            >
              O&apos;tkazish
            </button>
          ) : undefined
        }
      />
    </>
  );
}

export default function TgGradingPage({
  searchParams,
}: {
  searchParams: Promise<{ quiz?: string; attempt?: string }>;
}) {
  const { quiz: quizFilter, attempt: initialAttempt } = use(searchParams);
  const pending = usePendingReviews({ quizId: quizFilter, page: 1, limit: QUEUE_LIMIT });
  const queue = pending.data?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(initialAttempt ?? null);

  const index = Math.max(0, queue.findIndex((a) => a._id === selectedId));
  const current = queue[index];

  function goNext() {
    const next = queue[index + 1] ?? queue[0];
    setSelectedId(next && next._id !== current?._id ? next._id : null);
    window.scrollTo({ top: 0 });
  }

  if (pending.isLoading) {
    return (
      <TgPage>
        <TgHeader title="Baholash" />
        <TgSkeletonList count={3} height={150} />
      </TgPage>
    );
  }

  if (pending.isError) {
    return (
      <TgPage>
        <TgHeader title="Baholash" />
        <TgError onRetry={() => pending.refetch()} />
      </TgPage>
    );
  }

  if (!current) {
    return (
      <TgPage>
        <TgHeader title="Baholash" />
        <TgEmpty
          icon={CheckCheck}
          title="Hammasi tekshirilgan"
          description="O'quvchilar ochiq savollarga javob berganda shu yerda paydo bo'ladi"
        />
      </TgPage>
    );
  }

  return (
    <TgPage>
      <GradingCard
        key={current._id}
        attempt={current}
        position={index + 1}
        total={pending.data?.total ?? queue.length}
        onDone={goNext}
        onSkip={goNext}
      />
    </TgPage>
  );
}
