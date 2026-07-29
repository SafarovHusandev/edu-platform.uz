"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTeacherStats } from "@/hooks/use-stats"
import { formatNumber, formatPrice } from "@/lib/format"

export default function TeacherStatsPage() {
  const { data: stats, isLoading } = useTeacherStats()

  const draft = (stats?.courses.total ?? 0) - (stats?.courses.published ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Statistika</h1>
        <p className="mt-1 text-muted-foreground">Kurslaringiz bo&apos;yicha batafsil ma&apos;lumot</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">Nashr etilgan</p>
            <p className="mt-1 text-2xl font-semibold">{stats?.courses.published ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">Qoralama</p>
            <p className="mt-1 text-2xl font-semibold">{isLoading ? 0 : draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">Jami daromad</p>
            <p className="mt-1 text-2xl font-semibold">{formatPrice(stats?.revenue.total ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Testlar</CardTitle>
          <CardDescription>Barcha kurslaringizdagi testlar bo&apos;yicha umumiy natija</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xl font-semibold">{formatNumber(stats?.quizzes.totalQuizzes ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Testlar soni</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{formatNumber(stats?.quizzes.totalAttempts ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Urinishlar</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{stats?.quizzes.avgScore ?? 0}%</p>
                <p className="text-xs text-muted-foreground">O&apos;rtacha ball</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{stats?.quizzes.passRate ?? 0}%</p>
                <p className="text-xs text-muted-foreground">O&apos;tish darajasi</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Jami {formatNumber(stats?.students.total ?? 0)} o&apos;quvchi
        {stats?.rating.avg ? `, o'rtacha reyting ${stats.rating.avg.toFixed(1)}` : ""}
      </p>
    </div>
  )
}
