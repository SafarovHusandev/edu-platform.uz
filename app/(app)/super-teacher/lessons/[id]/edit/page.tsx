'use client';

import { use } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BoardLessonEditor } from '@/components/board-lesson/board-lesson-editor';
import { useBoardLesson } from '@/hooks/use-board-lessons';
import { ApiError } from '@/lib/api-client';

export default function EditBoardLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: lesson, isLoading, isError, error, refetch } = useBoardLesson(id, { editing: true });

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-56 rounded-[20px]" />
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    );
  }

  if (isError || !lesson) {
    const forbidden = error instanceof ApiError && error.status === 403;
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        className="mx-auto w-full max-w-4xl"
        title={forbidden ? "Ruxsat yo'q" : notFound ? 'Dars topilmadi' : undefined}
        description={forbidden ? 'Bu darsni faqat egasi yoki administrator tahrirlay oladi' : undefined}
        onRetry={forbidden || notFound ? undefined : () => refetch()}
      />
    );
  }

  // key: boshqa darsga o'tilganda muharrir holati yangidan boshlanadi
  return <BoardLessonEditor key={lesson._id} lesson={lesson} />;
}
