'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AttemptResultView } from '@/components/quizzes/attempt-result-view';
import { useQuiz, useMyAttempts } from '@/hooks/use-quizzes';
import { useAuthStore } from '@/store/auth-store';

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export default function QuizAttemptResultPage({ params }: PageProps) {
  const { id, attemptId } = use(params);
  const { data: quiz, isLoading: quizLoading } = useQuiz(id);
  const { data: attemptsData, isLoading: attemptsLoading } = useMyAttempts(id);
  const isPremium = useAuthStore((s) => s.user?.tarif === 'premium');

  if (quizLoading || attemptsLoading || !quiz) {
    return <div className="mx-auto h-96 w-full max-w-5xl animate-pulse rounded-[22px] bg-muted" />;
  }

  const attempt = attemptsData?.attempts.find((a) => a._id === attemptId);

  if (!attempt) {
    return (
      <EmptyState
        title="Urinish topilmadi"
        action={
          <Button variant="outline" render={<Link href={`/student/quizzes/${id}`} />}>
            Testga qaytish
          </Button>
        }
      />
    );
  }

  return (
    <AttemptResultView
      quiz={quiz}
      attempt={attempt}
      isPremium={isPremium}
      actions={
        <>
          <Button size="lg" variant="outline" render={<Link href={`/student/quizzes/${id}`} />}>
            Urinishlarim
          </Button>
          <Button size="lg" render={<Link href="/student/quizzes" />}>
            Testlar
          </Button>
        </>
      }
    />
  );
}
