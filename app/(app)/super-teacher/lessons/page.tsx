'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Copy, Dumbbell, Pencil, Play, Plus, Presentation, Search, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { DebouncedSearch } from '@/components/ui/debounced-search';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LessonBackdrop } from '@/components/board-lesson/slide-view';
import { useBoardLessons, useDeleteBoardLesson, useDuplicateBoardLesson } from '@/hooks/use-board-lessons';
import { useAuthStore } from '@/store/auth-store';
import { lessonTheme } from '@/lib/board-lesson';
import { toServerUrl } from '@/lib/live-quiz';
import { formatDate } from '@/lib/format';
import type { BoardLessonSummary } from '@/types/board-lesson';

const PAGE_SIZE = 12;

function LessonCard({
  lesson,
  onDelete,
  onDuplicate,
  duplicating,
}: {
  lesson: BoardLessonSummary;
  onDelete: (lesson: BoardLessonSummary) => void;
  onDuplicate: (lesson: BoardLessonSummary) => void;
  duplicating: boolean;
}) {
  const theme = lessonTheme(lesson.theme);
  const cover = toServerUrl(lesson.coverImage);
  const meta = [lesson.subject, lesson.grade ? `${lesson.grade}-sinf` : null].filter(Boolean).join(' · ');
  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-card">
      <LessonBackdrop theme={lesson.theme} className="flex aspect-[16/7] flex-col justify-end gap-1 p-4">
        {cover && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
            <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          </>
        )}
        <span
          className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: theme.accent }}
        >
          <BookOpen className="size-6 text-[#1B1B3A]" />
        </span>
        {meta && <span className="text-sm font-semibold text-white/85">{meta}</span>}
        <span className="line-clamp-2 font-heading text-xl font-bold leading-tight">{lesson.title}</span>
      </LessonBackdrop>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Presentation className="size-3.5" /> {lesson.slideCount} slayd
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="size-3.5" /> {lesson.exerciseCount} mashq
          </span>
          <span>{formatDate(lesson.updatedAt)}</span>
        </p>
        <Button
          size="lg"
          className="mt-auto h-12 w-full text-base"
          disabled={!lesson.slideCount && !lesson.exerciseCount}
          render={<Link href={`/super-teacher/board/lesson/${lesson._id}`} />}
        >
          <Play className="size-5" /> Doskada boshlash
        </Button>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            render={<Link href={`/super-teacher/lessons/${lesson._id}/edit`} />}
          >
            <Pencil /> Tahrirlash
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Nusxalash"
            title="Nusxalash"
            disabled={duplicating}
            onClick={() => onDuplicate(lesson)}
          >
            <Copy className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Darsni o&apos;chirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{lesson.title}&quot; o&apos;chiriladi. Bu amalni bekor qilib bo&apos;lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => onDelete(lesson)}>
                  O&apos;chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function BoardLessonListPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'admin' || role === 'superadmin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, isError, refetch } = useBoardLessons({
    search,
    page,
    limit: PAGE_SIZE,
    all: isAdmin && showAll,
  });
  const deleteLesson = useDeleteBoardLesson();
  const duplicateLesson = useDuplicateBoardLesson();

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const items = data?.items ?? [];
  const isEmpty = !isLoading && !isError && items.length === 0 && !search;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageHeader
        title="Interaktiv dars"
        description="Mavzuni doskada rangli slaydlar bilan tushuntiring, keyin mashq bilan mustahkamlang"
        breadcrumbs={[{ label: 'Super-ustoz', href: '/super-teacher' }, { label: 'Interaktiv dars' }]}
        className="mb-0"
        actions={
          <>
            <Button size="lg" variant="outline" render={<Link href="/super-teacher/lessons/new?ai=1" />}>
              <Sparkles className="size-4 text-primary" /> AI bilan yaratish
            </Button>
            <Button size="lg" render={<Link href="/super-teacher/lessons/new" />}>
              <Plus className="size-4" /> Yangi dars
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title="Hali dars yo'q"
          description="Birinchi darsingizni yarating: mavzu slaydlari va mustahkamlash mashqlari"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" render={<Link href="/super-teacher/lessons/new?ai=1" />}>
                <Sparkles className="size-4 text-primary" /> AI bilan yaratish
              </Button>
              <Button render={<Link href="/super-teacher/lessons/new" />}>
                <Plus className="size-4" /> Yaratish
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DebouncedSearch
              initial={search}
              onSearch={onSearch}
              delay={400}
              placeholder="Mavzu bo'yicha qidirish..."
              label="Darslarni qidirish"
              className="flex-1"
            />
            {isAdmin && (
              <div className="flex items-center gap-2.5">
                <Switch
                  id="lessons-all"
                  checked={showAll}
                  onCheckedChange={(v) => {
                    setShowAll(v);
                    setPage(1);
                  }}
                />
                <Label htmlFor="lessons-all">Barcha o&apos;qituvchilarniki</Label>
              </div>
            )}
          </div>

          {isLoading ? (
            <SkeletonCardGrid />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Hech narsa topilmadi"
              description="Boshqa kalit so'z bilan qayta urinib ko'ring"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((lesson) => (
                <LessonCard
                  key={lesson._id}
                  lesson={lesson}
                  onDelete={(l) => deleteLesson.mutate(l._id)}
                  onDuplicate={(l) =>
                    duplicateLesson.mutate(l._id, {
                      onSuccess: (copy) => router.push(`/super-teacher/lessons/${copy._id}/edit`),
                    })
                  }
                  duplicating={duplicateLesson.isPending && duplicateLesson.variables === lesson._id}
                />
              ))}
            </div>
          )}

          {data && (
            <PaginationBar
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="dars"
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
