'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Crown, Plus, Search, Share2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { ShareQuizDialog } from '@/components/quizzes/quiz-share-dialogs';
import { useDeleteQuiz, useQuizShares, useQuizzesMy } from '@/hooks/use-quizzes';
import { useDismissedBanner } from '@/hooks/use-dismissed-banner';
import { cn } from '@/lib/utils';
import type { Quiz, QuizTargetType } from '@/types';

type StatusFilter = 'all' | 'active' | 'inactive';

const TYPE_LABELS: Record<QuizTargetType, string> = {
  course: 'Kurs',
  lesson: 'Dars',
  standalone: 'Mustaqil',
};

function isQuizCapped(quiz: Quiz) {
  return quiz.targetGrades.some((tg) => {
    const configured = tg.maxAttempts ?? quiz.maxAttempts;
    return tg.effectiveMaxAttempts != null && tg.effectiveMaxAttempts < configured;
  });
}

function quizStatus(quiz: Quiz): { label: string; tone: StatusPillTone } {
  if (!quiz.isActive) return { label: 'Qoralama', tone: 'neutral' };
  const starts = [quiz.availableFrom, ...quiz.targetGrades.map((tg) => tg.availableFrom)]
    .filter((v): v is string => !!v)
    .map((v) => new Date(v).getTime());
  if (starts.length > 0 && Math.min(...starts) > Date.now())
    return { label: 'Rejalashtirilgan', tone: 'warning' };
  return { label: 'Faol', tone: 'success' };
}

function gradesLabel(quiz: Quiz) {
  if (quiz.targetGrades.length === 0) return '—';
  return quiz.targetGrades
    .map((tg) => (tg.letter ? `${tg.number}-${tg.letter}` : `${tg.number}-sinf`))
    .join(', ');
}

