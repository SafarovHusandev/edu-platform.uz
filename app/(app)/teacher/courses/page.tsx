'use client';

import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import { CourseCover } from '@/components/courses/enrollment-card';
import { useCourses } from '@/hooks/use-courses';
import { useAuthStore } from '@/store/auth-store';
import { formatNumber, formatPrice } from '@/lib/format';

export default function TeacherCoursesPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useCourses({ page: 1, limit: 100 });
  const myCourses =
    data?.items.filter((course) => {
      const teacherId = typeof course.teacher === 'object' ? course.teacher?._id : course.teacher;
      return teacherId === user?._id;
    }) ?? [];
  const publishedCount = myCourses.filter((c) => c.isPublished).length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Kurslarim"
        description={
          myCourses.length > 0
            ? `${myCourses.length} ta kurs · ${publishedCount} tasi nashr qilingan`
            : undefined
        }
        actions={
          <Button size="lg" render={<Link href="/teacher/courses/new" />}>
            <Plus className="size-4" /> Yangi kurs
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : myCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Hali kurs yaratmagansiz"
          action={
            <Button render={<Link href="/teacher/courses/new" />}>
              <Plus className="size-4" /> Birinchi kursni yaratish
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {myCourses.map((course, index) => {
            const category = typeof course.category === 'object' ? course.category?.name : null;
            return (
              <article
                key={course._id}
                className="flex flex-wrap items-center gap-4 rounded-[18px] border border-border bg-card p-4"
              >
                <Link href={`/teacher/courses/${course._id}`} className="shrink-0">
                  <CourseCover
                    course={course}
                    index={index}
                    className="size-14 items-center justify-center overflow-hidden rounded-2xl p-0 text-xl"
                  />
                </Link>
                <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/teacher/courses/${course._id}`}
                      className="text-base font-bold wrap-break-word hover:text-primary"
                    >
                      {course.title}
                    </Link>
                    <StatusPill tone={course.isPublished ? 'success' : 'neutral'}>
                      {course.isPublished ? 'Nashr qilingan' : 'Qoralama'}
                    </StatusPill>
                  </div>
                  <span className="text-[13px] text-muted-foreground">
                    {[
                      category,
                      `${course.lessonsCount ?? 0} dars`,
                      course.price > 0 ? formatPrice(course.price) : 'Bepul',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <div className="flex gap-5 text-[13px] text-muted-foreground">
                  <div>
                    <div className="font-heading text-[15px] font-semibold text-foreground">
                      {formatNumber(course.studentsCount ?? 0)}
                    </div>
                    o&apos;quvchi
                  </div>
                  <div>
                    <div className="font-heading text-[15px] font-semibold text-foreground">
                      {course.rating ? course.rating.toFixed(1) : '—'}
                    </div>
                    reyting
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/teacher/courses/${course._id}`} />}
                >
                  Darslar
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
