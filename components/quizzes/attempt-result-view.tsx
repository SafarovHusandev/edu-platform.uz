'use client';

import Link from 'next/link';
import { Check, Hourglass, TimerOff, X } from 'lucide-react';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import { calculateQuizDiamonds } from '@/lib/gamification';
import { formatDateTime, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Attempt, EvaluatedAnswer, Question, Quiz } from '@/types';

// Test natijasi (edu-platform-dizayn: SdQuizResult). Test topshirilgandan keyin
// ham, "Urinishlarim" sahifasida ham shu ko'rinish ishlatiladi.

function ScoreRing({ percent, tone }: { percent: number; tone: 'success' | 'danger' | 'muted' }) {
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <svg viewBox="0 0 170 170" className="size-full -rotate-90" aria-hidden="true">
      <circle cx="85" cy="85" r={radius} fill="none" strokeWidth="14" className="stroke-muted" />
      <circle
        cx="85"
        cy="85"
        r={radius}
        fill="none"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn(
          'transition-[stroke-dashoffset] duration-700',
          tone === 'success'
            ? 'stroke-success'
            : tone === 'danger'
              ? 'stroke-destructive'
              : 'stroke-muted-foreground/40'
        )}
      />
    </svg>
  );
}

function givenAnswerLabel(question: Question, answer: EvaluatedAnswer | undefined) {
  const value = answer?.givenAnswer;
  if (value === undefined || value === null || value === '' || value === -1) return null;
  if (question.type === 'true_false') return value === true ? "To'g'ri" : "Noto'g'ri";
  if (question.type === 'multiple_choice' && typeof value === 'number') {
    const option = question.options?.[value];
    return option ? `${option.label}. ${option.text}` : null;
  }
  return String(value);
}

interface AttemptResultViewProps {
  quiz: Quiz;
  attempt: Attempt;
  isPremium: boolean;
  actions?: React.ReactNode;
}

