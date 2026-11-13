'use client';

import { use, useMemo } from 'react';
import { BadgeCheck, Flame, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { OptionShape, optionStyle } from '@/components/live-quiz/option-styles';
import { useLiveSessionResult } from '@/hooks/use-live-quizzes';
import { ApiError } from '@/lib/api-client';
import { formatDateTime, formatDuration, formatNumber } from '@/lib/format';
import { plainQuestionText } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { LiveSessionQuestion } from '@/types/live-quiz';

interface QuestionStats {
  index: number;
  question: LiveSessionQuestion;
  distribution: number[];
  answered: number;
  correct: number;
  percent: number;
}

function questionStats(question: LiveSessionQuestion, index: number): QuestionStats {
  const distribution = question.options.map((_, i) => question.distribution?.[i] ?? 0);
  const answered = question.answered ?? distribution.reduce((a, b) => a + b, 0);
  const correct = question.correctCount ?? distribution[question.correctIndex] ?? 0;
  return {
    index,
    question,
    distribution,
    answered,
    correct,
    percent: answered > 0 ? Math.round((correct / answered) * 100) : 0,
  };
}

function percentTone(percent: number) {
  if (percent >= 70) return 'text-success';
  if (percent >= 40) return 'text-gold-foreground';
  return 'text-destructive';
}

function QuestionDistribution({ stats }: { stats: QuestionStats }) {
  const max = Math.max(1, ...stats.distribution);
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-heading text-sm font-bold text-primary">
          {stats.index + 1}
        </span>
        <QuestionMarkdown text={stats.question.text} variant="card" className="min-w-0 flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        {stats.question.options.map((option, i) => {
          const style = optionStyle(i);
          const correct = i === stats.question.correctIndex;
          const count = stats.distribution[i];
          return (
            <div key={i} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg text-white',
                  style.bg
                )}
              >
                <OptionShape index={i} className="size-4" title={`${style.name} ${style.symbol}`} />
              </span>
              <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-lg bg-muted">
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-lg', correct ? 'bg-success/80' : 'bg-input')}
                  style={{ width: `${(count / max) * 100}%` }}
                />
                <span className="relative flex h-full items-center gap-1.5 px-3 text-sm font-medium">
                  <span className="truncate">{option}</span>
                  {correct && <BadgeCheck className="size-4 shrink-0 text-success" />}
                </span>
              </div>
              <span className="w-8 text-right font-semibold tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Javob berdi: <strong className="text-foreground">{stats.answered}</strong>, to&apos;g&apos;ri:{' '}
        <strong className={percentTone(stats.percent)}>
          {stats.correct} ({stats.percent}%)
        </strong>
      </p>
    </div>
  );
}

export default function LiveSessionResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { data: session, isLoading, isError, error, refetch } = useLiveSessionResult(sessionId);

  const stats = useMemo(
    () => (session?.questions ?? []).map((q, i) => questionStats(q, i)),
    [session?.questions]
  );
  const hardest = useMemo(
    () =>
      stats
        .filter((s) => s.answered > 0)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 3),
    [stats]
  );
  const players = useMemo(
    () =>
      [...(session?.players ?? [])]
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || b.score - a.score)
        .map((p, i) => ({ ...p, rank: p.rank ?? i + 1 })),
    [session?.players]
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="h-80 rounded-[20px]" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <ErrorState
        className="mx-auto w-full max-w-5xl"
        title={error instanceof ApiError && error.status === 403 ? "Ruxsat yo'q" : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const totalQuestions = session.questions.length;
  const duration =
    session.endedAt &&
    formatDuration(
      Math.max(
        0,
        Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
      )
    );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title={session.quizTitle}
        description={`${formatDateTime(session.startedAt)}${duration ? ` · ${duration}` : ''} · ${players.length} ishtirokchi`}
        breadcrumbs={[
          { label: 'Super-ustoz', href: '/super-teacher' },
          { label: 'Jonli viktorina', href: '/super-teacher/live-quiz' },
          ...(session.quizId
            ? [{ label: 'Natijalar', href: `/super-teacher/live-quiz/${session.quizId}/results` }]
            : []),
          { label: "O'yin natijasi" },
        ]}
        className="mb-0"
      />

      {hardest.length > 0 && (
        <section className="flex flex-col gap-3 rounded-[20px] border border-destructive/25 bg-destructive-soft/50 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Flame className="size-5 text-destructive" /> Eng qiyin savollar
          </h2>
          <p className="-mt-1 text-sm text-muted-foreground">
            To&apos;g&apos;ri javob foizi eng past — bu mavzularni qayta tushuntirish foydali
          </p>
          <ol className="grid gap-2.5 md:grid-cols-3">
            {hardest.map((s) => (
              <li key={s.index} className="flex flex-col gap-1 rounded-2xl bg-card p-3.5">
                <span className="text-xs font-semibold text-muted-foreground">{s.index + 1}-savol</span>
                <span className="line-clamp-2 font-medium">{plainQuestionText(s.question.text, 120)}</span>
                <span className={cn('font-heading text-2xl font-bold', percentTone(s.percent))}>
                  {s.percent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.correct} / {s.answered} to&apos;g&apos;ri
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Reyting</h2>
        <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 pl-5">O&apos;rin</TableHead>
                <TableHead>Ism</TableHead>
                <TableHead className="text-right">Ball</TableHead>
                <TableHead className="pr-5 text-right">To&apos;g&apos;ri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 size-5" /> Ishtirokchilar yo&apos;q
                  </TableCell>
                </TableRow>
              ) : (
                players.map((p, i) => (
                  <TableRow key={`${p.name}-${i}`}>
                    <TableCell className="pl-5 font-heading font-bold tabular-nums">
                      {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : p.rank}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 font-medium">
                        {p.name}
                        {p.user && (
                          <span title="Platformadagi o'quvchi" aria-label="Platformadagi o'quvchi">
                            <BadgeCheck className="size-4 text-primary" />
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatNumber(p.score)}
                    </TableCell>
                    <TableCell className="pr-5 text-right tabular-nums text-muted-foreground">
                      {p.correctCount ?? 0}/{totalQuestions}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Savollar bo&apos;yicha</h2>
        {stats.map((s) => (
          <QuestionDistribution key={s.index} stats={s} />
        ))}
      </section>
    </div>
  );
}
