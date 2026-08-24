'use client';

import Link from 'next/link';
import {
  ClipboardList,
  ChevronRight,
  Target,
  Repeat,
  Clock,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { useQuizzes } from '@/hooks/use-quizzes';
import { formatDate } from '@/lib/format';

export default function StudentQuizzesPage() {
  const { data, isLoading, isError, refetch } = useQuizzes({ page: 1, limit: 50 });

  return (
    <div className="space-y-4">
      <PageHeader title="Testlar" description="Bilimingizni sinab ko'ring" className="mb-3" />

      {isLoading ? (
        <SkeletonList count={5} itemClassName="h-24" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Hozircha testlar mavjud emas" />
      ) : (
        <div className="flex flex-col gap-4">
          {data.items.map((quiz) => (
            <Link key={quiz._id} href={`/student/quizzes/${quiz._id}`} className="block">
              <Card className="overflow-hidden border-border/70 shadow-sm transition-all duration-200 p-0 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                    <ClipboardList className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground sm:text-xl">
                        {quiz.title}
                      </p>
                      {quiz.isActive && (
                        <Badge className="bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" /> Faol
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                      <Badge variant="outline">{quiz.grade ?? 'Umumiy'}-sinf</Badge>
                      <Badge variant="outline">
                        {quiz.questionsCount ?? quiz.questions?.length ?? 0} savol
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Target className="size-3.5" /> O&apos;tish balli: {quiz.passingScore}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="size-3.5" /> {quiz.maxAttempts} urinish
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                      {quiz.createdAt && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="size-3.5" /> {formatDate(quiz.createdAt)}
                        </span>
                      )}
                      {(quiz.availableFrom || quiz.availableUntil) && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5" /> Vaqt oynasi belgilangan
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
