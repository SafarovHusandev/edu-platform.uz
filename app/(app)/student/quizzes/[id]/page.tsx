'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Crown,
  Loader2,
  TimerOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { AttemptResultView } from '@/components/quizzes/attempt-result-view';
import { StartQuizDialog } from '@/components/quizzes/start-quiz-dialog';
import {
  isAttemptExpiredError,
  useQuiz,
  useStartAttempt,
  useSubmitAttempt,
  useMyAttempts,
} from '@/hooks/use-quizzes';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDuration, formatTashkentDateTime } from '@/lib/format';
import { QUIZ_MAX_REWARD, PREMIUM_DIAMOND_MULTIPLIER } from '@/lib/gamification';
import type { Attempt, AttemptAnswer } from '@/types';

// Belgilangan javoblar tab sessiyasida saqlanadi (sessionStorage): sahifa yangilansa
// yo'qolmaydi, brauzer/tab yopilganda esa avtomatik tozalanadi
const draftKey = (attemptId: string) => `quiz-draft:${attemptId}`;

interface QuizDraft {
  answers: Record<string, number | string>;
  currentIndex: number;
}

function readDraft(attemptId: string): QuizDraft | null {
  try {
    const raw = window.sessionStorage.getItem(draftKey(attemptId));
    return raw ? (JSON.parse(raw) as QuizDraft) : null;
  } catch {
    return null;
  }
}

function clearDraft(attemptId: string) {
  try {
    window.sessionStorage.removeItem(draftKey(attemptId));
  } catch {
    // saqlash imkoni yo'q (maxfiy rejim) — e'tiborsiz
  }
}

// Urinishga bog'liq barqaror aralashtirish: har bir o'quvchida (urinishda) tartib
// har xil, lekin sahifa yangilansa o'zgarmaydi
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const random = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const OPTION_LETTERS = 'ABCDEFGHIJ';

interface PageProps {
  params: Promise<{ id: string }>;
}

const LIVE_QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Bir javobli',
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq savol',
};

function attemptStatusPill(attempt: Attempt): { label: string; tone: StatusPillTone } {
  if (attempt.status === 'expired') return { label: 'Vaqt tugadi', tone: 'danger' };
  if (attempt.status === 'submitted') return { label: 'Tekshirilmoqda', tone: 'warning' };
  return attempt.passed
    ? { label: `${attempt.scorePercent ?? 0} ball · o'tdi`, tone: 'success' }
    : { label: `${attempt.scorePercent ?? 0} ball`, tone: 'neutral' };
}

