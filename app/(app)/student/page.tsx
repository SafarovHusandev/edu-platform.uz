"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, Gem, Award, ArrowRight, Trophy, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/auth-store"
import { useMyEnrollments } from "@/hooks/use-enrollment"
import { useMyCertificates } from "@/hooks/use-certificates"
import { formatNumber } from "@/lib/format"
import { resolveAssetUrl } from "@/lib/config"

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: enrollments, isLoading, isError, refetch } = useMyEnrollments(1, 6)
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
        <StatCard icon={Gem} tone="gold" label="Olmoslar" value={formatNumber(user?.diamonds ?? 0)} />
        <StatCard icon={BookOpen} tone="primary" label="Kurslar" value={enrollments?.total ?? 0} />
        <StatCard icon={Award} tone="success" label="Sertifikatlar" value={certificates?.total ?? 0} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Davom eting</h2>
          <Button variant="ghost" size="sm" render={<Link href="/student/courses" />}>
            Barchasi <ArrowRight className="size-4" />
          </Button>
        </div>

        {isLoading ? (
          <SkeletonCardGrid count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : inProgress.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Hali hech qanday kursga yozilmagansiz"
            action={
              <Button size="sm" render={<Link href="/courses" />}>
                Kurslarni ko&apos;rish
              </Button>
            }
          />
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
                      <Image
                        src={thumbnail}
                        alt={course.title}
                        width={48}
                        height={48}
                        unoptimized
                        className="size-12 rounded-lg object-cover"
                      />
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
