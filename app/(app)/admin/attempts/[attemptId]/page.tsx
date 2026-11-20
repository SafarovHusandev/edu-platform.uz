'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useAttempt } from '@/hooks/use-quizzes';
import { ApiError } from '@/lib/api-client';

// Faqat urinish ID'si ma'lum bo'lganda (masalan olmos tarixidan) — urinishni olib,
// testi aniqlangach mavjud natija sahifasiga yo'naltiradi:
// /teacher/quizzes/:quizId/results/:attemptId (admin/superadmin uchun ochiq).
export default function AdminAttemptRedirectPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();
  const { data: attempt, isError, error, refetch } = useAttempt(attemptId);
  const quizId = attempt
    ? typeof attempt.quiz === 'object'
      ? attempt.quiz?._id
      : attempt.quiz
    : undefined;

  useEffect(() => {
    if (quizId) router.replace(`/teacher/quizzes/${quizId}/results/${attemptId}`);
  }, [quizId, attemptId, router]);

  const notFound =
    (isError && error instanceof ApiError && error.status === 404) || (attempt && !quizId);

  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <EmptyState
          icon={SearchX}
          title="Urinish topilmadi"
          description="Urinish yoki uning testi o'chirilgan bo'lishi mumkin."
          action={
            <Button variant="outline" onClick={() => router.back()}>
              Orqaga
            </Button>
          }
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <ErrorState onRetry={() => refetch()} />
        <div className="mt-3 text-center">
          <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
            Foydalanuvchilar ro&apos;yxatiga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return <div className="mx-auto h-96 w-full max-w-5xl animate-pulse rounded-[22px] bg-muted" />;
}
