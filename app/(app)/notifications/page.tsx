'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellOff, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { notificationTone } from '@/components/dashboard/recent-notifications';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { formatDate } from '@/lib/format';
import { resolveNotificationLink } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

type Filter = 'unread' | 'all';

// "Bugun 15:52" / "Kecha 09:10" / "21.10.2026"
function notificationTime(value: string) {
  const date = new Date(value);
  const time = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Bugun ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Kecha ${time}`;
  return formatDate(date);
}

export default function NotificationsPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, isError, refetch } = useNotifications(1, 50);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const all = data?.items ?? [];
  const unreadCount = all.filter((n) => !n.isRead).length;
  const [filter, setFilter] = useState<Filter>('all');
  const items = filter === 'unread' ? all.filter((n) => !n.isRead) : all;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Bildirishnomalar"
        actions={
          <>
            <FilterPills
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'unread', label: `O'qilmagan · ${unreadCount}` },
                { value: 'all', label: 'Barchasi' },
              ]}
            />
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="size-4" /> Hammasini o&apos;qilgan qilish
              </Button>
            )}
          </>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            filter === 'unread'
              ? "O'qilmagan bildirishnomalar yo'q"
              : "Hozircha bildirishnomalar yo'q"
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((notification) => {
            const tone = notificationTone(notification);
            const link = resolveNotificationLink(notification, role);

            function handleOpen() {
              if (!notification.isRead) markRead.mutate(notification._id);
              if (!link) return;
              if (link.external) window.open(link.href, '_blank', 'noopener,noreferrer');
              else router.push(link.href);
            }

            return (
              <article
                key={notification._id}
                role={link || !notification.isRead ? 'button' : undefined}
                tabIndex={link || !notification.isRead ? 0 : undefined}
                onClick={handleOpen}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpen();
                }}
                className={cn(
                  'flex items-center gap-3.5 rounded-[18px] bg-card px-4 py-4 transition-colors sm:px-[18px]',
                  notification.isRead ? 'border border-border' : 'border-[1.5px] border-primary/45',
                  (link || !notification.isRead) && 'cursor-pointer hover:border-primary/60'
                )}
              >
                <span
                  className={cn(
                    'flex size-[42px] shrink-0 items-center justify-center rounded-xl',
                    tone.className
                  )}
                >
                  <tone.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{notification.title}</div>
                  <div className="mt-0.5 text-muted-foreground">{notification.message}</div>
                  <div className="mt-1 text-[13px] text-muted-foreground sm:hidden">
                    {notificationTime(notification.createdAt)}
                  </div>
                </div>
                <span className="hidden shrink-0 text-[13px] whitespace-nowrap text-muted-foreground sm:block">
                  {notificationTime(notification.createdAt)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="O'chirish"
                  className="size-9 shrink-0"
                  disabled={
                    deleteNotification.isPending &&
                    deleteNotification.variables === notification._id
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification.mutate(notification._id);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
