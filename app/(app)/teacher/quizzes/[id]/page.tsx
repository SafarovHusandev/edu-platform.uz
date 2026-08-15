'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  EyeOff,
  ListChecks,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
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
import {
  formatDate,
  formatDateTime,
  formatTashkentDateTime,
  initials,
  isoToTashkentLocal,
  tashkentLocalToIso,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { getMinQuestions } from '@/lib/quiz-rules';
import type { Question } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
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

export default function TeacherQuizDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
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

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
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
          <Link href="/teacher/quizzes" className="text-sm font-medium text-primary hover:underline">
            Testlarga qaytish
          </Link>
        }
      />
    );
  }

  const creator = typeof quiz.createdBy === 'object' ? quiz.createdBy : null;
  const linkedTitle = linkedCourseData?.course.title ?? linkedLesson?.title;

  const questionCount = quiz.questions?.length ?? 0;
  const minQuestions = getMinQuestions(quiz.grade);
  const canActivate = questionCount >= minQuestions;
  const questionsMissing = Math.max(0, minQuestions - questionCount);

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
    setSettingsOpen(true);
  }

  function handleSettingsSubmit() {
    if (!settingsForm.title.trim()) return;

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
        availableFrom: limitAvailability ? tashkentLocalToIso(settingsForm.availableFrom) : null,
        availableUntil: limitAvailability ? tashkentLocalToIso(settingsForm.availableUntil) : null,
      },
      { onSuccess: () => setSettingsOpen(false) }
    );
  }

  function handleToggleActive() {
    if (!quiz!.isActive && !canActivate) return;
    updateQuiz.mutate({ id, isActive: !quiz!.isActive });
  }

  function handleSubmit(values: QuestionFormValues) {
    if (editingQuestion) {
      updateQuestion.mutate(
        { id: editingQuestion._id, ...values },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      addQuestion.mutate(values, { onSuccess: () => setDialogOpen(false) });
    }
  }

  const stats = [
    { icon: Target, value: `${quiz.passingScore}%`, label: "O'tish balli" },
    { icon: Repeat, value: quiz.maxAttempts, label: 'Urinishlar' },
    { icon: Clock, value: quiz.timeLimit ?? '—', label: 'Daqiqa' },
    { icon: ListChecks, value: quiz.questions?.length ?? 0, label: 'Savollar' },
  ];

  return (
    <div className="mx-auto max-w-300 w-full space-y-6 ">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/teacher/quizzes" />}>Testlar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{quiz.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/teacher/quizzes" />}>
          <ArrowLeft className="size-4" /> Testlarga qaytish
        </Button>
        <Button render={<Link href={`/teacher/quizzes/${id}/results`} />}>
          <BarChart3 className="size-4" /> Natijalar
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="bg-linear-to-br from-primary to-primary/70 p-6 text-primary-foreground sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="cursor-pointer border-white/20 bg-white/15 text-primary-foreground hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                  title={
                    !quiz.isActive && !canActivate
                      ? `Yana ${questionsMissing} ta savol kerak`
                      : undefined
                  }
                  render={
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      disabled={updateQuiz.isPending || (!quiz.isActive && !canActivate)}
                    />
                  }
                >
                  {quiz.isActive ? 'Faol' : 'Nofaol'}
                </Badge>
                {quiz.grade != null && (
                  <Badge
                    variant="secondary"
                    className="border-white/20 bg-white/15 text-primary-foreground"
                  >
                    {quiz.grade}-sinf
                  </Badge>
                )}
              </div>
              <h1 className="font-heading text-2xl font-semibold text-balance sm:text-3xl">
                {quiz.title}
              </h1>
              {quiz.description && <p className="text-primary-foreground/80">{quiz.description}</p>}
            </div>
            <div className="flex shrink-0 gap-1.5">
              {quiz.isActive && (
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="border-white/20 bg-white/15 text-primary-foreground hover:bg-white/25"
                  aria-label="Testni faolsizlantirish"
                  title="Faolsizlantirish"
                  onClick={handleToggleActive}
                  disabled={updateQuiz.isPending}
                >
                  {updateQuiz.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </Button>
              )}
              <Button
                variant="secondary"
                size="icon-sm"
                className="border-white/20 bg-white/15 text-primary-foreground hover:bg-white/25"
                aria-label="Sozlamalarni tahrirlash"
                onClick={openSettings}
              >
                <Pencil className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="border-white/20 bg-white/15 text-primary-foreground hover:bg-white/25"
                      aria-label="Testni o'chirish"
                    />
                  }
                >
                  <Trash2 className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Testni o&apos;chirasizmi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{quiz.title}&quot; testi barcha savollari va urinishlar tarixi bilan
                      birga butunlay o&apos;chiriladi. Bu amalni bekor qilib bo&apos;lmaydi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        deleteQuiz.mutate(id, {
                          onSuccess: () => router.push('/teacher/quizzes'),
                        })
                      }
                    >
                      O&apos;chirish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm"
              >
                <p className="flex items-center justify-center gap-1.5 text-xl font-semibold">
                  <stat.icon className="size-4 text-primary-foreground/70" />
                  {stat.value}
                </p>
                <p className="text-xs text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <CardContent className="space-y-3 py-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Target className="size-4" />
              {TARGET_LABELS[quiz.targetType] ?? quiz.targetType}
              {linkedTitle && <span className="text-foreground">— {linkedTitle}</span>}
            </span>
            {creator && (
              <span className="flex items-center gap-1.5">
                <Avatar size="sm" className="size-5">
                  <AvatarFallback className="text-[10px]">{initials(creator.name)}</AvatarFallback>
                </Avatar>
                {creator.name}
              </span>
            )}
            {quiz.createdAt && (
              <span className="flex items-center gap-1.5" title={formatDateTime(quiz.createdAt)}>
                <Calendar className="size-4" /> {formatDate(quiz.createdAt)}
              </span>
            )}
          </div>

          {(quiz.availableFrom || quiz.availableUntil) && (
            <div className="flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>
                {quiz.availableFrom && `Boshlanishi: ${formatTashkentDateTime(quiz.availableFrom)}`}
                {quiz.availableFrom && quiz.availableUntil && ' — '}
                {quiz.availableUntil && `Tugashi: ${formatTashkentDateTime(quiz.availableUntil)}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {!quiz.isActive && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2.5 text-sm text-gold-foreground">
            <EyeOff className="size-5 shrink-0" />
            Bu test hali e&apos;lon qilinmagan — o&apos;quvchilar uni ko&apos;ra olmaydi va boshlay
            olmaydi.
            {!canActivate && (
              <span className="font-medium"> Yana {questionsMissing} ta savol kerak.</span>
            )}
          </span>
          <Button
            size="sm"
            className="shrink-0"
            onClick={handleToggleActive}
            disabled={updateQuiz.isPending || !canActivate}
            title={!canActivate ? `Yana ${questionsMissing} ta savol kerak` : undefined}
          >
            {updateQuiz.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Megaphone className="size-4" />
            )}
            E&apos;lon qilish
          </Button>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className={'max-w-150! w-full!'}>
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
            <div className="grid grid-cols-3 gap-3">
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
                <label className="text-sm text-muted-foreground">Urinishlar soni</label>
                <Input
                  type="number"
                  min={1}
                  value={settingsForm.maxAttempts}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, maxAttempts: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Vaqt (daqiqa)</label>
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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="size-5" /> Savollar
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingQuestion(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Savol qo&apos;shish
          </Button>
        </div>

        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                canActivate ? 'bg-success' : 'bg-primary'
              )}
              style={{ width: `${Math.min(100, (questionCount / minQuestions) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 font-medium text-foreground">
            {questionCount} / {minQuestions} savol
          </span>
        </div>

        {!quiz.questions || quiz.questions.length === 0 ? (
          <EmptyState icon={ListChecks} title="Hali savollar qo'shilmagan" className="py-12" />
        ) : (
          <div className="space-y-2.5">
            {quiz.questions.map((question, idx) => (
              <Card key={question._id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-3.5 pt-2">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
                      TYPE_BADGE_STYLES[question.type]
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm leading-relaxed font-medium">{question.text}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={cn('border-transparent', TYPE_BADGE_STYLES[question.type])}>
                        {TYPE_LABELS[question.type]}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Sparkles className="size-3" /> {question.points} ball
                      </span>
                    </div>

                    {question.type === 'multiple_choice' &&
                      question.options &&
                      question.options.length > 0 && (
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {question.options.map((option, optIdx) => {
                            const isCorrect = optIdx === question.correctAnswer;
                            return (
                              <div
                                key={option.label}
                                className={cn(
                                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs',
                                  isCorrect
                                    ? 'border-success/40 bg-success/10 font-medium text-success'
                                    : 'border-border text-muted-foreground'
                                )}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="size-3.5 shrink-0" />
                                ) : (
                                  <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-current text-[9px]">
                                    {option.label}
                                  </span>
                                )}
                                <span className="truncate">{option.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {question.type === 'true_false' && (
                      <div className="flex gap-2 text-xs">
                        {[true, false].map((value) => {
                          const isCorrect = question.correctAnswer === value;
                          return (
                            <span
                              key={String(value)}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5',
                                isCorrect
                                  ? 'border-success/40 bg-success/10 font-medium text-success'
                                  : 'border-border text-muted-foreground'
                              )}
                            >
                              {isCorrect && <CheckCircle2 className="size-3.5" />}
                              {value ? "To'g'ri" : "Noto'g'ri"}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'open_ended' && question.sampleAnswer && (
                      <p className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Namuna javob: </span>
                        {question.sampleAnswer}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Tahrirlash"
                      onClick={() => {
                        setEditingQuestion(question);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
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
                          <AlertDialogAction onClick={() => deleteQuestion.mutate(question._id)}>
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

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialQuestion={editingQuestion}
        onSubmit={handleSubmit}
        isPending={addQuestion.isPending || updateQuestion.isPending}
      />
    </div>
  );
}
