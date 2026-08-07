'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Gem,
  Hourglass,
  Loader2,
  Repeat,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuiz, useStartAttempt, useSubmitAttempt, useMyAttempts } from '@/hooks/use-quizzes';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDuration, formatTashkentDateTime } from '@/lib/format';
import { QUIZ_MAX_REWARD, calculateQuizDiamonds } from '@/lib/gamification';
import type { Attempt, AttemptAnswer } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TakeQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: quiz, isLoading } = useQuiz(id);
  const { data: attemptsData, isLoading: attemptsLoading } = useMyAttempts(id);
  const startAttempt = useStartAttempt();
  const submitAttempt = useSubmitAttempt();

  const attempts = attemptsData?.attempts;
  const attemptsLeft = attemptsData?.attemptsRemaining ?? 0;

  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [result, setResult] = useState<Attempt | null>(null);
  const [pendingReview, setPendingReview] = useState<Attempt | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

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
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  const questions = quiz.questions ?? [];
  const pastAttempts = attempts?.filter((a) => a.status !== 'in_progress') ?? [];

  function handleStart() {
    startAttempt.mutate(id, {
      onSuccess: (attempt) => {
        setActiveAttempt(attempt);
        setAnswers({});
        setResult(null);
        setPendingReview(null);
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
    const diamondsEarned = calculateQuizDiamonds(result);
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
              <div className="flex items-center gap-2 rounded-xl bg-gold/15 px-4 py-2.5 text-gold-foreground">
                <Gem className="size-5 text-gold" />
                <span className="font-semibold">
                  🎉 {diamondsEarned} diamond qo&apos;lga kiritdingiz!
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
    const mm = remainingSec !== null ? String(Math.floor(remainingSec / 60)).padStart(2, '0') : null;
    const ss = remainingSec !== null ? String(remainingSec % 60).padStart(2, '0') : null;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-semibold">{quiz.title}</h1>
          {remainingSec !== null && (
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums',
                remainingSec <= 60
                  ? 'border-destructive text-destructive'
                  : 'border-border text-muted-foreground'
              )}
            >
              <Clock className="size-4" />
              {mm}:{ss}
            </span>
          )}
        </div>
        {questions.map((question, idx) => (
          <Card key={question._id}>
            <CardContent className="flex flex-col gap-3 pt-2">
              <p className="text-sm font-medium">
                {idx + 1}. {question.text}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({question.points} ball)
                </span>
              </p>
              {question.type === 'open_ended' ? (
                <Textarea
                  value={
                    typeof answers[question._id] === 'string'
                      ? (answers[question._id] as string)
                      : ''
                  }
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [question._id]: e.target.value }))
                  }
                  placeholder="Javobingizni yozing..."
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(question.options?.length
                    ? question.options
                    : [
                        { label: 'A', text: "To'g'ri" },
                        { label: 'B', text: "Noto'g'ri" },
                      ]
                  ).map((option, optIdx) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [question._id]: optIdx }))}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border border-input px-3 py-2.5 text-left text-sm transition-colors',
                        answers[question._id] === optIdx
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                        {option.label}
                      </span>
                      {option.text}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitAttempt.isPending}
        >
          {submitAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
          Yakunlash
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/student/quizzes" />} className="w-fit">
        <ArrowLeft className="size-4" /> Testlarga qaytish
      </Button>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="size-6" />
          </span>
          <h1 className="font-heading text-2xl font-semibold">{quiz.title}</h1>
          {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Target className="size-4" /> O&apos;tish balli: {quiz.passingScore}%
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat className="size-4" /> {attemptsLeft} / {quiz.maxAttempts} urinish qoldi
            </span>
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

          {attemptsData?.attemptsUsed === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gem className="size-3.5 text-gold" />
              Bu test uchun maksimal {QUIZ_MAX_REWARD} diamond olishingiz mumkin (natijangizga
              qarab)
            </p>
          )}

          {attemptsLeft > 0 ? (
            <Button
              size="lg"
              className="mt-4"
              onClick={handleStart}
              disabled={startAttempt.isPending}
            >
              {startAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
              Testni boshlash
            </Button>
          ) : (
            <Badge variant="destructive" className="mt-4">
              Urinishlar tugadi
            </Badge>
          )}
        </CardContent>
      </Card>

      {pastAttempts.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Oldingi urinishlar</h2>
          <div className="space-y-2">
            {pastAttempts.map((attempt) => (
              <Link
                key={attempt._id}
                href={`/student/quizzes/${id}/attempts/${attempt._id}`}
                className="flex flex-col gap-1 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  {attempt.status === 'submitted' ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Hourglass className="size-4" /> Tekshirilmoqda
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {attempt.passed ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground" />
                      )}
                      {attempt.scorePercent ?? 0}%
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : ''}
                    <ChevronRight className="size-4" />
                  </span>
                </div>
                {attempt.startedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatTashkentDateTime(attempt.startedAt)}da boshladingiz
                    {attempt.durationSeconds != null &&
                      ` · ${formatDuration(attempt.durationSeconds)}da tugatdingiz`}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
