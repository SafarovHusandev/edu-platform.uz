'use client';

import Link from 'next/link';
import { ClipboardList, ChevronRight, Target, Repeat, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { useQuizzes } from '@/hooks/use-quizzes';

export default function StudentQuizzesPage() {
  const { data, isLoading, isError, refetch } = useQuizzes({ page: 1, limit: 50 });

  return (
    <div>
      <PageHeader title="Testlar" description="Bilimingizni sinab ko'ring" />

      {isLoading ? (
        <SkeletonList count={5} itemClassName="h-20" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Hozircha testlar mavjud emas" />
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((quiz) => (
            <Link key={quiz._id} href={`/student/quizzes/${quiz._id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 pt-2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{quiz.title}</p>
                    {quiz.description && (
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {quiz.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="size-3.5" /> O&apos;tish balli: {quiz.passingScore}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="size-3.5" /> {quiz.maxAttempts} urinish
                      </span>
                      {quiz.grade != null && <Badge variant="outline">{quiz.grade}-sinf</Badge>}
                      {quiz.questionsCount !== undefined && (
                        <Badge variant="outline">{quiz.questionsCount} savol</Badge>
                      )}
                      {(quiz.availableFrom || quiz.availableUntil) && (
                        <span className="flex items-center gap-1 text-gold-foreground">
                          <Clock className="size-3.5" /> Vaqt oynasi belgilangan
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
