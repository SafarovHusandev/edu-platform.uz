'use client';

import { Suspense, use, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useQuizWithAnswers, useQuizResults, useReviewOpenEnded } from '@/hooks/use-quizzes';
import { formatDateTime, formatDuration, formatTashkentDateTime, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  exportRowsToExcel,
  exportRowsToPdf,
  type ExportColumn,
  type ExportRow,
} from '@/lib/export-results';
import type { Attempt, Question, User } from '@/types';

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'name', label: "O'quvchi" },
  { key: 'grade', label: 'Sinf' },
  { key: 'attempts', label: 'Urinishlar soni' },
  { key: 'score', label: 'Ball (%)' },
  { key: 'status', label: 'Holat' },
  { key: 'startedAt', label: 'Boshlagan vaqti' },
  { key: 'submittedAt', label: 'Yakunlangan vaqti' },
  { key: 'duration', label: 'Davomiyligi' },
];

type SortKey = 'name' | 'grade' | 'score' | 'status' | 'startedAt' | 'submittedAt' | 'duration';
type StatusFilter = 'all' | 'passed' | 'failed' | 'pending';

function attemptStudent(attempt: Attempt): User | null {
  return typeof attempt.student === 'object' ? attempt.student : null;
}

function attemptStudentId(attempt: Attempt): string {
  return typeof attempt.student === 'object' ? attempt.student._id : attempt.student;
}

function statusRank(attempt: Attempt) {
  if (attempt.status === 'submitted') return 0;
  return attempt.passed ? 2 : 1;
}

