'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { CourseCover } from '@/components/courses/enrollment-card';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
} from '@/components/tg/tg-ui';
import { useCourses } from '@/hooks/use-courses';
import { formatNumber, formatPrice } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

export default function TgTeacherCoursesPage() {
  const userId = useAuthStore((s) => s.user?._id);
  const courses = useCourses({ page: 1, limit: 100 });
  const mine =
    courses.data?.items.filter((course) => {
      const teacherId = typeof course.teacher === 'object' ? course.teacher?._id : course.teacher;
      return teacherId === userId;
    }) ?? [];

  return (
    <TgPage>
      <TgHeader
        title="Kurslarim"
        action={
          <Link
            href="/teacher/courses/new"
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> Kurs
          </Link>
        }
      />

      {courses.isLoading ? (
        <TgSkeletonList count={4} height={84} />
      ) : courses.isError ? (
        <TgError onRetry={() => courses.refetch()} />
      ) : mine.length === 0 ? (
        <TgEmpty icon={BookOpen} title="Hali kurs yaratmagansiz" />
      ) : (
        mine.map((course, index) => (
          <Link
            key={course._id}
            href={`/tg/teacher/courses/${course._id}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 active:bg-muted"
          >
            <CourseCover
              course={course}
              index={index}
              className="size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] p-0 text-lg"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-bold">{course.title}</span>
              <span className="truncate text-[13px] text-muted-foreground">
                {[
                  `${course.lessonsCount ?? 0} dars`,
                  course.isPublished ? `${formatNumber(course.studentsCount ?? 0)} o'quvchi` : null,
                  course.rating ? `★ ${course.rating.toFixed(1)}` : null,
                  course.price > 0 ? formatPrice(course.price) : 'Bepul',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              <TgPill tone={course.isPublished ? 'success' : 'neutral'} className="mt-0.5 self-start">
                {course.isPublished ? 'Nashr qilingan' : 'Qoralama'}
              </TgPill>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))
      )}

      <TgWebHint>Muqova va narxni kengroq tahrirlash uchun web versiyadan foydalanish qulayroq.</TgWebHint>
    </TgPage>
  );
}
