'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { CourseCover } from '@/components/courses/enrollment-card';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
  tgHeaderActionClass,
} from '@/components/tg/tg-ui';
import { useCourses } from '@/hooks/use-courses';
import { formatNumber, formatPrice } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

const PAGE_SIZE = 20;

function CoursesPage({ page, teacher }: { page: number; teacher: string }) {
  const query = useCourses({ teacher, sort: 'newest', page, limit: PAGE_SIZE });
  if (query.isLoading) return <TgSkeletonList count={3} height={86} />;
  if (query.isError) return <TgError onRetry={() => query.refetch()} />;
  return query.data?.items.map((course, index) => (
    <Link
      key={course._id}
      href={`/tg/teacher/courses/${course._id}`}
      className="flex items-center gap-3 rounded-[18px] border border-border bg-card p-3.5 active:bg-muted"
    >
      <CourseCover
        course={course}
        index={(page - 1) * PAGE_SIZE + index}
        className="size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] p-0 text-sm"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
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
        <TgPill tone={course.isPublished ? 'success' : 'neutral'} className="self-start px-2">
          {course.isPublished ? 'Nashr qilingan' : 'Qoralama'}
        </TgPill>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  ));
}

export default function TgTeacherCoursesPage() {
  const userId = useAuthStore((s) => s.user?._id) ?? '';
  const [pages, setPages] = useState(1);
  const first = useCourses({ teacher: userId, sort: 'newest', page: 1, limit: PAGE_SIZE });
  const last = useCourses({ teacher: userId, sort: 'newest', page: pages, limit: PAGE_SIZE });
  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;

  return (
    <TgPage>
      <TgHeader
        title="Kurslarim"
        action={
          <Link href="/teacher/courses/new" className={tgHeaderActionClass}>
            <Plus className="size-4" /> Kurs
          </Link>
        }
      />

      {first.isLoading ? (
        <TgSkeletonList count={4} height={86} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty
          icon={BookOpen}
          title="Hali kurs yaratmagansiz"
          description="Kurs yaratish va video yuklash web versiyada ochiladi"
        />
      ) : (
        <>
          {Array.from({ length: pages }, (_, i) => (
            <CoursesPage key={i + 1} page={i + 1} teacher={userId} />
          ))}
          {pages < totalPages && last.isSuccess && !last.isPlaceholderData && (
            <TgLoadMore
              onClick={() => setPages((p) => p + 1)}
              shown={Math.min(pages * PAGE_SIZE, total)}
              total={total}
            />
          )}
        </>
      )}

      <TgWebHint>Muqova va narxni kengroq tahrirlash uchun web versiyadan foydalanish qulayroq.</TgWebHint>
    </TgPage>
  );
}
