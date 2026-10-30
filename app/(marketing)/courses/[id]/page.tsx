import { notFound } from 'next/navigation';
import { FileText, PlayCircle, Star } from 'lucide-react';
import { EnrollCard } from '@/components/courses/enroll-card';
import { CourseReviews } from '@/components/courses/course-reviews';
import { api } from '@/lib/api-client';
import { formatNumber } from '@/lib/format';
import type { Course, Lesson, Paginated, Review } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCourse(id: string) {
  try {
    return await api.get<{ course: Course; quizzesCount?: number }>(`/courses/${id}`, undefined, {
      skipAuth: true,
    });
  } catch {
    return null;
  }
}

function lessonMeta(lesson: Lesson) {
  const kind = [
    lesson.videoUrl ? 'Video' : null,
    lesson.attachments?.length ? 'material' : null,
    !lesson.videoUrl && lesson.content ? 'Matn' : null,
  ]
    .filter(Boolean)
    .join(' + ');
  return [kind || null, lesson.durationMinutes ? `${lesson.durationMinutes} daq` : null]
    .filter(Boolean)
    .join(' · ');
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getCourse(id);
  if (!detail?.course) notFound();
  const { course, quizzesCount } = detail;

  const [lessons, reviews] = await Promise.all([
    api
      .get<{ lessons: Lesson[] }>(`/courses/${id}/lessons`, undefined, { skipAuth: true })
      .then((res) => res.lessons)
      .catch(() => [] as Lesson[]),
    api
      .get<Paginated<Review>>(`/courses/${id}/reviews`, undefined, { skipAuth: true })
      .then((res) => res.items)
      .catch(() => [] as Review[]),
  ]);

  const category = typeof course.category === 'object' ? course.category?.name : undefined;
  const teacher = typeof course.teacher === 'object' ? course.teacher : undefined;
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const reviewsCount = course.reviewsCount ?? reviews.length;

  return (
    <div className="pb-14">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-300 flex-col gap-4 px-4 py-12 sm:px-6">
          {category && (
            <span className="self-start rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold">
              {category}
            </span>
          )}
          <h1 className="max-w-[720px] font-heading text-3xl leading-tight font-bold sm:text-[40px]">
            {course.title}
          </h1>
          {course.description && (
            <p className="max-w-[680px] text-lg leading-relaxed text-primary-foreground/80">
              {course.description}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-primary-foreground/90">
            {course.rating ? (
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-gold text-gold" /> {course.rating.toFixed(1)} (
                {formatNumber(reviewsCount)} sharh)
              </span>
            ) : null}
            <span>{sortedLessons.length} dars</span>
            <span>{formatNumber(course.studentsCount ?? 0)} o&apos;quvchi</span>
            {teacher?.name && <span>O&apos;qituvchi: {teacher.name}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-300 items-start gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="overflow-hidden rounded-[20px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-[18px]">
              <h2 className="text-xl font-bold">Darslar</h2>
              <span className="text-sm text-muted-foreground">{sortedLessons.length} dars</span>
            </div>
            {sortedLessons.length === 0 ? (
              <p className="px-6 py-6 text-muted-foreground">
                Bu kurs uchun hali darslar qo&apos;shilmagan.
              </p>
            ) : (
              <ol>
                {sortedLessons.map((lesson, idx) => (
                  <li
                    key={lesson._id}
                    className="flex items-center gap-4 border-b border-muted px-6 py-4 last:border-0"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft font-heading text-sm font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{lesson.title}</div>
                      {(lessonMeta(lesson) || lesson.description) && (
                        <div className="line-clamp-1 text-sm text-muted-foreground">
                          {lessonMeta(lesson) || lesson.description}
                        </div>
                      )}
                    </div>
                    {lesson.videoUrl ? (
                      <PlayCircle className="size-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="size-5 shrink-0 text-muted-foreground" />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <h2 className="flex-1 text-xl font-bold">Sharhlar</h2>
              {course.rating ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-[32px] font-bold">
                    {course.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    / 5 · {formatNumber(reviewsCount)} sharh
                  </span>
                </div>
              ) : null}
            </div>
            <CourseReviews courseId={id} initialReviews={reviews} />
          </section>
        </div>

        <EnrollCard
          course={course}
          lessonsCount={sortedLessons.length}
          quizzesCount={quizzesCount}
        />
      </div>
    </div>
  );
}
