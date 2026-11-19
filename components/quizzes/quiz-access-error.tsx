'use client';

import Link from 'next/link';
import { ArrowLeft, Lock, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { isWrongGradeError } from '@/hooks/use-quizzes';
import { ApiError } from '@/lib/api-client';

// Testni ochib bo'lmaganda (masalan eski havola orqali boshqa sinf testi — 403)
// sahifa yiqilmasin: sababini ko'rsatib, testlar ro'yxatiga qaytaramiz.
export function QuizAccessError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const backButton = (
    <Button variant="outline" render={<Link href="/student/quizzes" />}>
      <ArrowLeft className="size-4" /> Testlar ro&apos;yxatiga qaytish
    </Button>
  );

  if (isWrongGradeError(error) || (error instanceof ApiError && error.status === 403)) {
    return (
      <EmptyState
        icon={Lock}
        title={error instanceof ApiError ? error.message : 'Bu test sizning sinfingiz uchun emas'}
        description="Faqat o'z sinfingizga mo'ljallangan testlarni yecha olasiz."
        action={backButton}
      />
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <EmptyState icon={SearchX} title="Test topilmadi" action={backButton} />;
  }

  return <ErrorState onRetry={onRetry} />;
}
