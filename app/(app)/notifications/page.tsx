'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Check, CheckCheck, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useNotifications(1, 50);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bildirishnomalar"
        description="So'nggi yangiliklar va xabarlar"
        actions={
          hasUnread ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="h-10 text-sm font-medium sm:text-base"
            >
              <CheckCheck className="size-4" /> Barchasini o&apos;qildi deb belgilash
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <SkeletonList count={5} itemClassName="h-24" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title="Hozircha bildirishnomalar yo'q" />
      ) : (
        <div className="space-y-3">
          {items.map((notification) => {
            let href: string | undefined;
            let actionLabel: string | undefined;

            if (
              notification.type === 'quiz' &&
              notification.meta?.quizId &&
              notification.meta?.attemptId
            ) {
              if (user?.role === 'student') {
                href = `/student/quizzes/${notification.meta.quizId}/attempts/${notification.meta.attemptId}`;
                actionLabel = "Natijani ko'rish";
              } else if (
                user?.role === 'teacher' &&
                notification.title.includes('Tekshirish kerak')
              ) {
                href = `/teacher/quizzes/${notification.meta.quizId}/results/${notification.meta.attemptId}`;
                actionLabel = 'Tekshirish';
              } else if (
                user?.role === 'teacher' &&
                notification.title.includes('Talaba testni yakunladi')
              ) {
                href = `/teacher/quizzes/${notification.meta.quizId}/results/${notification.meta.attemptId}`;
                actionLabel = "Ko'rish";
              }
            }

            console.log(href);

            return (
              <Card
                key={notification._id}
                onClick={() => {
                  if (!href) return;
                  if (!notification.isRead) markRead.mutate(notification._id);
                  router.push(href);
                }}
                className={cn(
                  'flex-row items-start gap-3 p-4 shadow-sm transition-all duration-200',
                  href && 'cursor-pointer hover:border-primary/40 hover:shadow-md',
                  !notification.isRead && 'border-primary/20 bg-primary/5 ring-1 ring-primary/10'
                )}
              >
                <span
                  className={cn(
                    'mt-1 flex size-10 shrink-0 items-center justify-center rounded-full',
                    notification.isRead
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/15 text-primary'
                  )}
                >
                  <Bell className="size-4" />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-foreground sm:text-lg">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        Yangi
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {formatDateTime(notification.createdAt)}
                    </p>

                    {href && actionLabel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs sm:text-sm"
                        render={<Link href={href} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notification.isRead) markRead.mutate(notification._id);
                        }}
                      >
                        {actionLabel} <ChevronRight className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="O'qildi deb belgilash"
                      className="h-9 w-9"
                      onClick={() => markRead.mutate(notification._id)}
                    >
                      <Check className="size-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="O'chirish"
                          className="h-9 w-9"
                        />
                      }
                    >
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bildirishnomani o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu amalni bekor qilib bo&apos;lmaydi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteNotification.mutate(notification._id)}
                        >
                          O&apos;chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
