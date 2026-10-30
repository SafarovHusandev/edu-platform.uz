'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { FilterPills } from '@/components/ui/filter-pills';
import { useMyAttemptsMany, useQuizzes, type MyAttemptsResult } from '@/hooks/use-quizzes';
import { useAuthStore } from '@/store/auth-store';
import { formatTashkentDateTime, formatTimeLeft } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Grade, Quiz, QuizMyAttempts, QuizTargetType } from '@/types';

type TypeFilter = 'all' | QuizTargetType;

const TYPE_LABELS: Record<QuizTargetType, string> = {
  course: 'Kurs',
  lesson: 'Dars',
  standalone: 'Mustaqil',
};

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Barchasi' },
  { value: 'course', label: 'Kurs' },
  { value: 'lesson', label: 'Dars' },
  { value: 'standalone', label: 'Mustaqil' },
];

interface QuizRowState {
  status: { label: string; tone: StatusPillTone };
  note: { text: string; className: string } | null;
  attemptsLabel: string;
  remainingLabel: string | null;
  action: { label: string; variant: 'default' | 'outline'; disabled?: boolean };
  timeLimit: number | null | undefined;
}

function myTargetGrade(quiz: Quiz, grade: Grade | undefined) {
  if (!grade?.number) return undefined;
  return quiz.targetGrades.find(
    (tg) => tg.number === grade.number && (!tg.letter || tg.letter === grade.letter)
  );
}

// Urinishlar xulosasi: GET /quizzes javobidagi myAttempts yoki (eski backend
// uchun zaxira) GET /quizzes/:id/my-attempts natijasidan
function attemptsSummary(
  quiz: Quiz,
  fallback: MyAttemptsResult | undefined
): QuizMyAttempts | undefined {
  if (quiz.myAttempts) return quiz.myAttempts;
  if (!fallback) return undefined;
  const scores = fallback.attempts
    .filter((a) => a.status === 'reviewed' && a.scorePercent != null)
    .map((a) => a.scorePercent!);
  return {
    attemptsUsed: fallback.attemptsUsed,
    attemptsRemaining: fallback.attemptsRemaining,
    maxAttempts: fallback.maxAttempts,
    bestScorePercent: scores.length > 0 ? Math.max(...scores) : null,
    hasInProgress: fallback.attempts.some((a) => a.status === 'in_progress'),
    lastStatus: null,
  };
}

// Test qatori uchun holat, izoh va tugma
function getRowState(
  quiz: Quiz,
  grade: Grade | undefined,
  attempts: QuizMyAttempts | undefined
): QuizRowState {
  const tg = myTargetGrade(quiz, grade);
  const from = tg?.availableFrom ?? quiz.availableFrom;
  const until = tg?.availableUntil ?? quiz.availableUntil;
  const now = Date.now();
  const max = attempts?.maxAttempts || tg?.effectiveMaxAttempts || quiz.maxAttempts;
  const remaining = attempts?.attemptsRemaining ?? max;
  const used = attempts?.attemptsUsed ?? 0;
  const inProgress = !!attempts?.hasInProgress;
  const best = attempts?.bestScorePercent ?? null;
  const timeLimit = tg?.effectiveTimeLimit ?? tg?.timeLimit ?? quiz.timeLimit;

  const base = {
    attemptsLabel: `${remaining}/${max}`,
    remainingLabel: remaining > 0 ? `${remaining}/${max} urinish qoldi` : null,
    timeLimit,
  };

  if (from && new Date(from).getTime() > now) {
    return {
      ...base,
      status: { label: 'Kutilmoqda', tone: 'warning' },
      note: {
        text: `Boshlanish: ${formatTashkentDateTime(from)} (Toshkent)`,
        className: 'text-gold-foreground',
      },
      action: { label: 'Boshlash', variant: 'default', disabled: true },
    };
  }

  const closed = !!until && new Date(until).getTime() < now;
  const deadlineNote = until && !closed ? formatTimeLeft(until) : null;
  const urgent = !!until && new Date(until).getTime() - now < 24 * 3_600_000;

  if (inProgress && !closed) {
    return {
      ...base,
      status: { label: 'Davom etmoqda', tone: 'primary' },
      note: deadlineNote
        ? { text: `Tugashiga ${deadlineNote}`, className: 'text-destructive' }
        : null,
      action: { label: 'Davom ettirish', variant: 'default' },
    };
  }

  if (used > 0 && (remaining === 0 || closed)) {
    return {
      ...base,
      status: { label: 'Tugagan', tone: 'success' },
      note: {
        text: `Urinishlar tugadi${best != null ? ` · ${best} ball` : ''}`,
        className: 'text-muted-foreground',
      },
      action: { label: 'Urinishlar', variant: 'outline' },
    };
  }

  if (closed) {
    return {
      ...base,
      status: { label: 'Yopilgan', tone: 'neutral' },
      note: { text: 'Test muddati tugagan', className: 'text-muted-foreground' },
      action: { label: "Ko'rish", variant: 'outline' },
    };
  }

  if (used > 0) {
    return {
      ...base,
      status: { label: 'Yechilgan', tone: 'success' },
      note:
        best != null
          ? { text: `Eng yaxshi: ${best} ball`, className: 'text-success' }
          : { text: 'Natija tekshirilmoqda', className: 'text-muted-foreground' },
      action: { label: 'Urinishlar', variant: 'outline' },
    };
  }

  return {
    ...base,
    status: { label: 'Urinilmagan', tone: 'neutral' },
    note: deadlineNote
      ? {
          text: urgent ? `Tugashiga ${deadlineNote}` : `${formatTashkentDateTime(until!)} gacha`,
          className: urgent ? 'text-destructive' : 'text-muted-foreground',
        }
      : null,
    action: { label: 'Boshlash', variant: 'default' },
  };
}

