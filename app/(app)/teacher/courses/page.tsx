"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, GraduationCap, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import { useCourses } from "@/hooks/use-courses"
import { useAuthStore } from "@/store/auth-store"
import { resolveAssetUrl } from "@/lib/config"
import { formatPrice } from "@/lib/format"

export default function TeacherCoursesPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, refetch } = useCourses({ page: 1, limit: 100 })

  const myCourses = data?.items.filter((course) => {
    const teacherId = typeof course.teacher === "object" ? course.teacher?._id : course.teacher
    return teacherId === user?._id
  })

  return (
    <div>
      <PageHeader
        title="Kurslarim"
        description="Yaratgan kurslaringizni boshqaring"
        actions={
          <Button render={<Link href="/teacher/courses/new" />}>
            <Plus className="size-4" /> Yangi kurs
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={3} itemClassName="h-56" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !myCourses || myCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Hali kurs yaratmagansiz"
          action={<Button render={<Link href="/teacher/courses/new" />}>Birinchi kursni yaratish</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((course) => {
            const thumbnail = resolveAssetUrl(course.thumbnail)
            return (
              <Link key={course._id} href={`/teacher/courses/${course._id}`}>
                <Card className="h-full py-0 transition-shadow hover:shadow-lg">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={course.title} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 to-accent/40">
                        <GraduationCap className="size-8 text-primary/50" />
                      </div>
                    )}
                    <Badge
                      className="absolute right-2.5 top-2.5"
                      variant={course.isPublished ? "default" : "secondary"}
                    >
                      {course.isPublished ? "Nashr etilgan" : "Qoralama"}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-col gap-1.5 pt-4">
                    <h3 className="line-clamp-2 text-sm font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {course.studentsCount ?? 0} o&apos;quvchi · {course.lessonsCount ?? 0} dars
                    </p>
                    <p className="mt-1 text-sm font-semibold">{formatPrice(course.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
