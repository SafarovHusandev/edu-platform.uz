"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, BellOff, Check, CheckCheck, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonList } from "@/components/ui/skeleton"
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

export default function NotificationsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, refetch } = useNotifications(1, 50)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  const items = data?.items ?? []
  const hasUnread = items.some((n) => !n.isRead)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Bildirishnomalar"
        description="So'nggi yangiliklar va xabarlar"
        actions={
          hasUnread ? (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="size-4" /> Barchasini o&apos;qildi deb belgilash
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <SkeletonList count={5} itemClassName="h-20" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title="Hozircha bildirishnomalar yo'q" />
      ) : (
        <div className="space-y-2">
          {items.map((notification) => {
            let href: string | undefined
            let actionLabel: string | undefined

            if (notification.type === "quiz" && notification.meta?.quizId && notification.meta?.attemptId) {
              if (user?.role === "student") {
                href = `/student/quizzes/${notification.meta.quizId}/attempts/${notification.meta.attemptId}`
                actionLabel = "Natijani ko'rish"
              } else if (user?.role === "teacher" && notification.title === "Tekshirish kerak") {
                href = `/teacher/quizzes/${notification.meta.quizId}/results?attemptId=${notification.meta.attemptId}`
                actionLabel = "Tekshirish"
              } else if (user?.role === "teacher" && notification.title === "Talaba testni yakunladi") {
                href = `/teacher/quizzes/${notification.meta.quizId}/results/${notification.meta.attemptId}`
                actionLabel = "Ko'rish"
              }
            }

            return (
              <Card
                key={notification._id}
                onClick={() => {
                  if (!href) return
                  if (!notification.isRead) markRead.mutate(notification._id)
                  router.push(href)
                }}
                className={cn(
                  "flex-row items-start gap-3 p-4",
                  href && "cursor-pointer transition-colors hover:border-primary/40",
                  !notification.isRead && "bg-primary/5 ring-primary/20"
                )}
              >
                <span
                  className={cn(
                    "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full",
                    notification.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  <Bell className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </p>
                    {href && actionLabel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        render={<Link href={href} />}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!notification.isRead) markRead.mutate(notification._id)
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
                      onClick={() => markRead.mutate(notification._id)}
                    >
                      <Check className="size-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bildirishnomani o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>Bu amalni bekor qilib bo&apos;lmaydi.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteNotification.mutate(notification._id)}>
                          O&apos;chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
