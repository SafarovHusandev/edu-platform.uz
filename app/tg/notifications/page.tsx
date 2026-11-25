'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { TgEmpty, TgError, TgHeader, TgPage, TgSkeletonList } from '@/components/tg/tg-ui';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

// Bildirishnoma havolasini mini ilova ichidagi ekranga moslash (bo'lsa)
function miniAppHref(n: Notification): string | null {
  const url = n.meta?.url;
  if (n.meta?.quizId && n.meta?.attemptId && n.type === 'quiz') {
    return `/tg/teacher/grading?quiz=${n.meta.quizId}&attempt=${n.meta.attemptId}`;
  }
  if (!url) return null;
  try {
    const path = new URL(url, window.location.origin).pathname;
    if (path.startsWith('/admin/users')) return '/tg/admin/users?tab=pending';
    if (path.startsWith('/admin/redemptions')) return '/tg/admin/requests';
    if (path.startsWith('/teacher/quiz-shares')) return '/tg/teacher/shares';
    const results = path.match(/^\/teacher\/quizzes\/([^/]+)\/results$/);
    if (results) return `/tg/teacher/quizzes/${results[1]}/results`;
    return path;
  } catch {
    return null;
  }
}

const PAGE_SIZE = 30;

export default function TgNotificationsPage() {
  const router = useRouter();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const notifications = useNotifications(1, limit);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = notifications.data?.items ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  return (
    <TgPage>
      <TgHeader
        title="Bildirishnomalar"
        action={
          hasUnread && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="text-sm font-semibold text-primary"
            >
              Barchasini o&apos;qish
            </button>
          )
        }
      />

      {notifications.isLoading ? (
        <TgSkeletonList count={6} height={70} />
      ) : notifications.isError ? (
        <TgError onRetry={() => notifications.refetch()} />
      ) : items.length === 0 ? (
        <TgEmpty icon={Bell} title="Bildirishnomalar yo'q" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((n) => (
            <button
              key={n._id}
              type="button"
              onClick={() => {
                if (!n.isRead) markRead.mutate(n._id);
                const href = miniAppHref(n);
                if (href) router.push(href);
              }}
              className={cn(
                'flex w-full gap-3 border-t border-border px-3.5 py-3 text-left first:border-t-0 active:bg-muted',
                !n.isRead && 'bg-primary-soft/60'
              )}
            >
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  n.isRead ? 'bg-transparent' : 'bg-primary'
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold wrap-break-word">{n.title}</span>
                <span className="block text-[13px] text-muted-foreground wrap-break-word">{n.message}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {(notifications.data?.total ?? 0) > items.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="h-11 rounded-xl border border-border bg-card text-sm font-semibold"
        >
          Yana yuklash
        </button>
      )}
    </TgPage>
  );
}
