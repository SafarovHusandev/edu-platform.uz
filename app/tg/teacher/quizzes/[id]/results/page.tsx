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
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
  gradeLabel,
} from '@/components/tg/tg-ui';
import { attemptStatus, attemptStudent } from '@/components/tg/tg-quiz-utils';
import { useQuizResults, useQuizWithAnswers } from '@/hooks/use-quizzes';
import { formatDuration } from '@/lib/format';

export default function TgQuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const quiz = useQuizWithAnswers(id);
  const results = useQuizResults(id);
  const [filter, setFilter] = useState('all');

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

      <div className="grid grid-cols-4 gap-2">
        {[
          { value: attempts.length, label: 'urinish' },
          { value: avg ?? '—', label: "o'rtacha" },
          { value: pendingCount, label: 'tekshirish', warn: pendingCount > 0 },
          { value: expiredCount, label: 'vaqt tugagan' },
        ].map((item) => (
          <div
            key={item.label}
            className={
              item.warn
                ? 'rounded-2xl bg-gold-soft px-2 py-2.5 text-center'
                : 'rounded-2xl border border-border bg-card px-2 py-2.5 text-center'
            }
          >
            <div className="font-heading text-lg font-bold tabular-nums">
              {results.isLoading ? '·' : item.value}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      {attempts.length > 0 && (
        <TgChips
          value={filter}
          onChange={setFilter}
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
      ) : visible.length === 0 ? (
        <TgEmpty icon={Users} title="Hali urinishlar yo'q" description="O'quvchilar testni yechganda shu yerda ko'rinadi" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {visible.map((attempt) => {
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
                  <span className="block truncate font-semibold">{student?.name ?? "O'quvchi"}</span>
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
                <span className="font-heading text-base font-bold tabular-nums">
                  {score}
                  {pending && '*'}
                </span>
                <TgPill tone={status.tone} className="min-w-[74px] justify-center">
                  {status.label}
                </TgPill>
              </>
            );
            const className =
              'flex items-center gap-3 border-t border-border px-3.5 py-3 first:border-t-0';
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
