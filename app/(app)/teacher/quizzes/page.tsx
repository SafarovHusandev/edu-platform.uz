'use client';

import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Trash2,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Crown,
  Star,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { useDeleteQuiz, useQuizzesMy } from '@/hooks/use-quizzes';
import { useDismissedBanner } from '@/hooks/use-dismissed-banner';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Quiz } from '@/types';

function isQuizCapped(quiz: Quiz) {
  return quiz.targetGrades.some((tg) => {
    const configured = tg.maxAttempts ?? quiz.maxAttempts;
    return tg.effectiveMaxAttempts != null && tg.effectiveMaxAttempts < configured;
  });
}

export default function TeacherQuizzesPage() {
  const { data, isLoading, isError, refetch } = useQuizzesMy({ page: 1, limit: 100 });
  const deleteQuiz = useDeleteQuiz();
  const { dismissed: nudgeDismissed, dismiss: dismissNudge } = useDismissedBanner(
    'edu_premium_attempts_nudge'
  );

  const anyCapped = data?.items.some(isQuizCapped) ?? false;

  return (
    <div>
      <PageHeader
        title="Testlar"
        description="Testlaringizni yarating va boshqaring"
        actions={
          <Button
            render={<Link href="/teacher/quizzes/new" />}
            className="h-11 text-base font-medium"
          >
            <Plus className="size-4" /> Yangi test
          </Button>
        }
      />

      {anyCapped && !nudgeDismissed && (
        <div className="mb-5 flex flex-col items-start gap-3 rounded-2xl border border-gold/30 bg-linear-to-r from-gold/15 to-transparent p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
              <Target className="size-4.5" />
            </span>
            <div>
              <p className="text-md font-semibold text-gold-foreground">
                O&apos;quvchilaringiz ko&apos;proq urinishlar
              </p>
              <p className="mt-0.5 text-sm text-gold-foreground/80">
                Siz ba&apos;zi testlaringizda bir nechta urinishni rejalashtirgansiz. Premium bilan
                bu darhol faollashadi — hech narsani qayta sozlashning hojati yo&apos;q.
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-fit">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md text-gold-foreground/80 hover:text-gold-foreground"
              onClick={dismissNudge}
            >
              Keyinroq
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-md sm:flex-none"
              render={<Link href="/premium" />}
            >
              <Crown className="size-4" /> Premiumni ko&apos;rish
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-24" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Hali test yaratmagansiz" />
      ) : (
        <div className="space-y-4">
          {data.items.map((quiz) => (
            <Card
              key={quiz._id}
              className="overflow-hidden border-border/70 shadow-sm transition-all duration-200  p-0 hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                  <ClipboardList className="size-5" />
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/teacher/quizzes/${quiz._id}`}
                      className="truncate text-lg font-semibold text-foreground hover:text-primary hover:underline sm:text-xl"
                    >
                      {quiz.title}
                    </Link>
                    <Badge
                      variant={quiz.isActive ? 'default' : 'secondary'}
                      className={
                        quiz.isActive
                          ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {quiz.isActive ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5" /> Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <CircleDashed className="size-3.5" /> Nofaol
                        </span>
                      )}
                    </Badge>
                    {isQuizCapped(quiz) && (
                      <Link
                        href="/premium"
                        className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-foreground transition-colors hover:bg-gold/20"
                      >
                        <Star className="size-3.5" /> Ko&apos;proq urinish — Premium bilan
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:text-base">
                    <Badge variant="outline">
                      {quiz.questionsCount ?? quiz.questions?.length ?? 0} savol
                    </Badge>
                    <span>O&apos;tish balli: {quiz.passingScore}%</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:text-base">
                    {quiz.createdAt && <span>Yaratilgan: {formatDate(quiz.createdAt)}</span>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {quiz.targetGrades.map((tg, i) => {
                      const label = tg.letter ? `${tg.number}-${tg.letter}` : `${tg.number}-sinf`;
                      const configured = tg.maxAttempts ?? quiz.maxAttempts;
                      const capped =
                        tg.effectiveMaxAttempts != null && tg.effectiveMaxAttempts < configured;
                      return (
                        <span
                          key={i}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                            capped
                              ? 'bg-gold/10 text-gold-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {capped && <Crown className="size-3" />}
                          {label}: {tg.effectiveMaxAttempts ?? configured} marta /{' '}
                          {tg.effectiveTimeLimit ?? tg.timeLimit ?? quiz.timeLimit ?? '—'} daq
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/teacher/quizzes/${quiz._id}/results`} />}
                    className="h-10 text-sm font-medium sm:text-base"
                  >
                    <BarChart3 className="size-4" /> Natijalar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="O'chirish"
                          className="h-10 w-10 border border-gray-300 cursor-pointer"
                        />
                      }
                    >
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Testni o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu amalni bekor qilib bo&apos;lmaydi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteQuiz.mutate(quiz._id)}>
                          O&apos;chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
