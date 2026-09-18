'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Hourglass,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { useQuizWithAnswers, useQuizResults } from '@/hooks/use-quizzes';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDuration, formatTashkentDateTime, initials } from '@/lib/format';

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Ko'p tanlovli",
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq savol',
};

export default function TeacherAttemptDetailPage({ params }: PageProps) {
  const { id, attemptId } = use(params);
  const {
    data: quiz,
    isLoading: quizLoading,
    isError: quizError,
    refetch: refetchQuiz,
  } = useQuizWithAnswers(id);
  const {
    data: attempts,
    isLoading: attemptsLoading,
    isError: attemptsError,
    refetch: refetchAttempts,
  } = useQuizResults(id);

  if (quizLoading || attemptsLoading) {
    return <div className="h-96 animate-pulse rounded-md bg-muted" />;
  }

  if (quizError || attemptsError) {
    return (
      <ErrorState
        onRetry={() => {
          refetchQuiz();
          refetchAttempts();
        }}
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        title="Test topilmadi"
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

  const attempt = attempts?.find((a) => a._id === attemptId);

  if (!attempt) {
    return (
      <EmptyState
        title="Urinish topilmadi"
        action={
          <Button variant="outline" render={<Link href={`/teacher/quizzes/${id}/results`} />}>
            Natijalarga qaytish
          </Button>
        }
      />
    );
  }

  const student = typeof attempt.student === 'object' ? attempt.student : null;
  const questions = quiz.questions ?? [];
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.question, a]));
  const isPending = attempt.status === 'submitted';

  const studentId = typeof attempt.student === 'object' ? attempt.student._id : attempt.student;
  const studentAttempts = (attempts ?? [])
    .filter((a) => (typeof a.student === 'object' ? a.student._id : a.student) === studentId)
    .sort((a, b) => (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/teacher/quizzes" />}>Testlar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/teacher/quizzes/${id}`} />}>
              {quiz.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/teacher/quizzes/${id}/results`} />}>
              Natijalar
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{student?.name ?? "O'quvchi"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/teacher/quizzes/${id}/results`} />}
        className="w-fit"
      >
        <ArrowLeft className="size-4" /> Natijalarga qaytish
      </Button>

      <Card className="overflow-hidden rounded-2xl border-border/70 p-0 shadow-xs">
        <div
          className={cn(
            'flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center',
            isPending
              ? 'bg-linear-to-b from-muted/60 to-transparent'
              : attempt.passed
                ? 'bg-linear-to-b from-emerald-500/10 to-transparent'
                : 'bg-linear-to-b from-destructive/10 to-transparent'
          )}
        >
          <Avatar size="xl" className="size-16 shadow-md ring-4 ring-background">
            <AvatarFallback className="text-lg">{initials(student?.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl font-semibold">{student?.name ?? '—'}</h1>
            <p className="text-sm text-muted-foreground">{quiz.title}</p>
          </div>

          <Badge
            className={cn(
              'rounded-full',
              isPending
                ? 'bg-muted text-muted-foreground'
                : attempt.passed
                  ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400'
                  : 'bg-destructive/10 text-destructive ring-1 ring-destructive/20'
            )}
          >
            {isPending ? (
              <>
                <Hourglass className="size-3.5" /> Tekshirilmoqda
              </>
            ) : attempt.passed ? (
              <>
                <Trophy className="size-3.5" /> O&apos;tdi
              </>
            ) : (
              <>
                <XCircle className="size-3.5" /> O&apos;tmadi
              </>
            )}
          </Badge>
        </div>

        <CardContent className="space-y-4 px-6 pb-6">
          {isPending ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Ochiq savollar hali baholanmagan. Yakuniy natijani ko&apos;rish uchun avval
                baholang.
              </p>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/teacher/quizzes/${id}/results?attemptId=${attemptId}`} />}
              >
                Baholash
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 py-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{attempt.scorePercent ?? 0}%</p>
                <p className="text-md text-muted-foreground">Natija</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {attempt.earnedPoints ?? 0}/{attempt.totalPoints ?? 0}
                </p>
                <p className="text-md text-muted-foreground">Ball</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{quiz.passingScore}%</p>
                <p className="text-md text-muted-foreground">O&apos;tish balli</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-md text-muted-foreground">
            {attempt.startedAt && (
              <span>Boshlagan: {formatTashkentDateTime(attempt.startedAt)}</span>
            )}
            {attempt.submittedAt && <span>Topshirgan: {formatDateTime(attempt.submittedAt)}</span>}
            <span>{attempt.attemptNumber}-urinish</span>
            {attempt.durationSeconds != null && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  quiz.timeLimit != null && attempt.durationSeconds > quiz.timeLimit * 60
                    ? 'font-medium text-destructive'
                    : undefined
                )}
              >
                {quiz.timeLimit != null && attempt.durationSeconds > quiz.timeLimit * 60 && (
                  <AlertTriangle className="size-3.5 shrink-0" />
                )}
                Davomiyligi: {formatDuration(attempt.durationSeconds)}
              </span>
            )}
          </div>

          {studentAttempts.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border/60 pt-4">
              <span className="mr-1 text-md font-medium text-muted-foreground">Urinishlar:</span>
              {studentAttempts.map((a, idx) => {
                const isActive = a._id === attemptId;
                return (
                  <Link
                    key={a._id}
                    href={`/teacher/quizzes/${id}/results/${a._id}`}
                    title={
                      a.status === 'submitted'
                        ? `${a.attemptNumber ?? idx + 1}-urinish — tekshirilmoqda`
                        : `${a.attemptNumber ?? idx + 1}-urinish — ${a.scorePercent ?? 0}%`
                    }
                    className={cn(
                      'inline-flex size-8 shrink-0 items-center justify-center  text-md px-10 rounded-md font-semibold transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                        : a.status === 'submitted'
                          ? 'bg-muted text-muted-foreground hover:bg-muted/70'
                          : a.passed
                            ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    )}
                  >
                    {a.attemptNumber ?? idx + 1}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">
          Savollar <span className="text-muted-foreground/70">({questions.length})</span>
        </h2>
        {questions.map((question, idx) => {
          const answer = answerByQuestion.get(question._id);
          const isOpenPending = question.type === 'open_ended' && isPending;
          const isCorrect = !isOpenPending && answer?.isCorrect;
          return (
            <Card
              key={question._id}
              className={cn(
                'overflow-hidden rounded-2xl border-l-4 py-0 shadow-xs',
                isOpenPending
                  ? 'border-l-muted-foreground/30'
                  : isCorrect
                    ? 'border-l-emerald-500'
                    : 'border-l-destructive'
              )}
            >
              <CardContent className="flex items-start gap-3 py-4">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-md font-medium',
                    isOpenPending
                      ? 'bg-muted text-muted-foreground'
                      : isCorrect
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {isOpenPending ? (
                    <Hourglass className="size-4" />
                  ) : isCorrect ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {idx + 1}. {question.text}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-md text-muted-foreground">
                    <Badge variant="outline">{TYPE_LABELS[question.type]}</Badge>
                    {isOpenPending ? (
                      <span className="flex items-center gap-1">
                        <Hourglass className="size-3" /> Tekshirilmoqda
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Sparkles className="size-3" /> {answer?.pointsEarned ?? 0} /{' '}
                        {question.points} ball
                      </span>
                    )}
                  </div>

                  {question.type === 'multiple_choice' && question.options && (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5 text-md">
                      {question.options.map((option, optIdx) => {
                        const isGiven = optIdx === answer?.givenAnswer;
                        const isCorrectOption = optIdx === question.correctAnswer;
                        return (
                          <li
                            key={option.label}
                            className={cn(
                              'rounded-full border px-2.5 py-1',
                              isCorrectOption
                                ? 'border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400'
                                : isGiven
                                  ? 'border-destructive/30 bg-destructive/10 font-medium text-destructive'
                                  : 'border-border/70 text-muted-foreground'
                            )}
                          >
                            {option.label}. {option.text}
                            {isGiven && (
                              <span className="ml-1.5 text-[10px] opacity-80">
                                (o&apos;quvchi javobi)
                              </span>
                            )}
                            {isCorrectOption && !isGiven && (
                              <span className="ml-1.5 text-[10px] opacity-80">
                                (to&apos;g&apos;ri javob)
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {question.type === 'true_false' && (
                    <div className="mt-2.5 flex gap-1.5 text-md">
                      {[true, false].map((value) => {
                        const isGiven = answer?.givenAnswer === value;
                        const isCorrectOption = question.correctAnswer === value;
                        return (
                          <span
                            key={String(value)}
                            className={cn(
                              'rounded-full border px-2.5 py-1',
                              isCorrectOption
                                ? 'border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400'
                                : isGiven
                                  ? 'border-destructive/30 bg-destructive/10 font-medium text-destructive'
                                  : 'border-border/70 text-muted-foreground'
                            )}
                          >
                            {value ? "To'g'ri" : "Noto'g'ri"}
                            {isGiven && (
                              <span className="ml-1 text-[10px] opacity-80">(javob)</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'open_ended' && (
                    <div className="mt-2.5 space-y-1.5">
                      <p className="rounded-lg bg-muted/50 p-2.5 text-md text-muted-foreground">
                        <span className="font-medium text-foreground">O&apos;quvchi javobi: </span>
                        {typeof answer?.givenAnswer === 'string' && answer.givenAnswer
                          ? answer.givenAnswer
                          : '—'}
                      </p>
                      {question.sampleAnswer && (
                        <p className="rounded-lg bg-emerald-500/10 p-2.5 text-md text-muted-foreground">
                          <span className="font-medium text-foreground">Namuna javob: </span>
                          {question.sampleAnswer}
                        </p>
                      )}
                      {answer?.feedback && (
                        <p className="rounded-lg bg-primary/5 p-2.5 text-md text-muted-foreground">
                          <span className="font-medium text-foreground">Sizning izohingiz: </span>
                          {answer.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
