'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  PartyPopper,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useQuiz, useStartAttempt, useSubmitAttempt, useMyAttempts } from '@/hooks/use-quizzes';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDuration, formatTashkentDateTime } from '@/lib/format';
import {
  QUIZ_MAX_REWARD,
  PREMIUM_DIAMOND_MULTIPLIER,
  calculateQuizDiamonds,
} from '@/lib/gamification';
import type { Attempt, AttemptAnswer } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const LIVE_QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Bir javobli',
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq savol',
};

export default function TakeQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: quiz, isLoading } = useQuiz(id);
  const { data: attemptsData, isLoading: attemptsLoading } = useMyAttempts(id);
  const startAttempt = useStartAttempt();
  const submitAttempt = useSubmitAttempt();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.tarif === 'premium';

  const attempts = attemptsData?.attempts;
  const attemptsLeft = attemptsData?.attemptsRemaining ?? 0;

  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<Attempt | null>(null);
  const [pendingReview, setPendingReview] = useState<Attempt | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const autoSubmittedRef = useRef(false);
  const handleSubmitRef = useRef<() => void>(() => {});

  // Serverda tugallanmagan (in_progress) urinish bo'lsa — davom ettirish uchun
  // render vaqtida hisoblanadi (sahifa qayta yuklanganda ham to'g'ri ishlaydi)
  const inProgressFromServer = attempts?.find((a) => a.status === 'in_progress') ?? null;
  const effectiveAttempt = result || pendingReview ? null : (activeAttempt ?? inProgressFromServer);

  const timeLimit = quiz?.timeLimit;

  // Таймер: startedAt + timeLimit asosida, vaqt tugaganda avtomatik submit
  useEffect(() => {
    if (!effectiveAttempt?.startedAt || !timeLimit) return;
    autoSubmittedRef.current = false;
    const deadline = new Date(effectiveAttempt.startedAt).getTime() + timeLimit * 60_000;

    const interval = setInterval(() => {
      const secs = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemainingSec(secs);
      if (secs === 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmitRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [effectiveAttempt?._id, effectiveAttempt?.startedAt, timeLimit]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  if (isLoading || attemptsLoading || !quiz) {
    return <div className="h-96 animate-pulse rounded-md bg-muted" />;
  }

  const questions = quiz.questions ?? [];
  const pastAttempts = attempts?.filter((a) => a.status !== 'in_progress') ?? [];

  // my-attempts javobidagi maxAttempts allaqachon shu student uchun to'g'ri
  // hisoblangan (sinfi + tarif chegarasi) — shuni ko'rsatamiz. "Standart tarif"
  // izohini aniqlash uchun esa o'z sinfiga mos targetGrades yozuvi kerak.
  const myTargetGrade = user?.grade?.number
    ? quiz.targetGrades.find(
        (tg) =>
          tg.number === user.grade!.number && (!tg.letter || tg.letter === user.grade!.letter)
      )
    : undefined;
  const displayedMaxAttempts = attemptsData?.maxAttempts ?? quiz.maxAttempts;
  const configuredAttempts = myTargetGrade?.maxAttempts ?? quiz.maxAttempts;
  const isCappedByStandardTarif =
    myTargetGrade?.effectiveMaxAttempts != null &&
    myTargetGrade.effectiveMaxAttempts < configuredAttempts;

  function handleStart() {
    setStartError(null);
    startAttempt.mutate(id, {
      onSuccess: (attempt) => {
        setActiveAttempt(attempt);
        setAnswers({});
        setCurrentIndex(0);
        setResult(null);
        setPendingReview(null);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.message.includes("sinfingiz uchun mo'ljallanmagan")) {
          setStartError(error.message);
        }
      },
    });
  }

  function handleSubmit() {
    if (!effectiveAttempt) return;
    const payload: AttemptAnswer[] = questions.map((q) => {
      const value = answers[q._id];
      if (q.type === 'true_false') {
        // UI ichida variant indeksi (0="To'g'ri", 1="Noto'g'ri") sifatida saqlanadi,
        // backend esa aynan boolean kutadi
        return { questionId: q._id, givenAnswer: value === 0 };
      }
      return {
        questionId: q._id,
        givenAnswer: value ?? (q.type === 'open_ended' ? '' : -1),
      };
    });
    submitAttempt.mutate(
      { attemptId: effectiveAttempt._id, answers: payload },
      {
        onSuccess: (attempt) => {
          setActiveAttempt(null);
          if (attempt.status === 'reviewed') {
            setResult(attempt);
          } else {
            setPendingReview(attempt);
          }
        },
      }
    );
  }

  if (result) {
    const diamondsEarned = calculateQuizDiamonds(result, isPremium);
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
            <span
              className={cn(
                'flex size-16 items-center justify-center rounded-2xl',
                result.passed ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'
              )}
            >
              {result.passed ? <Trophy className="size-8" /> : <XCircle className="size-8" />}
            </span>
            <h1 className="font-heading text-2xl font-semibold">
              {result.passed ? 'Tabriklaymiz!' : "Afsuski, o'ta olmadingiz"}
            </h1>
            <p className="text-muted-foreground">
              Natijangiz:{' '}
              <span className="font-semibold text-foreground">{result.scorePercent ?? 0}%</span>
              {' · '}O&apos;tish balli: {quiz.passingScore}%
            </p>
            {result.durationSeconds != null && (
              <p className="text-sm text-muted-foreground">
                Testni {formatDuration(result.durationSeconds)}da yakunladingiz
              </p>
            )}
            {diamondsEarned > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-gold/15 px-4 py-2.5 text-gold-foreground">
                <Image src="/diamond.png" alt="" width={32} height={32} className="size-5" />
                <span className="flex items-center gap-1.5 font-semibold">
                  <PartyPopper className="size-4 shrink-0" /> {diamondsEarned} diamond
                  qo&apos;lga kiritdingiz!
                </span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" render={<Link href="/student/quizzes" />}>
                Testlarga qaytish
              </Button>
              {attemptsLeft - 1 > 0 && !result.passed && (
                <Button onClick={() => setResult(null)}>Qayta urinish</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingReview) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Hourglass className="size-8" />
            </span>
            <h1 className="font-heading text-2xl font-semibold">Javoblaringiz qabul qilindi</h1>
            <p className="text-muted-foreground">
              Ochiq savollar ustoz tomonidan tekshirilmoqda. Natija tayyor bo&apos;lganda sizga
              bildirishnoma keladi.
            </p>
            <Button variant="outline" className="mt-4" render={<Link href="/student/quizzes" />}>
              Testlarga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (effectiveAttempt) {
    const mm =
      remainingSec !== null ? String(Math.floor(remainingSec / 60)).padStart(2, '0') : null;
    const ss = remainingSec !== null ? String(remainingSec % 60).padStart(2, '0') : null;

    function isAnswered(questionId: string) {
      const value = answers[questionId];
      return value !== undefined && value !== '';
    }

    const answeredCount = questions.filter((q) => isAnswered(q._id)).length;
    const unansweredCount = questions.length - answeredCount;
    const currentQuestion = questions[Math.min(currentIndex, questions.length - 1)];
    const isLastQuestion = currentIndex >= questions.length - 1;
    const typeLabel = currentQuestion
      ? LIVE_QUESTION_TYPE_LABELS[currentQuestion.type]
      : undefined;

    return (
      <div className="-m-4 flex min-h-[calc(100vh-64px)] flex-col sm:-m-6 lg:-m-8">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-background px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="truncate font-heading text-lg font-bold">{quiz.title}</h1>
            {effectiveAttempt.attemptNumber != null && (
              <span className="shrink-0 text-sm text-muted-foreground">
                {effectiveAttempt.attemptNumber}-urinish
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {remainingSec !== null && (
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums',
                  remainingSec <= 60
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-gold/40 bg-gold/10 text-gold-foreground'
                )}
              >
                <Clock className="size-4" />
                {mm}:{ss}
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitAttempt.isPending}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {submitAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
              Yakunlash
            </Button>
          </div>
        </div>

        <div className="grid flex-1 lg:grid-cols-[1fr_320px]">
          {currentQuestion && (
            <div className="flex flex-col justify-between gap-10 bg-muted/40 p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-sm text-muted-foreground">
                    Savol {currentIndex + 1} / {questions.length}
                  </p>
                  <Badge variant="secondary" className="rounded-full">
                    {typeLabel} · {currentQuestion.points} ball
                  </Badge>
                </div>
                <h2
                  className="select-none text-3xl font-bold tracking-tight sm:text-4xl"
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {currentQuestion.text}
                </h2>
                {currentQuestion.type === 'open_ended' ? (
                  <Textarea
                    value={
                      typeof answers[currentQuestion._id] === 'string'
                        ? (answers[currentQuestion._id] as string)
                        : ''
                    }
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion._id]: e.target.value }))
                    }
                    placeholder="Javobingizni yozing..."
                    rows={6}
                    className="bg-card"
                  />
                ) : (
                  <div
                    className="grid select-none gap-3 sm:grid-cols-2"
                    onCopy={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {(currentQuestion.options?.length
                      ? currentQuestion.options
                      : [
                          { label: 'A', text: "To'g'ri" },
                          { label: 'B', text: "Noto'g'ri" },
                        ]
                    ).map((option, optIdx) => {
                      const selected = answers[currentQuestion._id] === optIdx;
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [currentQuestion._id]: optIdx }))
                          }
                          className={cn(
                            'flex items-center gap-3 rounded-xl border-2 bg-card px-4 py-4 text-left text-base font-medium transition-colors',
                            selected
                              ? 'border-success bg-success/10'
                              : 'border-border hover:border-foreground/30'
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                              selected
                                ? 'bg-success text-success-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {option.label}
                          </span>
                          {option.text}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  className="rounded-full bg-card"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft className="size-4" /> Oldingi
                </Button>
                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitAttempt.isPending}
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    {submitAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
                    Yakunlash
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    Keyingi <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-border/70 bg-card p-6 lg:border-l lg:border-t-0">
            <p className="text-sm font-semibold text-foreground">Savollar</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((question, idx) => {
                const answered = isAnswered(question._id);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={question._id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`${idx + 1}-savol`}
                    aria-current={isCurrent}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                      isCurrent
                        ? 'border-2 border-foreground text-foreground'
                        : answered
                          ? 'bg-success text-success-foreground'
                          : 'border border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-success" /> Javob berilgan ·{' '}
                {answeredCount}
              </p>
              <p className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm border border-border" /> Javobsiz ·{' '}
                {unansweredCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxReward = Math.round(
    QUIZ_MAX_REWARD * (isPremium ? PREMIUM_DIAMOND_MULTIPLIER : 1)
  );
  const fullTimeLimit = myTargetGrade?.timeLimit ?? quiz.timeLimit;

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/student/quizzes" />}>Testlar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{quiz.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-muted-foreground">{quiz.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">Savollar</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {questions.length || quiz.questionsCount || 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">Vaqt</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {quiz.timeLimit ? `${quiz.timeLimit} daq` : 'Cheksiz'}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">O&apos;tish bali</p>
              <p className="mt-1 text-xl font-bold text-foreground">{quiz.passingScore}%</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">Mukofot</p>
              <p className="mt-1 flex items-center gap-1 text-xl font-bold text-foreground">
                +{maxReward}
                <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" />
              </p>
            </div>
          </div>

          {pastAttempts.length > 0 && (
            <Card className="rounded-xl py-0">
              <CardContent className="p-0">
                <h2 className="border-b border-border/70 px-4 py-3 text-sm font-semibold text-foreground">
                  Oldingi urinishlar
                </h2>
                <div>
                  {pastAttempts.map((attempt) => (
                    <Link
                      key={attempt._id}
                      href={`/student/quizzes/${id}/attempts/${attempt._id}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          #{attempt.attemptNumber}
                        </span>
                        {attempt.startedAt && (
                          <span>{formatTashkentDateTime(attempt.startedAt)}</span>
                        )}
                        {attempt.durationSeconds != null && (
                          <span>{formatDuration(attempt.durationSeconds)}</span>
                        )}
                      </div>
                      {attempt.status === 'submitted' ? (
                        <Badge variant="secondary" className="gap-1.5">
                          <Hourglass className="size-3.5" /> Tekshirilmoqda
                        </Badge>
                      ) : (
                        <Badge
                          className={cn(
                            'gap-1.5 rounded-full',
                            attempt.passed
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {attempt.passed ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <XCircle className="size-3.5" />
                          )}
                          {attempt.scorePercent ?? 0}%
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:sticky lg:top-6">
          <CardContent className="space-y-4 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Urinishlar
            </p>
            <p className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-foreground">{attemptsLeft}</span>
              <span className="text-sm text-muted-foreground">
                / {displayedMaxAttempts} qoldi
              </span>
            </p>

            {startError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-left text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{startError}</p>
              </div>
            )}

            {(quiz.availableFrom || quiz.availableUntil) && (
              <div className="flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-foreground">
                <Clock className="size-3.5 shrink-0" />
                <span>
                  {quiz.availableFrom &&
                    `Boshlanishi: ${formatTashkentDateTime(quiz.availableFrom)}`}
                  {quiz.availableFrom && quiz.availableUntil && ' — '}
                  {quiz.availableUntil && `Tugashi: ${formatTashkentDateTime(quiz.availableUntil)}`}
                </span>
              </div>
            )}

            {attemptsData?.attemptsUsed === 0 && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Image
                  src="/diamond.png"
                  alt=""
                  width={32}
                  height={32}
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {isPremium ? (
                  <span className="flex items-start gap-1">
                    <Star className="mt-0.5 size-3.5 shrink-0 text-gold" /> Premium: maksimal{' '}
                    {maxReward} diamond olishingiz mumkin (natijangizga qarab)
                  </span>
                ) : (
                  <>Bu test uchun maksimal {maxReward} diamond olishingiz mumkin (natijangizga qarab)</>
                )}
              </p>
            )}

            {isCappedByStandardTarif && (
              <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2.5 text-xs text-gold-foreground">
                <span className="font-semibold">Premium</span> bilan {configuredAttempts} ta
                urinish{fullTimeLimit ? ` va ${fullTimeLimit} daqiqa vaqt` : ''}
              </div>
            )}

            {attemptsLeft > 0 ? (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleStart}
                  disabled={startAttempt.isPending}
                >
                  {startAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
                  Testni boshlash
                </Button>
                {quiz.timeLimit != null && (
                  <p className="text-center text-xs text-muted-foreground">
                    Boshlagach taymer to&apos;xtamaydi
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Badge variant="destructive">Urinishlar tugadi</Badge>
                {isCappedByStandardTarif && (
                  <p className="text-center text-xs text-muted-foreground">
                    Ko&apos;proq urinish uchun o&apos;qituvchi premium tarifga o&apos;tishi kerak
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
