'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Trash2,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Crown,
  Search,
  SlidersHorizontal,
  Star,
  Target,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type StatusFilter = 'all' | 'active' | 'inactive';

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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const anyCapped = data?.items.some(isQuizCapped) ?? false;

  const availableGrades = useMemo(() => {
    const grades = new Set<number>();
    for (const quiz of data?.items ?? []) {
      for (const tg of quiz.targetGrades) grades.add(tg.number);
    }
    return Array.from(grades).sort((a, b) => a - b);
  }, [data?.items]);

  const gradeSelectItems = useMemo(
    () => ({
      all: 'Barcha sinflar',
      ...Object.fromEntries(availableGrades.map((grade) => [String(grade), `${grade}-sinf`])),
    }),
    [availableGrades]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.items ?? []).filter((quiz) => {
      if (query && !quiz.title.toLowerCase().includes(query)) return false;
      if (statusFilter === 'active' && !quiz.isActive) return false;
      if (statusFilter === 'inactive' && quiz.isActive) return false;
      if (gradeFilter !== 'all' && !quiz.targetGrades.some((tg) => String(tg.number) === gradeFilter))
        return false;
      return true;
    });
  }, [data?.items, search, statusFilter, gradeFilter]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || gradeFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setGradeFilter('all');
  }

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
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-xs sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Test nomi bo'yicha qidirish..."
                className="h-10 rounded-xl pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
                items={{
                  all: 'Barcha holatlar',
                  active: 'Faol',
                  inactive: 'Nofaol',
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-xl sm:w-40">
                  <SelectValue placeholder="Holati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={gradeFilter}
                onValueChange={(v) => setGradeFilter(v ?? 'all')}
                items={gradeSelectItems}
              >
                <SelectTrigger className="h-10 w-full rounded-xl sm:w-32">
                  <SelectValue placeholder="Sinf" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha sinflar</SelectItem>
                  {availableGrades.map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      {grade}-sinf
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Filtrlarni tozalash"
                  onClick={clearFilters}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} ta test topildi
            </p>
          )}

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Hech narsa topilmadi"
              description="Boshqa kalit so'z yoki filtr bilan qayta urinib ko'ring"
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Filtrlarni tozalash
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map((quiz) => {
                const capped = isQuizCapped(quiz);
                return (
                  <Card
                    key={quiz._id}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 p-0 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                  >
                    <CardContent className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1',
                            quiz.isActive
                              ? 'bg-primary/10 text-primary ring-primary/10'
                              : 'bg-muted text-muted-foreground ring-border/60'
                          )}
                        >
                          <ClipboardList className="size-5" />
                        </span>
                        <Badge
                          className={cn(
                            'shrink-0 rounded-full',
                            quiz.isActive
                              ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          )}
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
                      </div>
    
                      <div className="space-y-1.5">
                        <Link
                          href={`/teacher/quizzes/${quiz._id}`}
                          className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-foreground hover:text-primary hover:underline"
                        >
                          {quiz.title}
                        </Link>
                        {capped && (
                          <Link
                            href="/premium"
                            className="inline-flex w-fit items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-foreground transition-colors hover:bg-gold/20"
                          >
                            <Star className="size-3.5" /> Ko&apos;proq urinish — Premium bilan
                          </Link>
                        )}
                      </div>
    
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList className="size-3.5" />
                          {quiz.questionsCount ?? quiz.questions?.length ?? 0} savol
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Target className="size-3.5" />
                          O&apos;tish balli {quiz.passingScore}%
                        </span>
                        {quiz.createdAt && <span>{formatDate(quiz.createdAt)}</span>}
                      </div>
    
                      {quiz.targetGrades.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {quiz.targetGrades.map((tg, i) => {
                            const label = tg.letter ? `${tg.number}-${tg.letter}` : `${tg.number}-sinf`;
                            const configured = tg.maxAttempts ?? quiz.maxAttempts;
                            const tgCapped =
                              tg.effectiveMaxAttempts != null && tg.effectiveMaxAttempts < configured;
                            return (
                              <span
                                key={i}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                                  tgCapped
                                    ? 'bg-gold/10 text-gold-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {tgCapped && <Crown className="size-3" />}
                                {label}: {tg.effectiveMaxAttempts ?? configured} marta /{' '}
                                {tg.effectiveTimeLimit ?? tg.timeLimit ?? quiz.timeLimit ?? '—'} daq
                              </span>
                            );
                          })}
                        </div>
                      )}
    
                      <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/teacher/quizzes/${quiz._id}/results`} />}
                          className="flex-1 font-medium"
                        >
                          <BarChart3 className="size-4" /> Natijalar
                        </Button>
    
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
