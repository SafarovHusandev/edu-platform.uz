'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { CourseLessonsList, sortLessons } from '@/components/courses/course-lessons-list';
import { CourseCover, enrollmentProgress } from '@/components/courses/enrollment-card';
import { useEnrollment } from '@/hooks/use-enrollment';
import { useCourseLessons } from '@/hooks/use-lessons';

interface PageProps {
  params: Promise<{ enrollmentId: string }>;
}

export default function EnrollmentDetailPage({ params }: PageProps) {
  const { enrollmentId } = use(params);
  const { data: enrollment, isLoading, isError, refetch } = useEnrollment(enrollmentId);
  const course = enrollment && typeof enrollment.course === 'object' ? enrollment.course : null;
  const { data: courseLessons } = useCourseLessons(course?._id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="h-40 animate-pulse rounded-[22px] bg-muted" />
        <div className="h-64 animate-pulse rounded-[22px] bg-muted" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!enrollment || !course) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Kurs topilmadi"
        description="Bu kursga yozilmagansiz yoki kurs o'chirilgan bo'lishi mumkin."
        action={
          <Button variant="outline" render={<Link href="/student/courses" />}>
            Kurslarimga qaytish
          </Button>
        }
      />
    );
  }

  const lessons = sortLessons(courseLessons);
  const completed = new Set(enrollment.completedLessons ?? []);
  const progress = enrollmentProgress(enrollment, lessons.length || undefined);
  const nextLesson = lessons.find((l) => !completed.has(l._id));
  const teacher = typeof course.teacher === 'object' ? course.teacher : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
        <Link href="/student/courses" className="hover:text-foreground">
          Kurslarim
        </Link>{' '}
        / {course.title}
      </nav>

      <section className="overflow-hidden rounded-[22px] border border-border bg-card sm:flex">
        <CourseCover course={course} index={0} className="h-36 sm:h-auto sm:w-56 sm:shrink-0" />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <h1 className="font-heading text-xl font-semibold wrap-break-word sm:text-2xl">
              {course.title}
            </h1>
            {teacher?.name && <p className="mt-1 text-sm text-muted-foreground">{teacher.name}</p>}
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={
                enrollment.isCompleted
                  ? 'h-2 rounded-full bg-success'
                  : 'h-2 rounded-full bg-primary'
              }
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {progress.done}/{lessons.length} dars · {progress.percent}%
            </span>
            {nextLesson ? (
              <Button render={<Link href={`/student/lessons/${nextLesson._id}`} />}>
                {progress.done > 0 ? 'Davom ettirish' : 'Boshlash'}{' '}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              lessons.length > 0 && (
                <span className="font-semibold text-success">Kurs tugatilgan ✓</span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-border bg-card p-4">
        <h2 className="px-1 pb-3 text-lg font-bold">Darslar</h2>
        {lessons.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Bu kursda hali darslar yo&apos;q</p>
        ) : (
          <CourseLessonsList
            lessons={lessons}
            completed={completed}
            currentLessonId={nextLesson?._id}
          />
        )}
      </section>
    </div>
  );
}
