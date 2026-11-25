'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, FileText, Pencil } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgSkeletonList,
  TgStat,
  TgStatGrid,
} from '@/components/tg/tg-ui';
import { useCourse, useCourseStats, useUpdateCourse } from '@/hooks/use-courses';
import { useReorderLessons } from '@/hooks/use-lessons';
import { formatNumber, formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram-webapp';
import type { Lesson } from '@/types';

function lessonMeta(lesson: Lesson) {
  const hasVideo = !!lesson.videoUrl || (lesson.videoStatus && lesson.videoStatus !== 'none');
  const hasFiles = (lesson.attachments?.length ?? 0) > 0;
  const parts: string[] = [];
  if (hasVideo) parts.push(lesson.videoStatus === 'processing' ? 'Video (tayyorlanmoqda)' : 'Video');
  if (hasFiles) parts.push('PDF');
  if (parts.length === 0) parts.push('Matn');
  const label = parts.join(' + ');
  return lesson.durationMinutes ? `${label} · ${lesson.durationMinutes} daq` : label;
}

export default function TgCourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const course = useCourse(id);
  const stats = useCourseStats(id);
  const updateCourse = useUpdateCourse();
  const reorder = useReorderLessons(id);

  const data = course.data;
  const lessons = [...(data?.lessons ?? [])].sort((a, b) => a.order - b.order);

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= lessons.length) return;
    const ids = lessons.map((l) => l._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    haptic('selection');
    reorder.mutate(ids);
  }

  if (course.isLoading) {
    return (
      <TgPage>
        <TgSkeletonList count={5} height={64} />
      </TgPage>
    );
  }
  if (course.isError || !data) {
    return (
      <TgPage>
        <TgError onRetry={() => course.refetch()} />
      </TgPage>
    );
  }

  const c = data.course;

  return (
    <TgPage>
      <TgHeader
        eyebrow={`${c.title} · ${lessons.length} dars`}
        title="Darslar"
        action={
          <label className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={!!c.isPublished}
              disabled={updateCourse.isPending}
              onChange={(e) => {
                haptic('light');
                updateCourse.mutate({ id, isPublished: e.target.checked });
              }}
            />
            Nashr
          </label>
        }
      />

      <TgStatGrid cols={2}>
        <TgStat
          label="Yozilganlar"
          value={formatNumber(stats.data?.enrollment.total ?? 0)}
          hint={stats.data ? `${stats.data.enrollment.completed} tugatgan` : undefined}
          loading={stats.isLoading}
        />
        <TgStat
          label="Daromad"
          value={c.price > 0 ? formatPrice(stats.data?.revenue.total ?? 0) : 'Bepul'}
          hint={stats.data?.rating.count ? `★ ${stats.data.rating.avg.toFixed(1)} · ${stats.data.rating.count} baho` : undefined}
          loading={stats.isLoading}
        />
      </TgStatGrid>

      {lessons.length === 0 ? (
        <TgEmpty icon={FileText} title="Hali dars qo'shilmagan" />
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-border bg-card">
          {lessons.map((lesson, index) => (
            <li
              key={lesson._id}
              className="flex items-center gap-2.5 border-t border-border px-3 py-2.5 first:border-t-0"
            >
              <span className="flex flex-col">
                <button
                  type="button"
                  aria-label="Yuqoriga"
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => move(index, -1)}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground disabled:opacity-25"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Pastga"
                  disabled={index === lessons.length - 1 || reorder.isPending}
                  onClick={() => move(index, 1)}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground disabled:opacity-25"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{lesson.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{lessonMeta(lesson)}</span>
              </span>
              <Link
                href={`/teacher/lessons/${lesson._id}`}
                aria-label="Darsni tahrirlash"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground"
              >
                <Pencil className="size-4" />
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="text-center text-[13px] text-muted-foreground">
        Dars qo&apos;shish va video yuklash web versiyada ochiladi.
      </p>

      <TgMainButton text="+ Yangi dars" onClick={() => router.push(`/teacher/courses/${id}`)} />
    </TgPage>
  );
}
