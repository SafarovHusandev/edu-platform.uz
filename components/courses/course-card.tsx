import Link from "next/link"
import Image from "next/image"
import { Star, Users, BookOpen, GraduationCap } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Course } from "@/types"
import { formatPrice, formatNumber } from "@/lib/format"
import { resolveAssetUrl } from "@/lib/config"

export function CourseCard({ course }: { course: Course }) {
  const category = typeof course.category === "object" ? course.category?.name : undefined
  const teacher = typeof course.teacher === "object" ? course.teacher?.name : undefined
  const thumbnail = resolveAssetUrl(course.thumbnail)

  return (
    <Link href={`/courses/${course._id}`}>
      <Card className="group h-full py-0 transition-shadow hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={course.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 to-accent/40">
              <GraduationCap className="size-10 text-primary/50" />
            </div>
          )}
          {category && (
            <Badge className="absolute left-2.5 top-2.5" variant="secondary">
              {category}
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 pt-4">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
          {teacher && (
            <p className="mt-1 text-xs text-muted-foreground">{teacher}</p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {course.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-gold text-gold" />
                {course.rating.toFixed(1)}
              </span>
            )}
            {course.studentsCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {formatNumber(course.studentsCount)}
              </span>
            )}
            {course.lessonsCount !== undefined && (
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {course.lessonsCount} dars
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between bg-transparent px-4 pb-4 pt-0">
          <span className={course.price ? "font-semibold text-foreground" : "font-semibold text-success"}>
            {formatPrice(course.price)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