export default function TakeQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: quiz, isLoading } = useQuiz(id);
  const {
    data: attemptsData,
    isLoading: attemptsLoading,
    isFetching: attemptsFetching,
  } = useMyAttempts(id);
  const startAttempt = useStartAttempt();
  const submitAttempt = useSubmitAttempt();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.tarif === 'premium';

  const attempts = attemptsData?.attempts;
  const attemptsLeft = attemptsData?.attemptsRemaining ?? 0;

  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  // Topshirilgan urinish: reviewed (yakuniy natija) yoki submitted (tekshiruvda)
  const [finished, setFinished] = useState<Attempt | null>(null);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const autoSubmittedRef = useRef(false);
  const handleSubmitRef = useRef<() => void>(() => {});

  // Serverda tugallanmagan (in_progress) urinish bo'lsa — davom ettirish uchun
  // render vaqtida hisoblanadi (sahifa qayta yuklanganda ham to'g'ri ishlaydi)
  const inProgressFromServer = attempts?.find((a) => a.status === 'in_progress') ?? null;
  const effectiveAttempt =
    finished || expiredMessage ? null : (activeAttempt ?? inProgressFromServer);
  const attemptId = effectiveAttempt?._id ?? null;

  // Urinish ochilganda saqlangan javoblarni bir marta tiklaymiz
  const [restoredFor, setRestoredFor] = useState<string | null>(null);
  if (attemptId && restoredFor !== attemptId) {
    setRestoredFor(attemptId);
    const draft = readDraft(attemptId);
    if (draft) {
      setAnswers(draft.answers ?? {});
      setCurrentIndex(draft.currentIndex ?? 0);
    }
  }

  // Tugagan (topshirilgan / vaqti o'tgan) urinishlarning qolib ketgan yozuvlarini
  // tozalaymiz — masalan, test boshqa qurilmada yakunlangan bo'lsa
  useEffect(() => {
    attempts?.forEach((attempt) => {
      if (attempt.status !== 'in_progress') clearDraft(attempt._id);
    });
  }, [attempts]);

  // Har bir o'zgarishda saqlaymiz
  useEffect(() => {
    if (!attemptId || restoredFor !== attemptId) return;
    try {
      window.sessionStorage.setItem(
        draftKey(attemptId),
        JSON.stringify({ answers, currentIndex } satisfies QuizDraft)
      );
    } catch {
      // saqlash imkoni yo'q — test baribir ishlayveradi
    }
  }, [attemptId, restoredFor, answers, currentIndex]);

  const myTargetGrade = user?.grade?.number
    ? quiz?.targetGrades.find(
        (tg) => tg.number === user.grade!.number && (!tg.letter || tg.letter === user.grade!.letter)
      )
    : undefined;

  // Backend submit paytida aynan shu limit bo'yicha tekshiradi (sinf + tarif
  // hisobga olingan) — taymer undan uzun bo'lsa, urinish "expired" bo'lib qoladi
  const timeLimit =
    myTargetGrade?.effectiveTimeLimit ?? myTargetGrade?.timeLimit ?? quiz?.timeLimit;

  // Taymer: startedAt + timeLimit asosida, vaqt tugaganda avtomatik submit
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

  // Test davomida chiqishni to'sish: sahifani yopish/yangilash — brauzer ogohlantirishi,
  // "Orqaga" tugmasi — tarixga qayta yoziladi va chiqish oynasi ochiladi.
  // Testdan faqat uni yakunlab chiqiladi.
  const inTest = !!effectiveAttempt;
  const [exitOpen, setExitOpen] = useState(false);
  useEffect(() => {
    if (!inTest) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
      setExitOpen(true);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [inTest]);

  if (isLoading || attemptsLoading || !quiz) {
    return <div className="mx-auto h-96 w-full max-w-5xl animate-pulse rounded-[22px] bg-muted" />;
  }

  const questions = quiz.questions ?? [];
  const pastAttempts = (attempts?.filter((a) => a.status !== 'in_progress') ?? []).sort(
    (a, b) => (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0)
  );
  const lastAttempt = pastAttempts[0];
  // Ogohlantirish uchun: oxirgi tekshirilgan urinish natijasi
  const lastReviewed = pastAttempts.find((a) => a.status === 'reviewed' && a.scorePercent != null);

  // my-attempts javobidagi maxAttempts allaqachon shu student uchun to'g'ri
  // hisoblangan (sinfi + tarif chegarasi) — shuni ko'rsatamiz. "Standart tarif"
  // izohini aniqlash uchun esa o'z sinfiga mos targetGrades yozuvi kerak.
  const displayedMaxAttempts = attemptsData?.maxAttempts ?? quiz.maxAttempts;
  const configuredAttempts = myTargetGrade?.maxAttempts ?? quiz.maxAttempts;
  const isCappedByStandardTarif =
    myTargetGrade?.effectiveMaxAttempts != null &&
    myTargetGrade.effectiveMaxAttempts < configuredAttempts;

  function resetForNewAttempt(attempt: Attempt) {
    setActiveAttempt(attempt);
    setAnswers({});
    setCurrentIndex(0);
    setFinished(null);
    setExpiredMessage(null);
  }

  function handleStart() {
    setStartError(null);
    startAttempt.mutate(id, {
      onSuccess: (attempt) => {
        setConfirmOpen(false);
        resetForNewAttempt(attempt);
      },
      onError: (error) => {
        setConfirmOpen(false);
        if (
          error instanceof ApiError &&
          error.message.includes("sinfingiz uchun mo'ljallanmagan")
        ) {
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
          clearDraft(effectiveAttempt._id);
          setActiveAttempt(null);
          setFinished(attempt);
        },
        onError: (error) => {
          if (isAttemptExpiredError(error)) {
            clearDraft(effectiveAttempt._id);
            setActiveAttempt(null);
            setExpiredMessage(error.message);
          }
        },
      }
    );
  }

  // --- Natija (yakuniy yoki tekshiruvda) ---
  if (finished) {
    const canRetry =
      !attemptsFetching && attemptsLeft > 0 && finished.status === 'reviewed' && !finished.passed;
    return (
      <AttemptResultView
        quiz={quiz}
        attempt={finished}
        isPremium={isPremium}
        actions={
          <>
            {canRetry && (
              <Button size="lg" onClick={() => setFinished(null)}>
                Qayta urinish
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              render={<Link href={`/student/quizzes/${id}`} />}
              onClick={() => setFinished(null)}
            >
              Urinishlarim
            </Button>
            <Button
              size="lg"
              variant={canRetry ? 'outline' : 'default'}
              render={<Link href="/student" />}
            >
              Bosh sahifa
            </Button>
          </>
        }
      />
    );
  }

  // --- Vaqt tugadi (backend urinishni bekor qildi) ---
  if (expiredMessage) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <section className="flex flex-col items-center gap-3 rounded-[22px] border border-border bg-card p-7 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
            <TimerOff className="size-8" />
          </span>
          <h1 className="font-heading text-2xl font-semibold">Vaqtingiz tugadi</h1>
          <p className="text-muted-foreground">
            Ajratilgan vaqt ichida yakunlanmagani sababli bu urinish bekor qilindi va urinishlar
            soniga qo&apos;shildi.
          </p>
          <p className="text-xs text-muted-foreground">{expiredMessage}</p>
          {!attemptsFetching && (
            <p className="text-sm">
              {attemptsLeft > 0 ? (
                <>
                  Qolgan urinishlar: <strong>{attemptsLeft}</strong>
                </>
              ) : (
                <strong className="text-destructive">Urinishlar tugadi</strong>
              )}
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2.5">
            <Button size="lg" variant="outline" render={<Link href="/student/quizzes" />}>
              Testlarga qaytish
            </Button>
            {!attemptsFetching && attemptsLeft > 0 && (
              <Button size="lg" onClick={() => setExpiredMessage(null)}>
                Qayta urinish
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  // --- Test yechish (to'liq ekran, sidebar'siz) ---
  if (effectiveAttempt) {
    const mm =
      remainingSec !== null ? String(Math.floor(remainingSec / 60)).padStart(2, '0') : null;
    const ss = remainingSec !== null ? String(remainingSec % 60).padStart(2, '0') : null;

    function isAnswered(questionId: string) {
      const value = answers[questionId];
      return value !== undefined && value !== '';
    }

    // Savollar va variantlar o'quvchiga aralashtirib beriladi (ko'chirmaslik uchun).
    // Javob baribir asl variant indeksi bilan saqlanadi — backend o'zgarmaydi.
    const ordered = seededShuffle(questions, effectiveAttempt._id);
    const answeredCount = ordered.filter((q) => isAnswered(q._id)).length;
    const unansweredCount = ordered.length - answeredCount;
    const safeIndex = Math.min(currentIndex, ordered.length - 1);
    const currentQuestion = ordered[safeIndex];
    const isLastQuestion = safeIndex >= ordered.length - 1;
    const progress = ordered.length > 0 ? ((safeIndex + 1) / ordered.length) * 100 : 0;
    const lowTime = remainingSec !== null && remainingSec <= 60;

    // To'g'ri/Noto'g'ri tartibi saqlanadi; ko'p variantlilar aralashtiriladi va
    // harflar joyiga qarab qayta qo'yiladi (A, B, C...)
    const options: { label: string; text: string; originalIndex: number }[] = currentQuestion
      ? currentQuestion.options?.length
        ? seededShuffle(
            currentQuestion.options.map((option, originalIndex) => ({ ...option, originalIndex })),
            `${effectiveAttempt._id}:${currentQuestion._id}`
          ).map((option, i) => ({ ...option, label: OPTION_LETTERS[i] ?? option.label }))
        : [
            { label: 'A', text: "To'g'ri", originalIndex: 0 },
            { label: 'B', text: "Noto'g'ri", originalIndex: 1 },
          ]
      : [];

    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
            <Button variant="outline" onClick={() => setExitOpen(true)}>
              Chiqish
            </Button>
            <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Testdan chiqib bo&apos;lmaydi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Test boshlangan — taymer to&apos;xtamaydi va urinish hisoblanadi. Chiqish uchun
                    testni yakunlang.{' '}
                    {unansweredCount > 0 ? (
                      <strong className="text-destructive">
                        {unansweredCount} ta savolga hali javob berilmagan.
                      </strong>
                    ) : (
                      'Barcha savollarga javob berdingiz.'
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Testni davom ettirish</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={submitAttempt.isPending}
                    onClick={() => {
                      setExitOpen(false);
                      handleSubmit();
                    }}
                  >
                    Yakunlash va chiqish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="min-w-0 flex-[1_1_200px]">
              <p className="truncate text-[17px] font-bold">{quiz.title}</p>
              <p className="text-[13px] text-muted-foreground">
                {effectiveAttempt.attemptNumber != null &&
                  `${effectiveAttempt.attemptNumber}-urinish · `}
                o&apos;tish balli {quiz.passingScore}
              </p>
            </div>
            {mm !== null && (
              <div
                role="timer"
                aria-label="Qolgan vaqt"
                className={cn(
                  'flex items-center gap-2 rounded-[14px] px-4 py-2.5 font-heading text-xl font-bold tabular-nums',
                  lowTime ? 'bg-destructive-soft text-destructive' : 'bg-primary-soft text-primary'
                )}
              >
                <Clock className="size-5" />
                {mm}:{ss}
              </div>
            )}
          </div>
          <div className="h-1 bg-muted">
            <div className="h-1 bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl items-start gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          {currentQuestion && (
            <section className="flex min-w-0 flex-col gap-5 rounded-[22px] border border-border bg-card p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-heading font-semibold text-muted-foreground">
                  {safeIndex + 1} / {ordered.length}
                </span>
                <StatusPill tone="primary">
                  {LIVE_QUESTION_TYPE_LABELS[currentQuestion.type]} · {currentQuestion.points} ball
                </StatusPill>
              </div>
              <p
                className="select-none whitespace-pre-wrap wrap-break-word text-xl font-semibold leading-snug sm:text-[26px]"
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              >
                {currentQuestion.text}
              </p>

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
                  className="text-base"
                />
              ) : (
                <div
                  className="grid select-none gap-3 sm:grid-cols-2"
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {options.map((option) => {
                    const selected = answers[currentQuestion._id] === option.originalIndex;
                    return (
                      <button
                        key={option.originalIndex}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion._id]: option.originalIndex,
                          }))
                        }
                        className={cn(
                          'flex items-center gap-3.5 rounded-2xl border-2 px-4 py-4 text-left text-base font-semibold transition-colors sm:text-lg',
                          selected
                            ? 'border-primary bg-primary-soft text-primary'
                            : 'border-border bg-card hover:border-primary/40'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-[34px] shrink-0 items-center justify-center rounded-[10px] text-sm font-bold',
                            selected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-secondary-foreground'
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="min-w-0 wrap-break-word">{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 flex justify-between gap-2.5">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={safeIndex === 0}
                >
                  <ArrowLeft className="size-4" /> Oldingi
                </Button>
                {isLastQuestion ? (
                  <Button size="lg" onClick={handleSubmit} disabled={submitAttempt.isPending}>
                    {submitAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
                    Testni yakunlash
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setCurrentIndex((i) => Math.min(ordered.length - 1, i + 1))}
                  >
                    Keyingi savol <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </section>
          )}

          <aside
            aria-label="Savollar"
            className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-border bg-card p-5"
          >
            <span className="font-bold">Savollar</span>
            <div className="grid grid-cols-5 gap-2">
              {ordered.map((question, idx) => {
                const answered = isAnswered(question._id);
                const isCurrent = idx === safeIndex;
                return (
                  <button
                    key={question._id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`${idx + 1}-savol`}
                    aria-current={isCurrent}
                    className={cn(
                      'h-10 rounded-[10px] text-sm font-bold transition-colors',
                      isCurrent
                        ? 'border-2 border-primary bg-card text-primary'
                        : answered
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-secondary-foreground hover:bg-accent'
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-primary" /> Javob berilgan ·{' '}
                {answeredCount}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-border" /> Javobsiz · {unansweredCount}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitAttempt.isPending}
              className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-success bg-success-soft p-3.5 font-bold text-success transition-colors hover:bg-success/15 disabled:opacity-60"
            >
              {submitAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
              Testni yakunlash
            </button>
          </aside>
        </div>
      </div>
    );
  }

  // --- Boshlash ekrani ---
  const maxReward = Math.round(QUIZ_MAX_REWARD * (isPremium ? PREMIUM_DIAMOND_MULTIPLIER : 1));
  const fullTimeLimit = myTargetGrade?.timeLimit ?? quiz.timeLimit;
  const questionCount = questions.length || quiz.questionsCount || 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
        <Link href="/student/quizzes" className="hover:text-foreground">
          Testlar
        </Link>{' '}
        / {quiz.title}
      </nav>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <h1 className="font-heading text-2xl font-semibold wrap-break-word sm:text-[26px]">
              {quiz.title}
            </h1>
            {quiz.description && <p className="mt-2 text-muted-foreground">{quiz.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Savollar', value: questionCount },
              { label: 'Vaqt', value: timeLimit ? `${timeLimit} daq` : 'Cheksiz' },
              { label: "O'tish balli", value: `${quiz.passingScore}%` },
              {
                label: 'Mukofot',
                value: (
                  <span className="flex items-center gap-1">
                    +{maxReward} <DiamondIcon className="size-5" />
                  </span>
                ),
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[18px] border border-border bg-card p-4">
                <p className="text-[13px] font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-heading text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {pastAttempts.length > 0 && (
            <section className="overflow-hidden rounded-[20px] border border-border bg-card">
              <h2 className="border-b border-border px-5 py-4 font-bold">Urinishlarim</h2>
              <ul>
                {pastAttempts.map((attempt) => {
                  const pill = attemptStatusPill(attempt);
                  return (
                    <li key={attempt._id} className="border-b border-muted last:border-0">
                      <Link
                        href={`/student/quizzes/${id}/attempts/${attempt._id}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm transition-colors hover:bg-muted/50"
                      >
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                          <span className="font-bold text-foreground">
                            {attempt.attemptNumber}-urinish
                          </span>
                          {attempt.startedAt && (
                            <span>{formatTashkentDateTime(attempt.startedAt)}</span>
                          )}
                          {attempt.durationSeconds != null && (
                            <span>{formatDuration(attempt.durationSeconds)}</span>
                          )}
                        </span>
                        <StatusPill tone={pill.tone}>
                          {attempt.status === 'expired' && <TimerOff className="size-3.5" />}
                          {pill.label}
                        </StatusPill>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5 lg:sticky lg:top-0">
          <p className="text-[13px] font-semibold text-muted-foreground">Urinishlar</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-bold">{attemptsLeft}</span>
            <span className="text-sm text-muted-foreground">/ {displayedMaxAttempts} qoldi</span>
          </p>

          {startError && (
            <div className="flex items-start gap-2 rounded-xl bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{startError}</p>
            </div>
          )}

          {(quiz.availableFrom || quiz.availableUntil) && (
            <div className="flex items-start gap-1.5 rounded-xl bg-gold-soft px-3 py-2.5 text-xs text-gold-foreground">
              <Clock className="mt-px size-3.5 shrink-0" />
              <span>
                {quiz.availableFrom && `Boshlanishi: ${formatTashkentDateTime(quiz.availableFrom)}`}
                {quiz.availableFrom && quiz.availableUntil && ' — '}
                {quiz.availableUntil && `Tugashi: ${formatTashkentDateTime(quiz.availableUntil)}`}
              </span>
            </div>
          )}

          {attemptsData?.attemptsUsed === 0 && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <DiamondIcon className="mt-0.5 size-3.5 shrink-0" />
              {isPremium
                ? `Premium: maksimal ${maxReward} olmos olishingiz mumkin (natijangizga qarab)`
                : `Bu test uchun maksimal ${maxReward} olmos olishingiz mumkin (natijangizga qarab)`}
            </p>
          )}

          {isCappedByStandardTarif && (
            <Link
              href="/premium"
              className="flex items-start gap-1.5 rounded-xl bg-gold-soft px-3 py-2.5 text-xs text-gold-foreground"
            >
              <Crown className="mt-px size-3.5 shrink-0" />
              <span>
                <strong>Premium</strong> bilan {configuredAttempts} ta urinish
                {fullTimeLimit ? ` va ${fullTimeLimit} daqiqa vaqt` : ''}
              </span>
            </Link>
          )}

          {attemptsLeft > 0 ? (
            <>
              <Button
                size="lg"
                className="h-12 w-full text-base font-bold"
                onClick={() => setConfirmOpen(true)}
                disabled={startAttempt.isPending}
              >
                {startAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
                Testni boshlash
              </Button>
              <StartQuizDialog
                open={confirmOpen}
                onOpenChange={(open) => !startAttempt.isPending && setConfirmOpen(open)}
                title={quiz.title}
                questionCount={questionCount}
                timeLimit={timeLimit}
                attemptsLeft={attemptsLeft}
                maxAttempts={displayedMaxAttempts}
                previousScore={lastReviewed?.scorePercent ?? null}
                pending={startAttempt.isPending}
                onConfirm={handleStart}
              />
              {timeLimit != null && (
                <p className="text-center text-xs text-muted-foreground">
                  Boshlagach taymer to&apos;xtamaydi
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <StatusPill tone="danger">Urinishlar tugadi</StatusPill>
              {lastAttempt?.status === 'expired' && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TimerOff className="size-3.5 shrink-0" /> Oxirgi urinish vaqt tugashi sababli
                  bekor qilindi
                </p>
              )}
              {isCappedByStandardTarif && (
                <p className="text-xs text-muted-foreground">
                  Ko&apos;proq urinish uchun o&apos;qituvchi premium tarifga o&apos;tishi kerak
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
