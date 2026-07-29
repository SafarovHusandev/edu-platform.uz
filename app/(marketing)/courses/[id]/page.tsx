import { notFound } from "next/navigation"
import Image from "next/image"
import { BookOpen, GraduationCap, Star, Users, PlayCircle } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnrollCard } from "@/components/courses/enroll-card"
import { CourseReviews } from "@/components/courses/course-reviews"
import { api } from "@/lib/api-client"
import { resolveAssetUrl } from "@/lib/config"
import { initials } from "@/lib/format"
import type { Course, Lesson, Paginated, Review } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getCourse(id: string) {
  try {
    const res = await api.get<{ course: Course }>(`/courses/${id}`, undefined, { skipAuth: true })
    return res.course
  } catch {
    return null
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params
  const course = await getCourse(id)
  if (!course) notFound()

  const [lessons, reviews] = await Promise.all([
    api
      .get<{ lessons: Lesson[] }>(`/courses/${id}/lessons`, undefined, { skipAuth: true })
      .then((res) => res.lessons)
      .catch(() => [] as Lesson[]),
    api
      .get<Paginated<Review>>(`/courses/${id}/reviews`, undefined, { skipAuth: true })
      .then((res) => res.items)
      .catch(() => [] as Review[]),
  ])

  const category = typeof course.category === "object" ? course.category?.name : undefined
  const teacher = typeof course.teacher === "object" ? course.teacher : undefined
  const thumbnail = resolveAssetUrl(course.thumbnail)

  return (
    <div className="pb-16">
      <div className="border-b border-border/60 bg-muted/30">
        <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:py-14">
          <div className="flex flex-col justify-center gap-4">
            {category && <Badge variant="secondary" className="w-fit">{category}</Badge>}
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="max-w-2xl text-muted-foreground">{course.description}</p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {teacher && (
                <span className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(teacher.name)}</AvatarFallback>
                  </Avatar>
                  {teacher.name}
                </span>
              )}
              {course.rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-gold text-gold" />
                  {course.rating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-4" /> {course.studentsCount ?? 0} o&apos;quvchi
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-4" /> {lessons.length} dars
              </span>
            </div>
          </div>
          <EnrollCard course={course} />
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <Tabs defaultValue="lessons">
          <TabsList>
            <TabsTrigger value="lessons">Dars rejasi</TabsTrigger>
            <TabsTrigger value="reviews">Sharhlar ({reviews.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="lessons" className="mt-6">
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu kurs uchun hali darslar qo&apos;shilmagan.
              </p>
            ) : (
              <ol className="space-y-2">
                {lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, idx) => (
                    <li
                      key={lesson._id}
                      className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                        {lesson.description && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
                    </li>
                  ))}
              </ol>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <CourseReviews courseId={id} initialReviews={reviews} />
          </TabsContent>
        </Tabs>

        <aside className="hidden lg:block">
          {thumbnail ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
              <Image src={thumbnail} alt={course.title} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-accent/40">
              <GraduationCap className="size-10 text-primary/50" />
            </div>
          )}
        </aside>
      </Container>
    </div>
  )
}
