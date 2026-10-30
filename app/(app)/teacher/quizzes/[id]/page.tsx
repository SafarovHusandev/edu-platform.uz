'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Copy,
  Crown,
  EyeOff,
  Lightbulb,
  ListChecks,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  QuestionFormDialog,
  type QuestionFormValues,
} from '@/components/quizzes/question-form-dialog';
import { ImportQuestionsDialog } from '@/components/quizzes/import-questions-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  useQuizWithAnswers,
  useAddQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useUpdateQuiz,
  useDeleteQuiz,
} from '@/hooks/use-quizzes';
import { useCourse } from '@/hooks/use-courses';
import { useLesson } from '@/hooks/use-lessons';
import { useDismissedBanner } from '@/hooks/use-dismissed-banner';
import { useAuthStore } from '@/store/auth-store';
import {
  formatDate,
  formatTashkentDateTime,
  isoToTashkentLocal,
  tashkentLocalToIso,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { getMinQuestionsForGrades } from '@/lib/quiz-rules';
import {
  ALL_LETTERS_VALUE,
  TargetGradesEditor,
  type TargetGradeEntry,
} from '@/components/quizzes/target-grades-editor';
import type { Question } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shared?: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Ko'p tanlovli",
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq savol',
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  multiple_choice: 'bg-primary/10 text-primary',
  true_false: 'bg-accent text-accent-foreground',
  open_ended: 'bg-gold/15 text-gold-foreground',
};

const TARGET_LABELS: Record<string, string> = {
  standalone: 'Mustaqil test',
  course: "Kursga bog'liq",
  lesson: "Darsga bog'liq",
};

