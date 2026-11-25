'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { ShareQuizDialog } from '@/components/quizzes/quiz-share-dialogs';
import {
  TgChips,
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSkeletonList,
} from '@/components/tg/tg-ui';
import { quizGradesLabel, quizStatus, TARGET_TYPE_LABELS } from '@/components/tg/tg-quiz-utils';
import { useQuizShares, useQuizzesMy } from '@/hooks/use-quizzes';
import type { Quiz } from '@/types';

type Filter = 'all' | 'active' | 'draft' | 'review';

const actionClass =
  'flex-1 rounded-xl border border-border bg-background py-2 text-center text-[13px] font-semibold active:bg-muted';

export default function TgTeacherQuizzesPage() {
  const quizzes = useQuizzesMy({ page: 1, limit: 100 });
  const incoming = useQuizShares('incoming', 'pending');
  const [filter, setFilter] = useState<Filter>('all');
  const [shareTarget, setShareTarget] = useState<Pick<Quiz, '_id' | 'title'> | null>(null);

  const items = quizzes.data?.items ?? [];
  const reviewCount = items.filter((q) => (q.stats?.pendingReviews ?? 0) > 0).length;
  const visible = items.filter((quiz) => {
    if (filter === 'active') return quiz.isActive;
    if (filter === 'draft') return !quiz.isActive;
    if (filter === 'review') return (quiz.stats?.pendingReviews ?? 0) > 0;
    return true;
  });
  const newShares = incoming.data?.length ?? 0;

  return (
    <TgPage>
      <TgHeader
        title="Testlarim"
        action={
          <Link
            href="/tg/teacher/quizzes/new"
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> Test
          </Link>
        }
      />

      <Link
        href="/tg/teacher/shares"
        className="flex items-center justify-between rounded-2xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary"
      >
        <span>
          Ulashilgan testlar
          {newShares > 0 && ` · ${newShares} yangi`}
        </span>
        <ChevronRight className="size-4" />
      </Link>

      {items.length > 0 && (
        <TgChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Barchasi · ${items.length}` },
            { value: 'active', label: 'Faol' },
            { value: 'draft', label: 'Qoralama' },
            ...(reviewCount > 0
              ? [{ value: 'review' as const, label: `Tekshirish kerak · ${reviewCount}` }]
              : []),
          ]}
        />
      )}

      {quizzes.isLoading ? (
        <TgSkeletonList count={4} height={110} />
      ) : quizzes.isError ? (
        <TgError onRetry={() => quizzes.refetch()} />
      ) : visible.length === 0 ? (
        <TgEmpty
          icon={ClipboardList}
          title={items.length === 0 ? 'Hali test yaratmagansiz' : 'Bu bo\'limda test yo\'q'}
          description={
            items.length === 0 ? "«+ Test» tugmasi orqali birinchi testni yarating" : undefined
          }
        />
      ) : (
        visible.map((quiz) => {
          const status = quizStatus(quiz);
          const pendingReviews = quiz.stats?.pendingReviews ?? 0;
          return (
            <article
              key={quiz._id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/tg/teacher/quizzes/${quiz._id}/results`}
                  className="min-w-0 font-bold wrap-break-word"
                >
                  {quiz.title}
                </Link>
                <TgPill tone={status.tone}>{status.label}</TgPill>
              </div>
              <span className="text-[13px] text-muted-foreground">
                {[
                  TARGET_TYPE_LABELS[quiz.targetType],
                  quizGradesLabel(quiz),
                  `${quiz.questionsCount ?? 0} savol`,
                  quiz.stats?.attemptsCount ? `${quiz.stats.attemptsCount} urinish` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {pendingReviews > 0 && (
                <Link
                  href={`/tg/teacher/grading?quiz=${quiz._id}`}
                  className="self-start rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold-foreground"
                >
                  {pendingReviews} ta javob tekshirishni kutmoqda →
                </Link>
              )}
              <div className="mt-1 flex gap-2">
                <Link href={`/tg/teacher/quizzes/${quiz._id}/results`} className={actionClass}>
                  Natijalar
                </Link>
                <Link href={`/tg/teacher/quizzes/${quiz._id}`} className={actionClass}>
                  Tahrir
                </Link>
                {quiz.targetType === 'standalone' && (
                  <button
                    type="button"
                    className={actionClass}
                    onClick={() => setShareTarget({ _id: quiz._id, title: quiz.title })}
                  >
                    Ulashish
                  </button>
                )}
              </div>
            </article>
          );
        })
      )}

      <ShareQuizDialog quiz={shareTarget} onOpenChange={(open) => !open && setShareTarget(null)} />
    </TgPage>
  );
}
