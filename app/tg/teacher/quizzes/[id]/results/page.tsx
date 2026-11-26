'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import {
  TgChips,
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
  gradeLabel,
} from '@/components/tg/tg-ui';
import { attemptStatus, attemptStudent } from '@/components/tg/tg-quiz-utils';
import { useQuizResults, useQuizWithAnswers } from '@/hooks/use-quizzes';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;

export default function TgQuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const quiz = useQuizWithAnswers(id);
  const results = useQuizResults(id);
  const [filter, setFilter] = useState('all');
  // Backend barcha urinishlarni bitta javobda beradi — ekranga bo'lib chiqaramiz
  const [shown, setShown] = useState(PAGE_SIZE);

  const attempts = useMemo(() => results.data ?? [], [results.data]);
  const finished = attempts.filter((a) => a.status !== 'in_progress');
  const scored = finished.filter((a) => a.status === 'reviewed' && a.scorePercent != null);
  const avg = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + (a.scorePercent ?? 0), 0) / scored.length)
    : null;
  const pendingCount = attempts.filter((a) => a.status === 'submitted').length;
  const expiredCount = attempts.filter((a) => a.status === 'expired').length;

  const grades = useMemo(() => {
    const set = new Set<string>();
    for (const a of attempts) {
      const label = gradeLabel(attemptStudent(a)?.grade);
      if (label) set.add(label);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'uz', { numeric: true }));
  }, [attempts]);

  const visible = attempts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'review') return a.status === 'submitted';
    return gradeLabel(attemptStudent(a)?.grade) === filter;
  });

  return (
    <TgPage>
      <TgHeader eyebrow="Natijalar" title={quiz.data?.title ?? (quiz.isLoading ? '…' : 'Test')} />

      <div className="grid grid-cols-4 gap-1.5">
        {[
          { value: attempts.length, label: 'urinish', tone: 'plain' },
          { value: avg ?? '—', label: "o'rtacha", tone: 'plain' },
          { value: pendingCount, label: 'tekshirish', tone: pendingCount > 0 ? 'warn' : 'plain' },
          { value: expiredCount, label: 'vaqt tugagan', tone: expiredCount > 0 ? 'danger' : 'plain' },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              'min-w-0 rounded-xl px-1.5 py-2.5 text-center',
              item.tone === 'warn' && 'bg-gold-soft text-gold-foreground',
              item.tone === 'danger' && 'bg-destructive-soft text-destructive',
              item.tone === 'plain' && 'border border-border bg-card'
            )}
          >
            {results.isLoading ? (
              <div className="mx-auto my-0.5 h-5 w-7 animate-pulse rounded bg-muted" />
            ) : (
              <div className="font-heading font-bold tabular-nums">{item.value}</div>
            )}
            <div
              className={cn(
                'truncate text-[11px]',
                item.tone === 'plain' ? 'text-muted-foreground' : 'opacity-85'
              )}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {attempts.length > 0 && (
        <TgChips
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setShown(PAGE_SIZE);
          }}
          options={[
            { value: 'all', label: 'Barchasi' },
            ...grades.map((g) => ({ value: g, label: g })),
            ...(pendingCount > 0 ? [{ value: 'review', label: 'Tekshirish kerak' }] : []),
          ]}
        />
      )}

      {results.isLoading ? (
        <TgSkeletonList count={6} height={60} />
      ) : results.isError ? (
        <TgError onRetry={() => results.refetch()} />
      ) : attempts.length === 0 ? (
        <TgEmpty
          icon={Users}
          title="Hali urinishlar yo'q"
          description="O'quvchilar testni yechganda shu yerda ko'rinadi"
        />
      ) : visible.length === 0 ? (
        <TgEmpty icon={Users} title="Bu filtr bo'yicha urinish yo'q" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {visible.slice(0, shown).map((attempt) => {
            const student = attemptStudent(attempt);
            const status = attemptStatus(attempt);
            const pending = attempt.status === 'submitted';
            const score =
              attempt.status === 'expired'
                ? 0
                : attempt.scorePercent != null
                  ? Math.round(attempt.scorePercent)
                  : '—';
            const row = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {student?.name ?? "O'quvchi"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[
                      gradeLabel(student?.grade),
                      attempt.attemptNumber ? `${attempt.attemptNumber}-urinish` : null,
                      attempt.durationSeconds ? formatDuration(attempt.durationSeconds) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="w-9 shrink-0 text-right font-heading text-sm font-semibold tabular-nums">
                  {score}
                  {pending && '*'}
                </span>
                <TgPill tone={status.tone} className="min-w-18 justify-center px-2">
                  {status.label}
                </TgPill>
              </>
            );
            const className =
              'flex items-center gap-2.5 border-t border-border px-3.5 py-2.75 first:border-t-0';
            return pending ? (
              <Link
                key={attempt._id}
                href={`/tg/teacher/grading?quiz=${id}&attempt=${attempt._id}`}
                className={`${className} active:bg-muted`}
              >
                {row}
              </Link>
            ) : (
              <div key={attempt._id} className={className}>
                {row}
              </div>
            );
          })}
        </div>
      )}

      {visible.length > shown && (
        <TgLoadMore
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          shown={shown}
          total={visible.length}
        />
      )}

      {pendingCount > 0 && (
        <p className="text-xs text-muted-foreground">* — ochiq savollar hali baholanmagan</p>
      )}

      <TgWebHint href={`/teacher/quizzes/${id}/results`}>
        Excel/PDF eksport va batafsil jadval —
      </TgWebHint>

      <TgMainButton
        hidden={pendingCount === 0}
        text={`${pendingCount} ta urinishni baholash`}
        onClick={() => router.push(`/tg/teacher/grading?quiz=${id}`)}
      />
    </TgPage>
  );
}
