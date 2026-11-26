'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgSkeletonList,
} from '@/components/tg/tg-ui';
import { useTopTeachers } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import type { TeacherRanking } from '@/types';

const PAGE_SIZE = 20;

// Dizayn (TgTmRank): 1-o'rin — oltin, 2-3 — ko'k, qolganlar — kulrang
function medalClass(rank: number) {
  if (rank === 1) return 'bg-gold text-foreground dark:text-background';
  if (rank <= 3) return 'bg-primary text-primary-foreground';
  return 'bg-muted text-secondary-foreground';
}

function teacherMeta(t: TeacherRanking) {
  return [
    t.coursesCount ? `${t.coursesCount} kurs` : null,
    `${t.quizzesCount} test`,
    t.booksCount ? `${t.booksCount} kitob` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function RankPage({ page, myId }: { page: number; myId?: string }) {
  const query = useTopTeachers(page, PAGE_SIZE);
  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="p-3">
        <TgError onRetry={() => query.refetch()} />
      </div>
    );
  }
  return query.data?.items.map((teacher) => (
    <div
      key={teacher._id}
      aria-current={teacher._id === myId ? 'true' : undefined}
      className={cn(
        'flex items-center gap-3 border-t border-border px-3.5 py-2.75 first:border-t-0',
        teacher._id === myId && 'bg-primary-soft'
      )}
    >
      <span
        className={cn(
          'flex size-7.5 shrink-0 items-center justify-center rounded-[9px] font-heading text-[13px] font-bold tabular-nums',
          medalClass(teacher.rank)
        )}
      >
        {teacher.rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{teacher.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{teacherMeta(teacher)}</span>
      </span>
      <span className="shrink-0 text-sm font-bold tabular-nums">
        {teacher.avgRating ? `★ ${teacher.avgRating.toFixed(1)}` : '—'}
      </span>
    </div>
  ));
}

export default function TgTeacherRankPage() {
  const user = useAuthStore((s) => s.user);
  const [pages, setPages] = useState(1);
  const first = useTopTeachers(1, PAGE_SIZE);
  const last = useTopTeachers(pages, PAGE_SIZE);
  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;
  const me = first.data?.me;
  const meRow = first.data?.items.find((t) => t._id === user?._id);

  return (
    <TgPage className="gap-3">
      <TgHeader variant="inner" title="Eng faol o'qituvchilar" />

      {me && (
        <div className="flex items-center gap-3.5 rounded-[18px] bg-primary p-4 text-primary-foreground">
          <span className="font-heading text-[34px] leading-none font-bold tabular-nums">{me.rank}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">Siz · {user?.name}</span>
            <span className="block truncate text-[13px] text-primary-foreground/80">
              {meRow
                ? [teacherMeta(meRow), meRow.avgRating ? `★ ${meRow.avgRating.toFixed(1)}` : null]
                    .filter(Boolean)
                    .join(' · ')
                : `${me.activityScore} faollik bali`}
            </span>
          </span>
        </div>
      )}

      {first.isLoading ? (
        <TgSkeletonList count={7} height={52} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty
          icon={Trophy}
          title="Reyting hali shakllanmagan"
          description="Kurs, test va kitob qo'shgan o'qituvchilar shu yerda ko'rinadi"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {Array.from({ length: pages }, (_, i) => (
              <RankPage key={i + 1} page={i + 1} myId={user?._id} />
            ))}
          </div>
          {pages < totalPages && last.isSuccess && !last.isPlaceholderData && (
            <TgLoadMore
              onClick={() => setPages((p) => p + 1)}
              shown={Math.min(pages * PAGE_SIZE, total)}
              total={total}
            />
          )}
        </>
      )}
    </TgPage>
  );
}
