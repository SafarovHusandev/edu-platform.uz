"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, BellOff, Check, CheckCheck, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  const { data, isLoading } = useNotifications(1, 50)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  const items = data?.items ?? []
  const hasUnread = items.some((n) => !n.isRead)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Bildirishnomalar</h1>
          <p className="mt-1 text-muted-foreground">So&apos;nggi yangiliklar va xabarlar</p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="size-4" /> Barchasini o&apos;qildi deb belgilash
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <BellOff className="size-6" />
          <p className="text-sm">Hozircha bildirishnomalar yo&apos;q</p>
        </div>
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
                <div className="flex shrink-0 gap-1">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="O'qildi deb belgilash"
                      onClick={(e) => {
                        e.stopPropagation()
                        markRead.mutate(notification._id)
                      }}
                    >
                      <Check className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="O'chirish"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification.mutate(notification._id)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