export default function TeacherQuizDetailPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  // Ulashilgan testni qabul qilgandan so'ng shu sahifaga ?shared=1 bilan
  // yo'naltiriladi — nusxa nofaol va eski sinflar bilan keladi.
  const isSharedCopy = use(searchParams).shared === '1';
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.tarif === 'premium';
  const { dismissed: nudgeDismissed, dismiss: dismissNudge } = useDismissedBanner(
    'edu_premium_attempts_nudge'
  );
  const { data: quiz, isLoading, isError, refetch } = useQuizWithAnswers(id);
  const addQuestion = useAddQuestion(id);
  const updateQuestion = useUpdateQuestion(id);
  const deleteQuestion = useDeleteQuestion(id);
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();

  const { data: linkedCourseData } = useCourse(
    quiz?.targetType === 'course' ? (quiz.targetId ?? undefined) : undefined
  );
  const { data: linkedLesson } = useLesson(
    quiz?.targetType === 'lesson' ? (quiz.targetId ?? undefined) : undefined
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  // Nusxalash uchun: forma shu savol asosida oldindan to'ldiriladi, lekin
  // saqlanganda YANGI savol sifatida (addQuestion) yuboriladi, editingQuestion
  // esa faqat haqiqiy tahrirlashda o'rnatiladi.
  const [duplicateSource, setDuplicateSource] = useState<Question | null>(null);
  const [questionResetSignal, setQuestionResetSignal] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    passingScore: 60,
    maxAttempts: 3,
    timeLimit: 15,
    availableFrom: '',
    availableUntil: '',
  });
  const [limitAvailability, setLimitAvailability] = useState(false);
  const [targetGrades, setTargetGrades] = useState<TargetGradeEntry[]>([]);
  const [targetGradesError, setTargetGradesError] = useState<string | null>(null);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-md bg-muted" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!quiz) {
    return (
      <EmptyState
        title="Test topilmadi"
        description="Bu test o'chirilgan yoki mavjud emas."
        action={
          <Link
            href="/teacher/quizzes"
            className="text-sm font-medium text-primary hover:underline"
          >
            Testlarga qaytish
          </Link>
        }
      />
    );
  }

  const creator = typeof quiz.createdBy === 'object' ? quiz.createdBy : null;
  const linkedTitle = linkedCourseData?.course.title ?? linkedLesson?.title;

  const questionCount = quiz.questions?.length ?? 0;
  const minQuestions = getMinQuestionsForGrades(quiz.targetGrades);
  const canActivate = questionCount >= minQuestions;
  const questionsMissing = Math.max(0, minQuestions - questionCount);

  // Backend standart tarifdagi o'qituvchi uchun urinishlar sonini cheklaydi —
  // effectiveMaxAttempts konfiguratsiya qilingandan kam bo'lsa, shu cheklov ishlagan.
  const hasCappedAttempts = quiz.targetGrades.some((tg) => {
    const configured = tg.maxAttempts ?? quiz.maxAttempts;
    return tg.effectiveMaxAttempts != null && tg.effectiveMaxAttempts < configured;
  });

  function openSettings() {
    setSettingsForm({
      title: quiz!.title,
      description: quiz!.description ?? '',
      passingScore: quiz!.passingScore,
      maxAttempts: quiz!.maxAttempts,
      timeLimit: quiz!.timeLimit ?? 15,
      availableFrom: quiz!.availableFrom ? isoToTashkentLocal(quiz!.availableFrom) : '',
      availableUntil: quiz!.availableUntil ? isoToTashkentLocal(quiz!.availableUntil) : '',
    });
    setLimitAvailability(!!(quiz!.availableFrom || quiz!.availableUntil));
    setTargetGrades(
      quiz!.targetGrades.map((tg) => ({
        number: String(tg.number),
        letter: tg.letter ? tg.letter : ALL_LETTERS_VALUE,
        availableFrom: tg.availableFrom ? isoToTashkentLocal(tg.availableFrom) : '',
        availableUntil: tg.availableUntil ? isoToTashkentLocal(tg.availableUntil) : '',
        maxAttempts: tg.maxAttempts != null ? String(tg.maxAttempts) : '',
        timeLimit: tg.timeLimit != null ? String(tg.timeLimit) : '',
      }))
    );
    setTargetGradesError(null);
    setSettingsOpen(true);
  }

  function handleSettingsSubmit() {
    if (!settingsForm.title.trim()) return;
    if (targetGrades.length === 0) {
      setTargetGradesError("Kamida bitta sinf qo'shing");
      return;
    }
    setTargetGradesError(null);

    if (limitAvailability) {
      if (!settingsForm.availableFrom || !settingsForm.availableUntil) return;
      if (settingsForm.availableUntil <= settingsForm.availableFrom) return;
    }

    updateQuiz.mutate(
      {
        id,
        title: settingsForm.title,
        description: settingsForm.description,
        passingScore: settingsForm.passingScore,
        maxAttempts: settingsForm.maxAttempts,
        timeLimit: settingsForm.timeLimit,
        targetGrades: targetGrades.map((entry) => ({
          number: Number(entry.number),
          letter: entry.letter === ALL_LETTERS_VALUE ? undefined : entry.letter,
          availableFrom: entry.availableFrom ? tashkentLocalToIso(entry.availableFrom) : undefined,
          availableUntil: entry.availableUntil
            ? tashkentLocalToIso(entry.availableUntil)
            : undefined,
          maxAttempts: entry.maxAttempts ? Number(entry.maxAttempts) : undefined,
          timeLimit: entry.timeLimit ? Number(entry.timeLimit) : undefined,
        })),
        availableFrom: limitAvailability ? tashkentLocalToIso(settingsForm.availableFrom) : null,
        availableUntil: limitAvailability ? tashkentLocalToIso(settingsForm.availableUntil) : null,
      },
      {
        onSuccess: () => {
          setSettingsOpen(false);
          if (isSharedCopy) router.replace(`/teacher/quizzes/${id}`);
        },
      }
    );
  }

  function handleToggleActive() {
    if (!quiz!.isActive && !canActivate) return;
    updateQuiz.mutate({ id, isActive: !quiz!.isActive });
  }

  function handleSubmit(values: QuestionFormValues, keepOpen: boolean) {
    if (editingQuestion) {
      updateQuestion.mutate(
        { id: editingQuestion._id, ...values },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      addQuestion.mutate(values, {
        onSuccess: () => {
          if (keepOpen) {
            setDuplicateSource(null);
            setQuestionResetSignal((s) => s + 1);
          } else {
            setDialogOpen(false);
          }
        },
      });
    }
  }

  function handleDuplicateQuestion(question: Question) {
    setEditingQuestion(null);
    setDuplicateSource(question);
    setDialogOpen(true);
  }

  const totalPoints = (quiz.questions ?? []).reduce((sum, q) => sum + (q.points ?? 0), 0);
  const settingRows = [
    { label: "O'tish balli", value: `${quiz.passingScore}%` },
    { label: 'Urinishlar soni', value: quiz.maxAttempts },
    { label: 'Vaqt limiti', value: quiz.timeLimit ? `${quiz.timeLimit} daq` : 'Cheksiz' },
    {
      label: 'Boshlanish',
      value: quiz.availableFrom ? formatTashkentDateTime(quiz.availableFrom) : '—',
    },
    {
      label: 'Tugash',
      value: quiz.availableUntil ? formatTashkentDateTime(quiz.availableUntil) : '—',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
            <Link href="/teacher/quizzes" className="hover:text-foreground">
              Testlarim
            </Link>{' '}
            / {quiz.isActive ? 'Faol test' : 'Qoralama'}
          </nav>
          <h1 className="mt-1 font-heading text-2xl font-semibold wrap-break-word sm:text-[26px]">
            {quiz.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" render={<Link href={`/teacher/quizzes/${id}/results`} />}>
            <BarChart3 className="size-4" /> Natijalar
          </Button>
          {quiz.isActive ? (
            <Button variant="outline" onClick={handleToggleActive} disabled={updateQuiz.isPending}>
              {updateQuiz.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <EyeOff className="size-4" />
              )}
              Faolsizlantirish
            </Button>
          ) : (
            <Button
              onClick={handleToggleActive}
              disabled={updateQuiz.isPending || !canActivate}
              title={!canActivate ? `Yana ${questionsMissing} ta savol kerak` : undefined}
            >
              {updateQuiz.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Megaphone className="size-4" />
              )}
              Faollashtirish
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon" aria-label="Testni o'chirish" />}
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Testni o&apos;chirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{quiz.title}&quot; testi barcha savollari va urinishlar tarixi bilan birga
                  butunlay o&apos;chiriladi. Bu amalni bekor qilib bo&apos;lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    deleteQuiz.mutate(id, { onSuccess: () => router.push('/teacher/quizzes') })
                  }
                >
                  O&apos;chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isSharedCopy && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Bu sizga ulashilgan testning nusxasi</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Test hozircha nofaol va avvalgi o&apos;qituvchining sinflariga biriktirilgan. Avval
                o&apos;z sinfingizni tanlang, so&apos;ng testni faollashtiring.
              </p>
            </div>
          </div>
          <Button size="sm" className="shrink-0" onClick={openSettings}>
            <Pencil className="size-4" /> Sinflarni tanlash
          </Button>
        </div>
      )}

      {!quiz.isActive && !canActivate && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl bg-gold-soft px-4 py-3.5 text-gold-foreground"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <span className="text-[15px]">
            <strong>Faollashtirish uchun kamida {minQuestions} ta savol kerak.</strong> Hozir:{' '}
            {questionCount} ta — yana {questionsMissing} ta qo&apos;shing.
          </span>
        </div>
      )}

      {hasCappedAttempts && !nudgeDismissed && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-gold-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 size-5 shrink-0 text-gold" />
            <p className="text-sm text-gold-foreground">
              <strong>O&apos;quvchilaringiz ko&apos;proq urinishlar.</strong> Ba&apos;zi sinflarda
              belgilagan urinishlaringiz standart tarifda cheklangan — Premium bilan darhol
              to&apos;liq ishlaydi.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={dismissNudge}>
              Keyinroq
            </Button>
            <Button size="sm" render={<Link href="/premium" />}>
              <Crown className="size-4" /> Premium
            </Button>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">1. Asosiy sozlamalar</h2>
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Pencil className="size-3.5" /> Tahrirlash
          </Button>
        </div>
        {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Biriktirish:</span>
          <span className="rounded-md bg-primary-soft px-2.5 py-1 font-semibold text-primary">
            {TARGET_LABELS[quiz.targetType] ?? quiz.targetType}
          </span>
          {linkedTitle && <span className="text-muted-foreground">{linkedTitle}</span>}
          {creator && <span className="text-muted-foreground">· Muallif: {creator.name}</span>}
          {quiz.createdAt && (
            <span className="text-muted-foreground">· {formatDate(quiz.createdAt)}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
          {settingRows.map((row) => (
            <div key={row.label} className="rounded-xl bg-muted/60 px-3.5 py-3">
              <div className="text-[13px] font-medium text-muted-foreground">{row.label}</div>
              <div className="mt-0.5 font-semibold">{row.value}</div>
            </div>
          ))}
        </div>
        <span className="text-[13px] text-muted-foreground">
          Barcha vaqtlar Toshkent vaqti (UTC+5) bo&apos;yicha.
        </span>
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">2. Sinflar</h2>
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Plus className="size-3.5" /> Sinf qo&apos;shish
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Bo&apos;sh maydonlar umumiy sozlamani oladi. Test faqat tanlangan sinflarga
          ko&apos;rinadi.
        </p>
        {quiz.targetGrades.length === 0 ? (
          <p className="text-sm font-semibold text-destructive">Hali sinf tanlanmagan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] text-muted-foreground">
                  <th className="px-3 py-2.5 font-semibold">Sinf</th>
                  <th className="px-3 py-2.5 font-semibold">Boshlanish</th>
                  <th className="px-3 py-2.5 font-semibold">Tugash</th>
                  <th className="px-3 py-2.5 font-semibold">Urinish</th>
                  <th className="px-3 py-2.5 font-semibold">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {quiz.targetGrades.map((tg, i) => {
                  const configuredAttempts = tg.maxAttempts ?? quiz.maxAttempts;
                  const isCapped =
                    tg.effectiveMaxAttempts != null && tg.effectiveMaxAttempts < configuredAttempts;
                  return (
                    <tr key={i} className="border-t border-muted">
                      <td className="px-3 py-2.5">
                        <span className="rounded-lg bg-primary-soft px-3 py-1.5 font-bold text-primary">
                          {tg.letter ? `${tg.number}-${tg.letter}` : `${tg.number}-sinf`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {tg.availableFrom ? formatTashkentDateTime(tg.availableFrom) : 'umumiy'}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {tg.availableUntil ? formatTashkentDateTime(tg.availableUntil) : 'umumiy'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(isCapped && 'font-semibold text-gold-foreground')}>
                          {tg.effectiveMaxAttempts ?? configuredAttempts}
                        </span>
                        {isCapped && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({configuredAttempts} belgilangan)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {tg.effectiveTimeLimit ?? tg.timeLimit ?? quiz.timeLimit ?? '—'} daq
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className={'max-w-150! w-full! max-h-[85vh] overflow-y-auto'}>
          <DialogHeader>
            <DialogTitle>Test sozlamalari</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Test nomi"
              value={settingsForm.title}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Tavsif (ixtiyoriy)"
              value={settingsForm.description}
              onChange={(e) =>
                setSettingsForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm text-muted-foreground">O&apos;tish balli (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsForm.passingScore}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, passingScore: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Umumiy urinishlar soni</label>
                <Input
                  type="number"
                  min={1}
                  value={settingsForm.maxAttempts}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, maxAttempts: Number(e.target.value) }))
                  }
                />
                {!isPremium && settingsForm.maxAttempts > 1 && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-gold-foreground">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                    Ajoyib! Endi bu sonni ishga tushirish uchun Premium kerak bo&apos;ladi —{' '}
                    <Link href="/premium" className="font-medium underline underline-offset-2">
                      batafsil
                    </Link>
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Umumiy vaqt (daqiqa)</label>
                <Input
                  type="number"
                  min={1}
                  value={settingsForm.timeLimit}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, timeLimit: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Sinflar *</label>
              <div className="rounded-lg border border-input p-3">
                <TargetGradesEditor
                  value={targetGrades}
                  onChange={setTargetGrades}
                  isPremium={isPremium}
                />
              </div>
              {targetGradesError && (
                <p className="text-sm font-medium text-destructive">{targetGradesError}</p>
              )}
            </div>
            <div className="space-y-3 rounded-lg border border-input p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-limit-availability"
                  checked={limitAvailability}
                  onCheckedChange={(checked) => setLimitAvailability(checked === true)}
                />
                <Label htmlFor="edit-limit-availability" className="cursor-pointer font-normal">
                  Testni boshlash uchun vaqt oynasi belgilash
                </Label>
              </div>
              {limitAvailability ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Boshlanish vaqti</label>
                      <div className="relative">
                        <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          className="pl-9"
                          value={settingsForm.availableFrom}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({ ...prev, availableFrom: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Tugash vaqti</label>
                      <div className="relative">
                        <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          className="pl-9"
                          value={settingsForm.availableUntil}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({ ...prev, availableUntil: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vaqtlar Toshkent vaqti (GMT+5) bo&apos;yicha kiritiladi
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Belgilanmasa, test istalgan vaqtda boshlanishi mumkin
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSettingsSubmit} disabled={updateQuiz.isPending}>
              {updateQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            3. Savollar · {questionCount} / {minQuestions}
          </h2>
          <span className="text-sm text-muted-foreground">Jami: {totalPoints} ball</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              canActivate ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${Math.min(100, (questionCount / minQuestions) * 100)}%` }}
          />
        </div>

        {!quiz.questions || quiz.questions.length === 0 ? (
          <EmptyState icon={ListChecks} title="Hali savollar qo'shilmagan" className="py-10" />
        ) : (
          <ol className="flex flex-col gap-2">
            {quiz.questions.map((question, idx) => {
              const correctLabel =
                question.type === 'multiple_choice'
                  ? question.options?.find((_, i) => i === question.correctAnswer)
                  : null;
              return (
                <li
                  key={question._id}
                  className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3.5"
                >
                  <span className="mt-0.5 w-7 shrink-0 font-heading text-sm font-semibold text-muted-foreground">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium whitespace-pre-wrap wrap-break-word">
                      {question.text}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {question.type === 'true_false' && (
                        <>
                          To&apos;g&apos;ri javob:{' '}
                          <span className="font-semibold text-success">
                            {question.correctAnswer === true ? "To'g'ri" : "Noto'g'ri"}
                          </span>
                        </>
                      )}
                      {correctLabel && (
                        <>
                          To&apos;g&apos;ri javob:{' '}
                          <span className="font-semibold text-success">
                            {correctLabel.label}. {correctLabel.text}
                          </span>
                        </>
                      )}
                      {question.type === 'open_ended' &&
                        (question.sampleAnswer
                          ? `Namuna: ${question.sampleAnswer}`
                          : 'Ochiq javob')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold',
                      TYPE_BADGE_STYLES[question.type]
                    )}
                  >
                    {TYPE_LABELS[question.type]} · {question.points}
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Tahrirlash"
                      onClick={() => {
                        setEditingQuestion(question);
                        setDuplicateSource(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Nusxalash"
                      title="Nusxalash"
                      onClick={() => handleDuplicateQuestion(question)}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
                      >
                        <Trash2 className="size-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Savolni o&apos;chirasizmi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu amalni bekor qilib bo&apos;lmaydi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => deleteQuestion.mutate(question._id)}
                          >
                            O&apos;chirish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex flex-wrap gap-2.5 pt-1">
          <Button
            onClick={() => {
              setEditingQuestion(null);
              setDuplicateSource(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Savol qo&apos;shish
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Word fayldan yuklash
          </Button>
        </div>
      </section>

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialQuestion={editingQuestion ?? duplicateSource}
        isEditing={!!editingQuestion}
        onSubmit={handleSubmit}
        isPending={addQuestion.isPending || updateQuestion.isPending}
        resetSignal={questionResetSignal}
      />

      <ImportQuestionsDialog quizId={id} open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
