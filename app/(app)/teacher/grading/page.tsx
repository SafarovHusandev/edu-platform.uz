'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useQuizWithAnswers, usePendingReviews, useReviewOpenEnded } from '@/hooks/use-quizzes';
import { formatTashkentDateTime, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Attempt, Question, Quiz, User } from '@/types';

// Navbatda bir vaqtda ko'rsatiladigan urinishlar soni
const QUEUE_LIMIT = 100;

interface QueueEntry {
  attempt: Attempt;
  quiz: Pick<Quiz, '_id' | 'title'>;
}

interface PageProps {
  searchParams: Promise<{ quiz?: string; attempt?: string }>;
}

function studentOf(attempt: Attempt) {
  return typeof attempt.student === 'object' ? (attempt.student as User) : null;
}

function GradingForm({
  entry,
  onDone,
  onSkip,
  hasNext,
}: {
  entry: QueueEntry;
  onDone: () => void;
  onSkip: () => void;
  hasNext: boolean;
}) {
  const { data: quizWithAnswers, isLoading } = useQuizWithAnswers(entry.quiz._id);
  const review = useReviewOpenEnded(entry.quiz._id);
  const { attempt } = entry;
  const student = studentOf(attempt);
  const openQuestions: Question[] = (quizWithAnswers?.questions ?? []).filter(
    (q) => q.type === 'open_ended'
  );
  const answerOf = (questionId: string) => attempt.answers.find((a) => a.question === questionId);

  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const openIds = new Set(openQuestions.map((q) => q._id));
  const autoPoints = attempt.answers
    .filter((a) => !openIds.has(a.question))
    .reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
  const enteredPoints = openQuestions.reduce((sum, q) => sum + (Number(scores[q._id]) || 0), 0);
  const total = attempt.totalPoints ?? 0;
  const autoTotal = total - openQuestions.reduce((sum, q) => sum + q.points, 0);
  const allScored = openQuestions.every((q) => scores[q._id] !== undefined && scores[q._id] !== '');

  function handleSave() {
    review.mutate(
      {
        attemptId: attempt._id,
        reviewedAnswers: openQuestions.map((q) => {
          const points = Math.min(q.points, Math.max(0, Number(scores[q._id]) || 0));
          return {
            questionId: q._id,
            pointsEarned: points,
            // Dizaynda alohida belgi yo'q — yarim balldan yuqorisi to'g'ri hisoblanadi
            isCorrect: points >= q.points / 2 && points > 0,
            feedback: feedback[q._id]?.trim() || undefined,
          };
        }),
      },
      { onSuccess: onDone }
    );
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-[20px] border border-border bg-card px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold">
            {student?.name ?? "O'quvchi"}
            {attempt.attemptNumber != null && ` · ${attempt.attemptNumber}-urinish`}
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.quiz.title} · Avtomatik qism: {autoPoints} / {Math.max(0, autoTotal)} ball
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] text-muted-foreground">Joriy natija</div>
          <div className="font-heading text-2xl font-bold tabular-nums">
            {autoPoints + enteredPoints} / {total}
          </div>
        </div>
      </div>

      {openQuestions.length === 0 ? (
        <p className="rounded-[20px] border border-border bg-card p-5 text-muted-foreground">
          Bu testda ochiq savollar topilmadi.
        </p>
      ) : (
        openQuestions.map((question) => {
          const order =
            (quizWithAnswers?.questions ?? []).findIndex((q) => q._id === question._id) + 1;
          const given = answerOf(question._id)?.givenAnswer;
          return (
            <article
              key={question._id}
              className="flex flex-col gap-3.5 rounded-[20px] border border-border bg-card p-5"
            >
              <div className="flex justify-between gap-3">
                <h2 className="font-bold wrap-break-word">
                  {order}. {question.text}
                </h2>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  maks. {question.points} ball
                </span>
              </div>
              <div className="rounded-[14px] bg-background px-4 py-3.5 leading-relaxed">
                <div className="mb-1 text-xs font-bold text-muted-foreground">
                  O&apos;QUVCHI JAVOBI
                </div>
                <span className="whitespace-pre-wrap">
                  {typeof given === 'string' && given.trim() ? given : 'Javob berilmagan'}
                </span>
              </div>
              {question.sampleAnswer && (
                <div className="rounded-[14px] border border-dashed border-muted-foreground/50 px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
                  <strong>Namuna javob:</strong> {question.sampleAnswer}
                </div>
              )}
              <div className="flex flex-wrap items-end gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`p-${question._id}`} className="text-sm font-semibold">
                    Ball
                  </label>
                  <Input
                    id={`p-${question._id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={question.points}
                    placeholder={`0–${question.points}`}
                    value={scores[question._id] ?? ''}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [question._id]: e.target.value }))
                    }
                    className="h-12 w-24 font-heading text-base"
                  />
                </div>
                <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                  <label htmlFor={`f-${question._id}`} className="text-sm font-semibold">
                    Izoh (ixtiyoriy)
                  </label>
                  <Input
                    id={`f-${question._id}`}
                    placeholder="O'quvchiga fikr-mulohaza"
                    value={feedback[question._id] ?? ''}
                    onChange={(e) =>
                      setFeedback((prev) => ({ ...prev, [question._id]: e.target.value }))
                    }
                    className="h-12"
                  />
                </div>
              </div>
            </article>
          );
        })
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        {hasNext && (
          <Button size="lg" variant="outline" onClick={onSkip}>
            O&apos;tkazib yuborish
          </Button>
        )}
        <Button
          size="lg"
          onClick={handleSave}
          disabled={review.isPending || openQuestions.length === 0 || !allScored}
          title={!allScored ? "Barcha savollarga ball qo'ying" : undefined}
        >
          {review.isPending && <Loader2 className="size-4 animate-spin" />}
          {hasNext ? 'Saqlash va keyingisi' : 'Saqlash'}
        </Button>
      </div>
    </section>
  );
}

export default function GradingPage({ searchParams }: PageProps) {
  const { quiz: quizFilter, attempt: initialAttempt } = use(searchParams);
  // Backend eng eski topshirilganni birinchi qaytaradi; quiz {_id, title} populatsiya qilingan
  const pending = usePendingReviews({ quizId: quizFilter, page: 1, limit: QUEUE_LIMIT });
  const loading = pending.isLoading;
  const queue: QueueEntry[] = (pending.data?.items ?? []).map((attempt) => ({
    attempt,
    quiz:
      typeof attempt.quiz === 'object'
        ? { _id: attempt.quiz._id, title: attempt.quiz.title }
        : { _id: attempt.quiz, title: 'Test' },
  }));
  const total = pending.data?.total ?? 0;

  const [selectedId, setSelectedId] = useState<string | null>(initialAttempt ?? null);
  const selectedIndex = Math.max(
    0,
    queue.findIndex((e) => e.attempt._id === selectedId)
  );
  const selected = queue[selectedIndex];

  function goNext() {
    const next = queue[selectedIndex + 1] ?? queue[0];
    setSelectedId(next && next.attempt._id !== selected?.attempt._id ? next.attempt._id : null);
  }

  const singleQuiz = quizFilter ? queue[0]?.quiz : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Baholash"
        description={
          loading
            ? 'Yuklanmoqda...'
            : `${singleQuiz ? `${singleQuiz.title} · ` : ''}${total} ta urinish kutmoqda`
        }
        actions={
          singleQuiz && (
            <Button
              variant="outline"
              render={<Link href={`/teacher/quizzes/${singleQuiz._id}/results`} />}
            >
              Natijalarga qaytish
            </Button>
          )
        }
      />

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
          <div className="h-96 animate-pulse rounded-[20px] bg-muted" />
        </div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={CheckCheck}
          title="Baholash kutayotgan javoblar yo'q"
          description="O'quvchilar ochiq savollarga javob berganda shu yerda paydo bo'ladi"
        />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section
            aria-label="Navbat"
            className="overflow-hidden rounded-[20px] border border-border bg-card lg:sticky lg:top-0"
          >
            <div className="border-b border-border px-4 py-3.5 font-bold">Navbat</div>
            <div className="max-h-[60vh] overflow-y-auto">
              {queue.map((entry) => {
                const student = studentOf(entry.attempt);
                const active = entry.attempt._id === selected?.attempt._id;
                return (
                  <button
                    key={entry.attempt._id}
                    type="button"
                    onClick={() => setSelectedId(entry.attempt._id)}
                    aria-current={active}
                    className={cn(
                      'flex w-full items-center gap-3 border-t border-muted px-4 py-3.5 text-left first:border-t-0',
                      active ? 'bg-primary-soft' : 'hover:bg-muted/60'
                    )}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary-soft text-[13px] font-bold text-primary">
                        {initials(student?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn('block truncate', active ? 'font-bold' : 'font-semibold')}
                      >
                        {student?.name ?? "O'quvchi"}
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {[
                          student?.grade?.number
                            ? `${student.grade.number}-${student.grade.letter ?? ''}`
                            : null,
                          singleQuiz ? null : entry.quiz.title,
                          entry.attempt.submittedAt
                            ? formatTashkentDateTime(entry.attempt.submittedAt)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {selected && (
            <GradingForm
              key={selected.attempt._id}
              entry={selected}
              hasNext={queue.length > 1}
              onSkip={goNext}
              onDone={goNext}
            />
          )}
        </div>
      )}
    </div>
  );
}
