'use client';

import Link from 'next/link';
import { Bell, CheckCircle2, Gift, XCircle } from 'lucide-react';
import { SectionCard, SectionLink } from '@/components/dashboard/dashboard-ui';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuthStore } from '@/store/auth-store';
import { resolveNotificationLink } from '@/lib/notifications';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

export function notificationTone(notification: Notification) {
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (text.includes('rad'))
    return { icon: XCircle, className: 'bg-destructive-soft text-destructive' };
  if (notification.type === 'reward' || text.includes('mukofot'))
    return { icon: Gift, className: 'bg-gold-soft text-gold-foreground' };
  if (notification.type === 'quiz' || text.includes('natija'))
    return { icon: CheckCircle2, className: 'bg-success-soft text-success' };
  return { icon: Bell, className: 'bg-primary-soft text-primary' };
}

export function RecentNotifications({ limit = 3 }: { limit?: number }) {
  const role = useAuthStore((s) => s.user?.role);
  // Header'dagi son belgisi bilan bir xil so'rov — kesh qayta ishlatiladi
  const { data, isLoading } = useNotifications(1, 50);
  const items = data?.items.slice(0, limit) ?? [];

  return (
    <SectionCard title="So'nggi bildirishnomalar" bodyClassName="flex flex-col gap-3">
      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
        ))
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha bildirishnomalar yo&apos;q</p>
      ) : (
        items.map((notification) => {
          const tone = notificationTone(notification);
          const link = resolveNotificationLink(notification, role);
          const body = (
            <>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-[10px]',
                  tone.className
                )}
              >
                <tone.icon className="size-4" />
              </span>
              <span className="min-w-0 text-sm">
                <span className="flex items-center gap-1.5 font-bold">
                  {!notification.isRead && (
                    <span className="size-2 shrink-0 rounded-full bg-destructive" />
                  )}
                  <span className="truncate">{notification.title}</span>
                </span>
                <span className="line-clamp-2 text-muted-foreground">{notification.message}</span>
                <span className="text-xs text-muted-foreground/80">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </span>
            </>
          );
          return link && !link.external ? (
            <Link key={notification._id} href={link.href} className="flex gap-2.5 hover:opacity-80">
              {body}
            </Link>
          ) : (
            <div key={notification._id} className="flex gap-2.5">
              {body}
            </div>
          );
        })
      )}
      <SectionLink href="/notifications">Barchasi →</SectionLink>
    </SectionCard>
  );
}
