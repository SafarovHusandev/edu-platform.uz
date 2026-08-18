import Link from "next/link"
import Image from "next/image"
import { Star, Users, BookOpen, GraduationCap, ArrowRight, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Course } from "@/types"
import { formatPrice, formatNumber, initials } from "@/lib/format"
import { resolveAssetUrl } from "@/lib/config"

export function CourseCard({ course }: { course: Course }) {
  const category = typeof course.category === "object" ? course.category?.name : undefined
  const teacher = typeof course.teacher === "object" ? course.teacher : undefined
  const teacherName = teacher?.name || (typeof course.teacher === "string" ? course.teacher : undefined)
  const teacherAvatar = teacher?.avatar ? resolveAssetUrl(teacher.avatar) : undefined
  const thumbnail = resolveAssetUrl(course.thumbnail)
  const isFree = !course.price || course.price === 0

  return (
    <Link href={`/courses/${course._id}`} className="group block h-full select-none outline-none">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 dark:border-border/60 dark:hover:border-primary/50 dark:hover:shadow-primary/10">
        {/* Media / Thumbnail */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/70">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={course.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="relative flex size-full items-center justify-center bg-linear-to-br from-primary/15 via-primary/5 to-accent/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.2),transparent)]" />
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background/80 shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <GraduationCap className="size-7 text-primary" />
              </div>
            </div>
          )}

          {/* Subtle gradient vignette overlay at bottom */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

          {/* Top Badges */}
          <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
            {category ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-background/85 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-primary" />
                {category}
              </span>
            ) : (
              <span />
            )}

            {isFree && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs backdrop-blur-md">
                <Sparkles className="size-3" />
                Bepul
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-2.5">
            {/* Teacher Row */}
            {teacherName && (
              <div className="flex items-center gap-2">
                <Avatar size="sm" className="size-5 border border-border">
                  {teacherAvatar && <AvatarImage src={teacherAvatar} alt={teacherName} />}
                  <AvatarFallback className="text-[10px] font-medium">{initials(teacherName)}</AvatarFallback>
                </Avatar>
                <span className="line-clamp-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {teacherName}
                </span>
              </div>
            )}

            {/* Course Title */}
            <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
              {course.title}
            </h3>

            {/* Course Description */}
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          </div>

          {/* Metrics & Footer */}
          <div className="space-y-3 pt-2">
            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {course.rating !== undefined ? (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {course.rating.toFixed(1)}
                  {course.reviewsCount !== undefined && (
                    <span className="text-[11px] font-normal text-muted-foreground">({course.reviewsCount})</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Star className="size-3 text-muted-foreground" />
                  Yangi
                </span>
              )}

              {course.lessonsCount !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3 text-muted-foreground" />
                  {course.lessonsCount} dars
                </span>
              )}

              {course.studentsCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground" />
                  {formatNumber(course.studentsCount)} o&apos;quvchi
                </span>
              )}
            </div>

            {/* Price & Action Row */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Narxi
                </span>
                <span
                  className={
                    isFree
                      ? "text-base font-bold text-success"
                      : "text-base font-bold text-foreground transition-colors group-hover:text-primary"
                  }
                >
                  {formatPrice(course.price)}
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-xs">
                Ko&apos;rish
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
      <div className="relative aspect-[16/10] w-full animate-pulse bg-muted/80">
        <div className="absolute top-3 left-3 h-5 w-20 rounded-full bg-muted-foreground/15" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-5 animate-pulse rounded-full bg-muted/80" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-muted/80" />
          </div>
          <div className="space-y-2">
            <div className="h-4.5 w-4/5 animate-pulse rounded bg-muted/80" />
            <div className="h-4.5 w-3/5 animate-pulse rounded bg-muted/80" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted/80" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-14 animate-pulse rounded bg-muted/80" />
            <div className="h-3.5 w-16 animate-pulse rounded bg-muted/80" />
            <div className="h-3.5 w-16 animate-pulse rounded bg-muted/80" />
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div className="h-5 w-24 animate-pulse rounded bg-muted/80" />
            <div className="h-7 w-20 animate-pulse rounded-lg bg-muted/80" />
          </div>
        </div>
      </div>
    </div>
  )
}