function toTime(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReviewedAnswerPayload {
  questionId: string;
  pointsEarned: number;
  isCorrect: boolean;
  feedback?: string;
}

interface ReviewDialogProps {
  attempt: Attempt;
  questions: Question[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reviewedAnswers: ReviewedAnswerPayload[]) => void;
}

// `key={attempt._id}` bilan chaqiriladi — shu sababli har safar boshqa
// attempt tanlanganda component qayta mount bo'lib, boshlang'ich qiymatlar
// to'g'ri hisoblanadi (useEffect orqali sinxronlash shart emas).
function ReviewDialog({
  attempt,
  questions,
  isPending,
  onOpenChange,
  onSubmit,
}: ReviewDialogProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const q of questions) {
      const answer = attempt.answers.find((a) => a.question === q._id);
      initial[q._id] = answer?.pointsEarned ?? 0;
    }
    return initial;
  });
  const [isCorrectMap, setIsCorrectMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const q of questions) {
      const answer = attempt.answers.find((a) => a.question === q._id);
      initial[q._id] = answer?.isCorrect ?? false;
    }
    return initial;
  });
  const [feedback, setFeedback] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const q of questions) {
      const answer = attempt.answers.find((a) => a.question === q._id);
      initial[q._id] = answer?.feedback ?? '';
    }
    return initial;
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ochiq savollarni baholash</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {questions.map((question) => {
            const answer = attempt.answers.find((a) => a.question === question._id);
            return (
              <div key={question._id} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{question.text}</p>
                <p className="rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Javob: </span>
                  {(answer?.givenAnswer as string) || 'Javob berilmagan'}
                </p>
                {question.sampleAnswer && (
                  <p className="rounded-md bg-success/10 p-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Namuna javob: </span>
                    {question.sampleAnswer}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`score-${question._id}`} className="text-xs">
                    Ball (max {question.points})
                  </Label>
                  <Input
                    id={`score-${question._id}`}
                    type="number"
                    min={0}
                    max={question.points}
                    className="w-24"
                    value={scores[question._id] ?? 0}
                    onChange={(e) => {
                      const clamped = Math.min(
                        question.points,
                        Math.max(0, Number(e.target.value) || 0)
                      );
                      setScores((prev) => ({ ...prev, [question._id]: clamped }));
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`correct-${question._id}`}
                    checked={isCorrectMap[question._id] ?? false}
                    onCheckedChange={(checked) =>
                      setIsCorrectMap((prev) => ({ ...prev, [question._id]: checked === true }))
                    }
                  />
                  <Label
                    htmlFor={`correct-${question._id}`}
                    className="flex cursor-pointer items-center gap-1.5 font-normal"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-success" /> To&apos;g&apos;ri deb
                    belgilash
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Studentga izoh (ixtiyoriy)</Label>
                  <Textarea
                    rows={2}
                    value={feedback[question._id] ?? ''}
                    onChange={(e) =>
                      setFeedback((prev) => ({ ...prev, [question._id]: e.target.value }))
                    }
                    placeholder="Masalan: Asosiy g'oya bor, lekin ..."
                  />
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              onSubmit(
                questions.map((q) => ({
                  questionId: q._id,
                  pointsEarned: scores[q._id] ?? 0,
                  isCorrect: isCorrectMap[q._id] ?? false,
                  feedback: feedback[q._id]?.trim() || undefined,
                }))
              )
            }
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Baholashni yakunlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortableHeadProps {
  sortKeyValue: SortKey;
  activeKey: SortKey;
  dir: 'asc' | 'desc';
  onToggle: (key: SortKey) => void;
  className?: string;
  children: ReactNode;
}

function SortableHead({
  sortKeyValue,
  activeKey,
  dir,
  onToggle,
  className,
  children,
}: SortableHeadProps) {
  const active = activeKey === sortKeyValue;
  return (
    <TableHead
      className={cn('cursor-pointer select-none', className)}
      onClick={() => onToggle(sortKeyValue)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          dir === 'asc' ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
        )}
      </span>
    </TableHead>
  );
}

function ResultsContent({ quizId }: { quizId: string }) {
  const searchParams = useSearchParams();
  const deepLinkAttemptId = searchParams.get('attemptId');

  const { data: quiz } = useQuizWithAnswers(quizId);
  const { data: attempts, isLoading, isError, refetch } = useQuizResults(quizId);
  const reviewOpenEnded = useReviewOpenEnded(quizId);

  const [manualAttemptId, setManualAttemptId] = useState<string | null>(null);
  const [dismissedDeepLink, setDismissedDeepLink] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EXPORT_COLUMNS.map((column) => [column.key, true]))
  );
  const [isExporting, setIsExporting] = useState(false);

  const activeAttemptId = manualAttemptId ?? (dismissedDeepLink ? null : deepLinkAttemptId);
  const reviewingAttempt = attempts?.find((a) => a._id === activeAttemptId) ?? null;

  function closeReview() {
    setManualAttemptId(null);
    setDismissedDeepLink(true);
  }

  const openEndedQuestions = (quiz?.questions ?? []).filter((q) => q.type === 'open_ended');

  // Bitta o'quvchi bir necha marta urinishi mumkin — jadvalda har bir o'quvchi bitta
  // qatorda ko'rinishi uchun urinishlarni student bo'yicha guruhlaymiz (eng so'nggisi
  // qator uchun namoyish etiladi, qolganlari attempt detail sahifasidagi
  // "Urinishlar" tugmalari orqali ko'riladi).
  const studentGroups = useMemo(() => {
    if (!attempts) return [];
    const map = new Map<string, { student: User | null; attempts: Attempt[] }>();
    for (const attempt of attempts) {
      const studentId = attemptStudentId(attempt);
      const entry = map.get(studentId);
      if (entry) {
        entry.attempts.push(attempt);
        if (!entry.student) entry.student = attemptStudent(attempt);
      } else {
        map.set(studentId, { student: attemptStudent(attempt), attempts: [attempt] });
      }
    }
    return Array.from(map.entries())
      .map(([studentId, { student, attempts: list }]) => {
        const sorted = [...list].sort((a, b) => {
          const at = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const bt = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          return bt - at;
        });
        return {
          studentId,
          student,
          attempts: sorted,
          latest: sorted[0],
          pending: sorted.find((a) => a.status === 'submitted') ?? null,
        };
      })
      .sort((a, b) => (a.student?.name ?? '').localeCompare(b.student?.name ?? '', 'uz'));
  }, [attempts]);

  const availableGrades = useMemo(() => {
    const grades = new Set<number>();
    for (const group of studentGroups) {
      if (group.student?.grade?.number != null) grades.add(group.student.grade.number);
    }
    return Array.from(grades).sort((a, b) => a - b);
  }, [studentGroups]);

  const gradeSelectItems = useMemo(
    () => ({
      all: 'Barcha sinflar',
      ...Object.fromEntries(availableGrades.map((grade) => [String(grade), `${grade}-sinf`])),
    }),
    [availableGrades]
  );

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return studentGroups.filter((group) => {
      if (query && !(group.student?.name ?? '').toLowerCase().includes(query)) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && group.latest.status !== 'submitted') return false;
        if (
          statusFilter === 'passed' &&
          (group.latest.status === 'submitted' || !group.latest.passed)
        )
          return false;
        if (
          statusFilter === 'failed' &&
          (group.latest.status === 'submitted' || group.latest.passed)
        )
          return false;
      }
      if (gradeFilter !== 'all' && String(group.student?.grade?.number ?? '') !== gradeFilter)
        return false;
      return true;
    });
  }, [studentGroups, search, statusFilter, gradeFilter]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || gradeFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setGradeFilter('all');
  }

  const sortedGroups = useMemo(() => {
    const sorted = [...filteredGroups];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = (a.student?.name ?? '').localeCompare(b.student?.name ?? '', 'uz');
          break;
        case 'grade':
          cmp = (a.student?.grade?.number ?? -1) - (b.student?.grade?.number ?? -1);
          break;
        case 'score':
          cmp = (a.latest.scorePercent ?? -1) - (b.latest.scorePercent ?? -1);
          break;
        case 'status':
          cmp = statusRank(a.latest) - statusRank(b.latest);
          break;
        case 'startedAt':
          cmp = toTime(a.latest.startedAt) - toTime(b.latest.startedAt);
          break;
        case 'submittedAt':
          cmp = toTime(a.latest.submittedAt) - toTime(b.latest.submittedAt);
          break;
        case 'duration':
          cmp = (a.latest.durationSeconds ?? -1) - (b.latest.durationSeconds ?? -1);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredGroups, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const exportRows: ExportRow[] = studentGroups.map((group) => ({
    name: group.student?.name ?? '—',
    grade: group.student?.grade?.number
      ? `${group.student.grade.number}-${group.student.grade.letter ?? ''}`
      : '—',
    attempts: group.attempts.length,
    score: group.latest.status === 'submitted' ? '—' : `${group.latest.scorePercent ?? 0}%`,
    status:
      group.latest.status === 'submitted'
        ? 'Tekshirilmoqda'
        : group.latest.passed
          ? "O'tdi"
          : "O'tmadi",
    submittedAt: group.latest.submittedAt ? formatDateTime(group.latest.submittedAt) : '—',
    startedAt: group.latest.startedAt ? formatTashkentDateTime(group.latest.startedAt) : '—',
    duration: formatDuration(group.latest.durationSeconds) ?? '—',
  }));

  const activeExportColumns = EXPORT_COLUMNS.filter((column) => selectedColumns[column.key]);

  async function handleExport() {
    if (activeExportColumns.length === 0) return;
    setIsExporting(true);
    try {
      const filename = `${quiz?.title ?? 'test'} - natijalar`;
      if (exportFormat === 'excel') {
        await exportRowsToExcel(exportRows, activeExportColumns, filename);
      } else {
        await exportRowsToPdf(exportRows, activeExportColumns, filename, quiz?.title);
      }
      toast.success('Fayl yuklab olindi');
      setExportOpen(false);
    } catch {
      toast.error('Yuklab olishda xatolik yuz berdi');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/teacher/quizzes" />}>Testlar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/teacher/quizzes/${quizId}`} />}>
              {quiz?.title ?? 'Test'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Natijalar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/teacher/quizzes/${quizId}`} />}
            className="-ml-2 w-fit"
          >
            <ArrowLeft className="size-4" /> Testga qaytish
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Natijalar</h1>
            <p className="text-muted-foreground">{quiz?.title}</p>
          </div>
          {!!attempts?.length && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" /> {studentGroups.length} o&apos;quvchi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClipboardCheck className="size-4" /> {attempts.length} urinish
              </span>
            </div>
          )}
        </div>
        {!!attempts?.length && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="w-fit  animate-glow"
          >
            <Download className="size-4" /> Yuklab olish
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !attempts || attempts.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Hali hech kim testdan o'tmagan" />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 rounded-md border border-border/70 bg-card p-3 shadow-xs sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="O'quvchi ismi bo'yicha qidirish..."
                className="h-10 rounded-md pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
                items={{
                  all: 'Barcha holatlar',
                  passed: "O'tdi",
                  failed: "O'tmadi",
                  pending: 'Tekshirilmoqda',
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-md sm:w-40">
                  <SelectValue placeholder="Holati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="passed">O&apos;tdi</SelectItem>
                  <SelectItem value="failed">O&apos;tmadi</SelectItem>
                  <SelectItem value="pending">Tekshirilmoqda</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={gradeFilter}
                onValueChange={(v) => setGradeFilter(v ?? 'all')}
                items={gradeSelectItems}
              >
                <SelectTrigger className="h-10 w-full rounded-md sm:w-32">
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
            <p className="mb-3 text-sm text-muted-foreground">
              {sortedGroups.length} ta natija topildi
            </p>
          )}

          {sortedGroups.length === 0 ? (
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
            <div className="overflow-hidden rounded-md border border-border/70 bg-card shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                      sortKeyValue="name"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                      className="pl-4"
                    >
                      O&apos;quvchi
                    </SortableHead>
                    <SortableHead
                      sortKeyValue="grade"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    >
                      Sinf
                    </SortableHead>
                    <SortableHead
                      sortKeyValue="score"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    >
                      Ball
                    </SortableHead>
                    <SortableHead
                      sortKeyValue="status"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    >
                      Holat
                    </SortableHead>
                    <SortableHead
                      sortKeyValue="startedAt"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    >
                      Boshlagan vaqti
                    </SortableHead>
                    <SortableHead
                      sortKeyValue="submittedAt"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    >
                      Yakunlangan vaqti
                    </SortableHead>
                    <SortableHead
                      sortKeyValue="duration"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    >
                      Davomiyligi
                    </SortableHead>
                    <TableHead className="pr-4 text-center">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((group) => {
                    const { latest } = group;
                    const isOverTime =
                      latest.durationSeconds != null &&
                      quiz?.timeLimit != null &&
                      latest.durationSeconds > quiz.timeLimit * 60;
                    const isDeepLinked = group.attempts.some((a) => a._id === deepLinkAttemptId);
                    return (
                      <TableRow
                        key={group.studentId}
                        className={cn(
                          isDeepLinked && 'bg-primary/5',
                          isOverTime && 'bg-destructive/5'
                        )}
                      >
                        <TableCell className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="lg">
                              <AvatarFallback>{initials(group.student?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {group.student?.name ?? '—'}
                              </p>
                              {group.attempts.length > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {group.attempts.length} marta urindi
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">
                          {group.student?.grade?.number
                            ? `${group.student.grade.number}-${group.student.grade.letter ?? ''}`
                            : '—'}
                        </TableCell>
                        <TableCell className="py-3">
                          {latest.status === 'submitted' ? '—' : `${latest.scorePercent ?? 0}%`}
                        </TableCell>
                        <TableCell className="py-3">
                          {latest.status === 'submitted' ? (
                            <Badge variant="secondary">Tekshirilmoqda</Badge>
                          ) : (
                            <Badge
                              className={cn(
                                'rounded-full',
                                latest.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {latest.passed ? (
                                <>
                                  <CheckCircle2 /> O&apos;tdi
                                </>
                              ) : (
                                <>
                                  <XCircle /> O&apos;tmadi
                                </>
                              )}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">
                          {latest.startedAt ? formatTashkentDateTime(latest.startedAt) : '—'}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">
                          {latest.submittedAt ? formatDateTime(latest.submittedAt) : '—'}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              isOverTime && 'font-medium text-destructive'
                            )}
                            title={
                              isOverTime
                                ? 'Belgilangan vaqtdan (timeLimit) oshib ketgan'
                                : undefined
                            }
                          >
                            {isOverTime && <AlertTriangle className="size-3.5 shrink-0" />}
                            {formatDuration(latest.durationSeconds) ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 pr-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <Link href={`/teacher/quizzes/${quizId}/results/${latest._id}`} />
                              }
                            >
                              <Eye className="size-4" /> Ko&apos;rish
                            </Button>
                            {openEndedQuestions.length > 0 && group.pending && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setManualAttemptId(group.pending!._id)}
                              >
                                Baholash
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-lg sm:p-7">
          <DialogHeader>
            <DialogTitle>Natijalarni yuklab olish</DialogTitle>
            <DialogDescription>
              Qaysi ustunlarni va qaysi formatda yuklab olishni tanlang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Ustunlar</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {EXPORT_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`export-col-${column.key}`}
                      checked={selectedColumns[column.key] ?? false}
                      onCheckedChange={(checked) =>
                        setSelectedColumns((prev) => ({ ...prev, [column.key]: checked === true }))
                      }
                    />
                    <Label
                      htmlFor={`export-col-${column.key}`}
                      className="text-sm font-normal text-muted-foreground"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Format</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-md border p-3 text-sm font-medium transition-colors',
                    exportFormat === 'excel'
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <FileSpreadsheet className="size-5" /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-md border p-3 text-sm font-medium transition-colors',
                    exportFormat === 'pdf'
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <FileText className="size-5" /> PDF
                </button>
              </div>
            </div>
          </div>

          <Button
            className="w-full p-2 h-auto"
            onClick={handleExport}
            disabled={activeExportColumns.length === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Yuklab olish
          </Button>
        </DialogContent>
      </Dialog>

      {reviewingAttempt && (
        <ReviewDialog
          key={reviewingAttempt._id}
          attempt={reviewingAttempt}
          questions={openEndedQuestions}
          isPending={reviewOpenEnded.isPending}
          onOpenChange={(open) => !open && closeReview()}
          onSubmit={(reviewedAnswers) =>
            reviewOpenEnded.mutate(
              { attemptId: reviewingAttempt._id, reviewedAnswers },
              {
                onSuccess: closeReview,
              }
            )
          }
        />
      )}
    </div>
  );
}

export default function TeacherQuizResultsPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
      <ResultsContent quizId={id} />
    </Suspense>
  );
}
