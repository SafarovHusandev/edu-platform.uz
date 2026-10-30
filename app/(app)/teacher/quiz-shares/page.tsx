'use client';

import { PageHeader } from '@/components/ui/page-header';
import { QuizSharesPanel } from '@/components/quizzes/quiz-share-dialogs';

export default function QuizSharesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Ulashilgan testlar" />
      <QuizSharesPanel />
    </div>
  );
}
