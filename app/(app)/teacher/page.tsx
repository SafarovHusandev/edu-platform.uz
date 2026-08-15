"use client"

import Link from "next/link"
import { BookOpen, Plus, Star, Users, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard, type StatCardTone } from "@/components/ui/stat-card"
import { ErrorState } from "@/components/ui/error-state"
import { useTeacherStats } from "@/hooks/use-stats"
import { useAuthStore } from "@/store/auth-store"
import { formatNumber, formatPrice } from "@/lib/format"

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: stats, isLoading, isError, refetch } = useTeacherStats()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl bg-linear-to-br from-primary to-primary/70 p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Xush kelibsiz, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-primary-foreground/80">
            Kurslaringiz va o&apos;quvchilaringiz statistikasi
          </p>
        </div>
        <Button variant="secondary" render={<Link href="/teacher/courses/new" />}>
          <Plus className="size-4" /> Yangi kurs
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { icon: BookOpen, label: "Kurslar", value: stats?.courses.total ?? 0, tone: "primary" },
              { icon: Users, label: "O'quvchilar", value: stats?.students.total ?? 0, tone: "success" },
              {
                icon: Wallet,
                label: "Daromad",
                value: formatPrice(stats?.revenue.total ?? 0),
                tone: "gold",
              },
              {
                icon: Star,
                label: "O'rtacha reyting",
                value: stats?.rating.avg ? stats.rating.avg.toFixed(1) : "—",
                tone: "accent",
              },
            ] satisfies Array<{ icon: typeof BookOpen; label: string; value: number | string; tone: StatCardTone }>
          ).map((item) => (
            <StatCard
              key={item.label}
              icon={item.icon}
              tone={item.tone}
              label={item.label}
              value={isLoading ? "—" : typeof item.value === "number" ? formatNumber(item.value) : item.value}
            />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/teacher/courses">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-4 pt-2">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </span>
              <div>
                <p className="font-medium">Kurslarni boshqarish</p>
                <p className="text-sm text-muted-foreground">Kurs va darslarni tahrirlang</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/quizzes">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-4 pt-2">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Star className="size-5" />
              </span>
              <div>
                <p className="font-medium">Testlarni boshqarish</p>
                <p className="text-sm text-muted-foreground">Savollar va natijalarni ko&apos;ring</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
