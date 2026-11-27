'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgSkeletonList,
} from '@/components/tg/tg-ui';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

// Bildirishnoma havolasini (meta.url) mini ilova ichidagi ekranga moslash.
// "Yangi natija" → .../results (natijalar), "Tekshirish kerak" → .../results/:attemptId
// (baholash). quizId+attemptId bo'yicha taxmin faqat url'siz eski yozuvlar uchun.
function miniAppHref(n: Notification): string | null {
  const url = n.meta?.url;
  if (!url) {
    if (n.type === 'quiz' && n.meta?.quizId && n.meta?.attemptId) {
      return `/tg/teacher/grading?quiz=${n.meta.quizId}&attempt=${n.meta.attemptId}`;
    }
    return null;
  }
  try {
    const path = new URL(url, window.location.origin).pathname;
    if (path.startsWith('/admin/users')) return '/tg/admin/users?tab=pending';
    if (path.startsWith('/admin/redemptions')) return '/tg/admin/requests';
    if (path.startsWith('/teacher/quiz-shares') || path.startsWith('/teacher/quizzes/shares')) {
      return '/tg/teacher/shares';
    }
    const review = path.match(/^\/teacher\/quizzes\/([^/]+)\/results\/([^/]+)$/);
    if (review) return `/tg/teacher/grading?quiz=${review[1]}&attempt=${review[2]}`;
    const results = path.match(/^\/teacher\/quizzes\/([^/]+)\/results$/);
    if (results) return `/tg/teacher/quizzes/${results[1]}/results`;
    return path;
  } catch {
    return null;
  }
}

const PAGE_SIZE = 30;

function NotificationsPage({ page }: { page: number }) {
  const router = useRouter();
  const query = useNotifications(page, PAGE_SIZE);
  const markRead = useMarkNotificationRead();
  if (query.isLoading) return <TgSkeletonList count={4} height={70} />;
  if (query.isError) return <TgError onRetry={() => query.refetch()} />;
  return query.data?.items.map((n) => (
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
        aria-hidden
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-primary')}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold wrap-break-word">
          {!n.isRead && <span className="sr-only">Yangi: </span>}
          {n.title}
        </span>
        <span className="block text-[13px] wrap-break-word text-muted-foreground">{n.message}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {formatRelativeTime(n.createdAt)}
        </span>
      </span>
    </button>
  ));
}

export default function TgNotificationsPage() {
  const [pages, setPages] = useState(1);
  const first = useNotifications(1, PAGE_SIZE);
  const last = useNotifications(pages, PAGE_SIZE);
  const unread = useUnreadNotificationsCount();
  const markAll = useMarkAllNotificationsRead();
  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;

  return (
    <TgPage className="gap-3">
      <TgHeader
        variant="inner"
        title="Bildirishnomalar"
        action={
          (unread.data ?? 0) > 0 && (
            <button
              type="button"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate(undefined, { onSuccess: () => haptic('success') })}
              className="shrink-0 text-sm font-semibold text-primary disabled:opacity-50"
            >
              Barchasini o&apos;qish
            </button>
          )
        }
      />

      {first.isLoading ? (
        <TgSkeletonList count={6} height={70} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty
          icon={Bell}
          title="Bildirishnomalar yo'q"
          description="Yangi urinish, ulashilgan test va so'rovlar haqida shu yerda xabar beramiz"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {Array.from({ length: pages }, (_, i) => (
              <NotificationsPage key={i + 1} page={i + 1} />
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
