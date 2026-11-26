'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { ShareQuizDialog } from '@/components/quizzes/quiz-share-dialogs';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgPill,
  TgSkeletonList,
  tgHeaderActionClass,
} from '@/components/tg/tg-ui';
import { quizGradesLabel, quizStatus, TARGET_TYPE_LABELS } from '@/components/tg/tg-quiz-utils';
import { useQuizShares, useQuizzesMy } from '@/hooks/use-quizzes';
import type { Quiz } from '@/types';

const PAGE_SIZE = 20;

const actionClass =
  'flex-1 rounded-[10px] border border-input bg-card py-2.25 text-center text-[13px] font-semibold active:bg-muted';

function QuizCard({ quiz, onShare }: { quiz: Quiz; onShare: (quiz: Quiz) => void }) {
  const status = quizStatus(quiz);
  const pendingReviews = quiz.stats?.pendingReviews ?? 0;
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-3.5 py-3">
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
      <div className="flex gap-1.5">
        <Link href={`/tg/teacher/quizzes/${quiz._id}/results`} className={actionClass}>
          Natijalar
        </Link>
        <Link href={`/tg/teacher/quizzes/${quiz._id}`} className={actionClass}>
          Tahrir
        </Link>
        {quiz.targetType === 'standalone' && (
          <button
            type="button"
            className="flex-1 rounded-[10px] bg-primary-soft py-2.25 text-[13px] font-bold text-primary active:opacity-80"
            onClick={() => onShare(quiz)}
          >
            Ulashish
          </button>
        )}
      </div>
    </article>
  );
}

// Har bir sahifa o'z so'rovi bilan: «Yana yuklash» oldingi sahifalarni qayta so'ramaydi
function QuizzesPage({ page, onShare }: { page: number; onShare: (quiz: Quiz) => void }) {
  const query = useQuizzesMy({ page, limit: PAGE_SIZE });
  if (query.isLoading) return <TgSkeletonList count={3} height={118} />;
  if (query.isError) return <TgError onRetry={() => query.refetch()} />;
  return query.data?.items.map((quiz) => <QuizCard key={quiz._id} quiz={quiz} onShare={onShare} />);
}

export default function TgTeacherQuizzesPage() {
  const [pages, setPages] = useState(1);
  const first = useQuizzesMy({ page: 1, limit: PAGE_SIZE });
  const last = useQuizzesMy({ page: pages, limit: PAGE_SIZE });
  const incoming = useQuizShares('incoming', 'pending');
  const [shareTarget, setShareTarget] = useState<Pick<Quiz, '_id' | 'title'> | null>(null);

  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;
  const newShares = incoming.data?.length ?? 0;
  const onShare = (quiz: Quiz) => setShareTarget({ _id: quiz._id, title: quiz.title });

  return (
    <TgPage className="gap-3">
      <TgHeader
        title="Testlarim"
        action={
          <Link href="/tg/teacher/quizzes/new" className={tgHeaderActionClass}>
            <Plus className="size-4" /> Test
          </Link>
        }
      />

      <Link
        href="/tg/teacher/shares"
        className="flex items-center justify-between rounded-[14px] bg-primary-soft px-3.5 py-3 text-sm font-semibold text-primary active:opacity-80"
      >
        <span>
          Ulashilgan testlar
          {newShares > 0 && ` · ${newShares} yangi`}
        </span>
        <ChevronRight className="size-4" />
      </Link>

      {first.isLoading ? (
        <TgSkeletonList count={4} height={118} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty
          icon={ClipboardList}
          title="Hali test yaratmagansiz"
          description="«+ Test» tugmasi orqali birinchi testni yarating"
        />
      ) : (
        <>
          {Array.from({ length: pages }, (_, i) => (
            <QuizzesPage key={i + 1} page={i + 1} onShare={onShare} />
          ))}
          {pages < totalPages && last.isSuccess && !last.isPlaceholderData && (
            <TgLoadMore
              onClick={() => setPages((p) => p + 1)}
              shown={Math.min(pages * PAGE_SIZE, total)}
              total={total}
            />
          )}
        </>
      )}

      <ShareQuizDialog quiz={shareTarget} onOpenChange={(open) => !open && setShareTarget(null)} />
    </TgPage>
  );
}
