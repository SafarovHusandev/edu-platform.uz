'use client';

import { use } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveQuizEditor } from '@/components/live-quiz/live-quiz-editor';
import { useLiveQuiz } from '@/hooks/use-live-quizzes';
import { ApiError } from '@/lib/api-client';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imported?: string }>;
}

export default function EditLiveQuizPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { imported } = use(searchParams);
  const { data: quiz, isLoading, isError, error, refetch } = useLiveQuiz(id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    );
  }

  if (isError || !quiz) {
    const forbidden = error instanceof ApiError && error.status === 403;
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        className="mx-auto w-full max-w-4xl"
        title={forbidden ? "Ruxsat yo'q" : notFound ? 'Viktorina topilmadi' : undefined}
        description={
          forbidden ? 'Bu viktorinani faqat egasi yoki administrator tahrirlay oladi' : undefined
        }
        onRetry={forbidden || notFound ? undefined : () => refetch()}
      />
    );
  }

  // key: boshqa viktorinaga o'tilganda muharrir holati yangidan boshlanadi
  return <LiveQuizEditor key={quiz._id} quiz={quiz} imported={imported === '1'} />;
}
