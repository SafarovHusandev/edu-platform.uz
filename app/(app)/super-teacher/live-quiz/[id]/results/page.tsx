'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, History, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { SkeletonList } from '@/components/ui/skeleton';
import { useLiveQuiz, useLiveQuizSessions } from '@/hooks/use-live-quizzes';
import { formatDateTime, formatDuration } from '@/lib/format';
import { ApiError } from '@/lib/api-client';
import type { LiveSessionSummary } from '@/types/live-quiz';

const MEDALS = ['🥇', '🥈', '🥉'];

function sessionDuration(session: LiveSessionSummary) {
  if (!session.endedAt) return 'Yakunlanmagan';
  const seconds = Math.max(
    0,
    Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
  );
  return formatDuration(seconds);
}

export default function LiveQuizSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const quiz = useLiveQuiz(id);
  const { data, isLoading, isError, error, refetch } = useLiveQuizSessions(id, page);
  const sessions = data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader
        title="O'tkazilgan o'yinlar"
        description={quiz.data?.title}
        breadcrumbs={[
          { label: 'Super-ustoz', href: '/super-teacher' },
          { label: 'Jonli viktorina', href: '/super-teacher/live-quiz' },
          { label: 'Natijalar' },
        ]}
        className="mb-0"
      />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState
          title={error instanceof ApiError && error.status === 403 ? "Ruxsat yo'q" : undefined}
          onRetry={() => refetch()}
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Bu viktorina hali o'tkazilmagan"
          description="O'yin yakunlangach, natijalari shu yerda saqlanadi"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <Link
              key={session._id}
              href={`/super-teacher/live-quiz/results/${session._id}`}
              className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 sm:w-56">
                <p className="font-semibold">{formatDateTime(session.startedAt)}</p>
                <p className="text-sm text-muted-foreground">
                  {sessionDuration(session)} · PIN {session.pin}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold sm:w-32">
                <Users className="size-4 text-muted-foreground" /> {session.playerCount} ishtirokchi
              </span>
              <ol className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
                {session.podium.slice(0, 3).map((p, i) => (
                  <li key={`${p.name}-${i}`} className="flex min-w-0 items-center gap-1">
                    <span aria-label={`${i + 1}-o'rin`}>{MEDALS[i]}</span>
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.score}</span>
                  </li>
                ))}
              </ol>
              <ChevronRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
            </Link>
          ))}
        </div>
      )}

      {data && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          itemLabel="o'yin"
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
