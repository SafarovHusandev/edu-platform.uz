'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { TgAvatar, TgEmpty, TgError, TgHeader, TgPage, TgSkeletonList } from '@/components/tg/tg-ui';
import { useTopTeachers } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const MEDAL = ['bg-gold text-foreground', 'bg-slate-300 text-slate-800', 'bg-amber-700 text-white'];

export default function TgTeacherRankPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const top = useTopTeachers(page, PAGE_SIZE);
  const items = top.data?.items ?? [];
  const me = top.data?.me;
  const meRow = items.find((t) => t._id === user?._id);

  return (
    <TgPage>
      <TgHeader title="Eng faol o'qituvchilar" />

      {me && (
        <div className="flex items-center gap-3 rounded-[18px] bg-primary px-4 py-3.5 text-primary-foreground">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 font-heading text-lg font-bold">
            {me.rank}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">Siz · {user?.name}</span>
            <span className="block truncate text-[13px] text-white/80">
              {meRow
                ? `${meRow.coursesCount} kurs · ${meRow.quizzesCount} test${meRow.avgRating ? ` · ★ ${meRow.avgRating.toFixed(1)}` : ''}`
                : `${me.activityScore} faollik ball`}
            </span>
          </span>
        </div>
      )}

      {top.isLoading ? (
        <TgSkeletonList count={7} height={56} />
      ) : top.isError ? (
        <TgError onRetry={() => top.refetch()} />
      ) : items.length === 0 ? (
        <TgEmpty icon={Trophy} title="Reyting hali shakllanmagan" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((teacher) => {
            const isMe = teacher._id === user?._id;
            return (
              <div
                key={teacher._id}
                className={cn(
                  'flex items-center gap-3 border-t border-border px-3.5 py-2.5 first:border-t-0',
                  isMe && 'bg-primary-soft'
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                    MEDAL[teacher.rank - 1] ?? 'bg-muted text-muted-foreground'
                  )}
                >
                  {teacher.rank}
                </span>
                <TgAvatar name={teacher.name} src={teacher.avatar} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{teacher.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {teacher.coursesCount} kurs · {teacher.quizzesCount} test · {teacher.booksCount} kitob
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {teacher.avgRating ? `★ ${teacher.avgRating.toFixed(1)}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(top.data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 rounded-xl border border-border bg-card px-4 text-sm font-semibold disabled:opacity-40"
          >
            Oldingi
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {top.data?.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= (top.data?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 rounded-xl border border-border bg-card px-4 text-sm font-semibold disabled:opacity-40"
          >
            Keyingi
          </button>
        </div>
      )}
    </TgPage>
  );
}