function TypeTag({ type }: { type: QuizTargetType }) {
  return (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 text-xs font-semibold',
        type === 'standalone'
          ? 'bg-primary-soft text-primary'
          : 'bg-muted text-secondary-foreground'
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function QuizActions({
  quiz,
  compact,
  onShare,
  onDelete,
}: {
  quiz: Quiz;
  compact?: boolean;
  onShare: (quiz: Quiz) => void;
  onDelete: (quiz: Quiz) => void;
}) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', !compact && 'justify-end')}>
      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/teacher/quizzes/${quiz._id}/results`} />}
      >
        Natijalar
      </Button>
      <Button variant="outline" size="sm" render={<Link href={`/teacher/quizzes/${quiz._id}`} />}>
        Tahrir
      </Button>
      {quiz.targetType === 'standalone' ? (
        <Button
          variant="secondary"
          size="sm"
          className="bg-primary-soft text-primary"
          onClick={() => onShare(quiz)}
        >
          <Share2 className="size-3.5" /> Ulashish
        </Button>
      ) : (
        <span
          title="Faqat mustaqil testlar ulashiladi"
          className="inline-flex h-8 items-center rounded-[10px] bg-muted px-3 text-[13px] font-semibold text-muted-foreground"
        >
          Ulashilmaydi
        </span>
      )}
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
              &quot;{quiz.title}&quot; va uning barcha natijalari o&apos;chiriladi. Bu amalni bekor
              qilib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => onDelete(quiz)}>
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeacherQuizzesPage() {
  const { data, isLoading, isError, refetch } = useQuizzesMy({ page: 1, limit: 100 });
  const deleteQuiz = useDeleteQuiz();
  const { data: pendingIncoming } = useQuizShares('incoming', 'pending');
  const { dismissed: nudgeDismissed, dismiss: dismissNudge } = useDismissedBanner(
    'edu_premium_attempts_nudge'
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sharingQuiz, setSharingQuiz] = useState<Quiz | null>(null);

  const pendingCount = pendingIncoming?.length ?? 0;
  const anyCapped = data?.items.some(isQuizCapped) ?? false;

  const availableGrades = useMemo(() => {
    const grades = new Set<number>();
    for (const quiz of data?.items ?? []) {
      for (const tg of quiz.targetGrades) grades.add(tg.number);
    }
    return Array.from(grades).sort((a, b) => a - b);
  }, [data?.items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.items ?? []).filter((quiz) => {
      if (query && !quiz.title.toLowerCase().includes(query)) return false;
      if (statusFilter === 'active' && !quiz.isActive) return false;
      if (statusFilter === 'inactive' && quiz.isActive) return false;
      if (
        gradeFilter !== 'all' &&
        !quiz.targetGrades.some((tg) => String(tg.number) === gradeFilter)
      )
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

  const actionProps = {
    onShare: setSharingQuiz,
    onDelete: (quiz: Quiz) => deleteQuiz.mutate(quiz._id),
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageHeader
        title="Testlarim"
        className="mb-0"
        actions={
          <Button size="lg" render={<Link href="/teacher/quizzes/new" />}>
            <Plus className="size-4" /> Yangi test
          </Button>
        }
      />

      {pendingCount > 0 && (
        <Link
          href="/teacher/quiz-shares"
          className="flex items-center gap-3 rounded-[18px] border border-primary/30 bg-primary-soft p-4 transition-colors hover:border-primary/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Share2 className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Sizga {pendingCount} ta test ulashildi</span>
            <span className="block text-sm text-muted-foreground">
              Qabul qilsangiz, nusxasi testlaringizga qo&apos;shiladi
            </span>
          </span>
          <span className="text-sm font-semibold text-primary">Ko&apos;rish →</span>
        </Link>
      )}

      {anyCapped && !nudgeDismissed && (
        <div className="flex flex-col items-start gap-3 rounded-[18px] bg-gold-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 size-5 shrink-0 text-gold" />
            <div>
              <p className="font-semibold text-gold-foreground">
                O&apos;quvchilaringiz ko&apos;proq urinishlar
              </p>
              <p className="mt-0.5 text-sm text-gold-foreground/80">
                Ba&apos;zi testlarda rejalashtirgan urinishlaringiz standart tarifda cheklangan.
                Premium bilan darhol to&apos;liq ishlaydi.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={dismissNudge}>
              Keyinroq
            </Button>
            <Button size="sm" render={<Link href="/premium" />}>
              <Crown className="size-4" /> Premium
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Hali test yaratmagansiz"
          action={
            <Button render={<Link href="/teacher/quizzes/new" />}>
              <Plus className="size-4" /> Birinchi testni yaratish
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Test nomi bo'yicha qidirish..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
                items={{ all: 'Barcha holatlar', active: 'Faol', inactive: 'Qoralama' }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Holati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Qoralama</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={gradeFilter}
                onValueChange={(v) => setGradeFilter(v ?? 'all')}
                items={{
                  all: 'Barcha sinflar',
                  ...Object.fromEntries(availableGrades.map((g) => [String(g), `${g}-sinf`])),
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
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
                  size="icon"
                  aria-label="Filtrlarni tozalash"
                  onClick={clearFilters}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

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
            <>
              <div className="hidden overflow-x-auto rounded-[20px] border border-border bg-card md:block">
                <table className="w-full min-w-[820px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
                      <th className="px-5 py-3.5 font-semibold">Test</th>
                      <th className="px-3 py-3.5 font-semibold">Turi</th>
                      <th className="px-3 py-3.5 font-semibold">Sinflar</th>
                      <th className="px-3 py-3.5 font-semibold">Savollar</th>
                      <th className="px-3 py-3.5 font-semibold">Holat</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((quiz) => {
                      const status = quizStatus(quiz);
                      return (
                        <tr key={quiz._id} className="border-t border-muted">
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/teacher/quizzes/${quiz._id}`}
                              className="font-semibold wrap-break-word hover:text-primary"
                            >
                              {quiz.title}
                            </Link>
                            {isQuizCapped(quiz) && (
                              <Link
                                href="/premium"
                                className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gold-foreground"
                              >
                                <Crown className="size-3" /> Urinishlar cheklangan
                              </Link>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            <TypeTag type={quiz.targetType} />
                          </td>
                          <td className="px-3 py-3.5">{gradesLabel(quiz)}</td>
                          <td className="px-3 py-3.5 tabular-nums">
                            {quiz.questionsCount ?? quiz.questions?.length ?? '—'}
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill tone={status.tone}>{status.label}</StatusPill>
                          </td>
                          <td className="px-5 py-3.5">
                            <QuizActions quiz={quiz} {...actionProps} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                {filteredItems.map((quiz) => {
                  const status = quizStatus(quiz);
                  return (
                    <div
                      key={quiz._id}
                      className="flex flex-col gap-2.5 rounded-[18px] border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/teacher/quizzes/${quiz._id}`}
                          className="min-w-0 font-bold wrap-break-word"
                        >
                          {quiz.title}
                        </Link>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                        <TypeTag type={quiz.targetType} />
                        <span>{gradesLabel(quiz)}</span>
                        <span>· {quiz.questionsCount ?? quiz.questions?.length ?? 0} savol</span>
                      </div>
                      <QuizActions quiz={quiz} compact {...actionProps} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <p className="text-[13px] text-muted-foreground">
            Faqat mustaqil (kursga yoki darsga bog&apos;lanmagan) testlarni boshqa o&apos;qituvchiga
            ulashish mumkin.
          </p>
        </>
      )}

      <ShareQuizDialog quiz={sharingQuiz} onOpenChange={(open) => !open && setSharingQuiz(null)} />
    </div>
  );
}