export function AttemptResultView({ quiz, attempt, isPremium, actions }: AttemptResultViewProps) {
  const questions = quiz.questions ?? [];
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.question, a]));
  const isPending = attempt.status === 'submitted';
  const isExpired = attempt.status === 'expired';
  const percent = Math.round(attempt.scorePercent ?? 0);
  const diamonds = calculateQuizDiamonds(attempt, isPremium);

  const pendingCount = isPending ? questions.filter((q) => q.type === 'open_ended').length : 0;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const incorrectCount = isExpired ? 0 : questions.length - correctCount - pendingCount;

  const title = isExpired
    ? 'Vaqtingiz tugadi'
    : isPending
      ? 'Javoblaringiz qabul qilindi'
      : attempt.passed
        ? "Tabriklaymiz, o'tdingiz!"
        : "Afsuski, o'ta olmadingiz";
  const ringTone = isExpired || isPending ? 'muted' : attempt.passed ? 'success' : 'danger';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
        <Link href="/student/quizzes" className="hover:text-foreground">
          Testlar
        </Link>{' '}
        /{' '}
        <Link href={`/student/quizzes/${quiz._id}`} className="hover:text-foreground">
          {quiz.title}
        </Link>
        {attempt.attemptNumber != null && <> / {attempt.attemptNumber}-urinish</>}
      </nav>

      <section className="flex flex-wrap items-center gap-6 rounded-[22px] border border-border bg-card p-5 sm:gap-8 sm:p-7">
        <div className="relative mx-auto size-[150px] shrink-0 sm:mx-0 sm:size-[170px]">
          <ScoreRing percent={isExpired ? 0 : percent} tone={ringTone} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isExpired ? (
              <TimerOff className="size-10 text-destructive" />
            ) : isPending ? (
              <Hourglass className="size-10 text-muted-foreground" />
            ) : (
              <>
                <span className="font-heading text-4xl font-bold tabular-nums">{percent}</span>
                <span className="text-[13px] text-muted-foreground">/ 100 ball</span>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <h1 className="font-heading text-2xl font-semibold sm:text-[26px]">{title}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={isExpired ? 'danger' : 'success'} className="px-3 py-1.5 text-sm">
              O&apos;tish balli {quiz.passingScore}
            </StatusPill>
            {!isPending && !isExpired && attempt.totalPoints != null && (
              <StatusPill tone="neutral" className="px-3 py-1.5 text-sm">
                {attempt.earnedPoints ?? 0} / {attempt.totalPoints} ball
              </StatusPill>
            )}
            {diamonds > 0 && (
              <StatusPill tone="warning" className="px-3 py-1.5 text-sm">
                <DiamondIcon className="size-4" /> +{diamonds} olmos
              </StatusPill>
            )}
          </div>
          {isExpired ? (
            <p className="text-muted-foreground">
              Ajratilgan vaqt ichida yakunlanmagani sababli bu urinish bekor qilindi va urinishlar
              soniga qo&apos;shildi.
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
              <span>
                <strong className="text-success">{correctCount}</strong> to&apos;g&apos;ri
              </span>
              <span>
                <strong className="text-destructive">{Math.max(0, incorrectCount)}</strong>{' '}
                noto&apos;g&apos;ri
              </span>
              {pendingCount > 0 && (
                <span>
                  <strong className="text-gold-foreground">{pendingCount}</strong> tekshiruvda
                </span>
              )}
              {attempt.durationSeconds != null && (
                <span>{formatDuration(attempt.durationSeconds)} sarflandi</span>
              )}
            </div>
          )}
          {attempt.submittedAt && (
            <p className="text-[13px] text-muted-foreground">
              Topshirilgan: {formatDateTime(attempt.submittedAt)}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex w-full flex-col gap-2.5 sm:w-auto [&>*]:w-full">{actions}</div>
        )}
      </section>

      {isPending && (
        <div
          role="status"
          className="rounded-2xl bg-gold-soft px-[18px] py-3.5 text-gold-foreground"
        >
          <strong>
            {pendingCount > 0 ? `${pendingCount} ta ochiq savol` : 'Ochiq savollar'} o&apos;qituvchi
            tekshiruvida.
          </strong>{' '}
          Yakuniy ball baholangach yangilanadi va bildirishnoma keladi.
        </div>
      )}

      {!isExpired && questions.length > 0 && (
        <section className="overflow-hidden rounded-[20px] border border-border bg-card">
          <h2 className="border-b border-border px-5 py-4 font-bold">Javoblar tahlili</h2>
          <ol>
            {questions.map((question, index) => {
              const answer = answerByQuestion.get(question._id);
              const reviewPending = isPending && question.type === 'open_ended';
              const correct = !reviewPending && !!answer?.isCorrect;
              const given = givenAnswerLabel(question, answer);
              return (
                <li
                  key={question._id}
                  className="flex items-start gap-3.5 border-b border-muted px-5 py-3.5 last:border-0"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-[30px] shrink-0 items-center justify-center rounded-lg font-bold',
                      reviewPending
                        ? 'bg-gold-soft text-gold-foreground'
                        : correct
                          ? 'bg-success-soft text-success'
                          : 'bg-destructive-soft text-destructive'
                    )}
                    aria-label={reviewPending ? 'Tekshiruvda' : correct ? "To'g'ri" : "Noto'g'ri"}
                  >
                    {reviewPending ? (
                      '…'
                    ) : correct ? (
                      <Check className="size-4" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 wrap-break-word">
                    {index + 1}. {question.text}
                    {given && (
                      <>
                        {' '}
                        — javobingiz <strong>{given}</strong>
                      </>
                    )}
                    {!given && <span className="text-muted-foreground"> — javob berilmagan</span>}
                    {answer?.feedback && (
                      <span className="mt-1.5 block rounded-lg bg-primary-soft px-3 py-2 text-sm">
                        <strong>Ustoz izohi:</strong> {answer.feedback}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 tabular-nums',
                      reviewPending ? 'font-semibold text-gold-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {reviewPending ? '?' : (answer?.pointsEarned ?? 0)}/{question.points}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