function QuizAction({ quiz, state }: { quiz: Quiz; state: QuizRowState }) {
  if (state.action.disabled) {
    return (
      <Button variant="secondary" disabled>
        {state.action.label}
      </Button>
    );
  }
  return (
    <Button variant={state.action.variant} render={<Link href={`/student/quizzes/${quiz._id}`} />}>
      {state.action.label}
    </Button>
  );
}

function questionsAndTime(quiz: Quiz, timeLimit: number | null | undefined) {
  const count = quiz.questionsCount ?? quiz.questions?.length;
  return [count != null ? `${count} savol` : null, timeLimit ? `${timeLimit} daq` : null]
    .filter(Boolean)
    .join(' · ');
}

export default function StudentQuizzesPage() {
  const { data, isLoading, isError, refetch } = useQuizzes({ page: 1, limit: 50 });
  const grade = useAuthStore((s) => s.user?.grade);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // GET /quizzes studentning sinfi bo'yicha filtrlamaydi — frontend o'zi
  // targetGrades ichidan mos kelmagan testlarni yashiradi.
  const myQuizzes = (data?.items ?? []).filter(
    (quiz) => !grade?.number || !!myTargetGrade(quiz, grade)
  );
  // Backend myAttempts qaytarmagan testlar uchungina alohida so'rov yuboriladi
  const missing = myQuizzes.filter((q) => !q.myAttempts);
  const fallbackQueries = useMyAttemptsMany(missing.map((q) => q._id));
  const fallbackById = new Map(missing.map((q, i) => [q._id, fallbackQueries[i]?.data]));
  const attemptsById = new Map(
    myQuizzes.map((q) => [q._id, attemptsSummary(q, fallbackById.get(q._id))])
  );
  const items = myQuizzes.filter((q) => typeFilter === 'all' || q.targetType === typeFilter);

  const gradeLabel = grade?.number ? `${grade.number}-"${grade.letter ?? ''}"` : null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Testlar"
        description={
          gradeLabel
            ? `Faqat ${gradeLabel} sinfiga mo'ljallangan testlar ko'rsatiladi`
            : "Bilimingizni sinab ko'ring"
        }
        actions={<FilterPills value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTERS} />}
      />

      {isLoading ? (
        <SkeletonList count={5} itemClassName="h-20 rounded-[18px]" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            myQuizzes.length === 0
              ? 'Hozircha testlar mavjud emas'
              : `${TYPE_LABELS[typeFilter as QuizTargetType]} testlari yo'q`
          }
        />
      ) : (
        <>
          {/* Desktop: jadval */}
          <div className="hidden overflow-hidden rounded-[20px] border border-border bg-card md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
                  <th className="px-5 py-3.5 font-semibold">Test</th>
                  <th className="px-3 py-3.5 font-semibold">Turi</th>
                  <th className="px-3 py-3.5 font-semibold">Savol · vaqt</th>
                  <th className="px-3 py-3.5 font-semibold">Urinish</th>
                  <th className="px-3 py-3.5 font-semibold">Holat</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((quiz) => {
                  const state = getRowState(quiz, grade, attemptsById.get(quiz._id));
                  const loaded = attemptsById.get(quiz._id) !== undefined;
                  return (
                    <tr key={quiz._id} className="border-t border-muted">
                      <td className="px-5 py-3.5">
                        <div className="font-bold wrap-break-word">{quiz.title}</div>
                        {state.note && (
                          <div
                            className={cn('mt-0.5 text-[13px] font-semibold', state.note.className)}
                          >
                            {state.note.text}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5">{TYPE_LABELS[quiz.targetType]}</td>
                      <td className="px-3 py-3.5 text-muted-foreground">
                        {questionsAndTime(quiz, state.timeLimit) || '—'}
                      </td>
                      <td className="px-3 py-3.5 tabular-nums">
                        {loaded ? state.attemptsLabel : '…'}
                      </td>
                      <td className="px-3 py-3.5">
                        {loaded ? (
                          <StatusPill tone={state.status.tone}>{state.status.label}</StatusPill>
                        ) : (
                          <span className="inline-block h-6 w-20 animate-pulse rounded-full bg-muted" />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <QuizAction quiz={quiz} state={state} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobil: kartochkalar */}
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((quiz) => {
              const state = getRowState(quiz, grade, attemptsById.get(quiz._id));
              const loaded = attemptsById.get(quiz._id) !== undefined;
              return (
                <div
                  key={quiz._id}
                  className="flex flex-col gap-2 rounded-[18px] border border-border bg-card px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-[15px] font-bold wrap-break-word">
                      {quiz.title}
                    </span>
                    {loaded && (
                      <StatusPill tone={state.status.tone}>{state.status.label}</StatusPill>
                    )}
                  </div>
                  <span className="text-[13px] text-muted-foreground">
                    {[TYPE_LABELS[quiz.targetType], questionsAndTime(quiz, state.timeLimit)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        'min-w-0 text-[13px] font-semibold',
                        state.note?.className ?? 'text-muted-foreground'
                      )}
                    >
                      {[state.remainingLabel, state.note?.text].filter(Boolean).join(' · ')}
                    </span>
                    <QuizAction quiz={quiz} state={state} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
