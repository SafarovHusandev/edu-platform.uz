"use client"

import Link from "next/link"
import { BookOpen, Gem, Award, ArrowRight, Trophy, PlayCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/store/auth-store"
import { useMyEnrollments } from "@/hooks/use-enrollment"
import { useMyCertificates } from "@/hooks/use-certificates"
import { formatNumber } from "@/lib/format"
import { resolveAssetUrl } from "@/lib/config"

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: enrollments, isLoading } = useMyEnrollments(1, 6)
  const { data: certificates } = useMyCertificates(1, 1)

  const inProgress = enrollments?.items.filter((e) => !e.isCompleted) ?? []

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-linear-to-br from-primary to-primary/70 p-6 text-primary-foreground sm:p-8">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Xush kelibsiz, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-primary-foreground/80">
          Bugun ham o&apos;rganishni davom ettiring va yangi olmoslar to&apos;plang.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Gem className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{formatNumber(user?.diamonds ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Olmoslar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{enrollments?.total ?? 0}</p>
              <p className="text-sm text-muted-foreground">Kurslar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <span className="flex size-11 items-center justify-center rounded-xl bg-success/15 text-success">
              <Award className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{certificates?.total ?? 0}</p>
              <p className="text-sm text-muted-foreground">Sertifikatlar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Davom eting</h2>
          <Button variant="ghost" size="sm" render={<Link href="/student/courses" />}>
            Barchasi <ArrowRight className="size-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : inProgress.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Trophy className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Hali hech qanday kursga yozilmagansiz
              </p>
              <Button size="sm" render={<Link href="/courses" />}>
                Kurslarni ko&apos;rish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((enrollment) => {
              const course = typeof enrollment.course === "object" ? enrollment.course : null
              if (!course) return null
              const thumbnail = resolveAssetUrl(course.thumbnail)
              return (
                <Link
                  key={enrollment._id}
                  href={`/student/courses/${enrollment._id}`}
                  className="group flex flex-col gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbnail} alt={course.title} className="size-12 rounded-lg object-cover" />
                    ) : (
                      <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <PlayCircle className="size-5" />
                      </span>
                    )}
                    <p className="line-clamp-2 flex-1 text-sm font-medium">{course.title}</p>
                  </div>
                  <div>
                    <Progress value={enrollment.progress ?? 0} className="h-1.5" />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {Math.round(enrollment.progress ?? 0)}% bajarildi
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
