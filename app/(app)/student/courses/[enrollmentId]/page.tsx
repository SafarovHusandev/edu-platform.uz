"use client"

import { use } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, PlayCircle, GraduationCap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useEnrollment } from "@/hooks/use-enrollment"
import { useCourseLessons } from "@/hooks/use-lessons"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ enrollmentId: string }>
}

export default function EnrollmentDetailPage({ params }: PageProps) {
  const { enrollmentId } = use(params)
  const { data: enrollment, isLoading } = useEnrollment(enrollmentId)
  const course = enrollment && typeof enrollment.course === "object" ? enrollment.course : null
  const { data: lessons } = useCourseLessons(course?._id)
  const completedLessons = new Set(enrollment?.completedLessons ?? [])

  if (isLoading || !enrollment || !course) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-6" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold">{course.title}</h1>
            <p className="text-sm text-muted-foreground">{lessons?.length ?? 0} ta dars</p>
          </div>
        </div>
        <div className="w-full sm:w-56">
          <Progress value={enrollment.progress ?? 0} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {Math.round(enrollment.progress ?? 0)}% bajarildi
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Darslar</h2>
        {!lessons || lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu kursda hali darslar yo&apos;q</p>
        ) : (
          <ol className="space-y-2">
            {lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson, idx) => {
                const isDone = completedLessons.has(lesson._id)
                return (
                  <li key={lesson._id}>
                    <Link
                      href={`/student/lessons/${lesson._id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/40",
                        isDone && "bg-success/5"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-5 shrink-0 text-success" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium">{lesson.title}</span>
                      {isDone && <Badge variant="secondary">Tugallangan</Badge>}
                      <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                )
              })}
          </ol>
        )}
      </div>
    </div>
  )
}
