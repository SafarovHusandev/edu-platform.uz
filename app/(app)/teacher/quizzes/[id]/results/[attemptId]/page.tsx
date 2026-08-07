'use client';

import { use } from 'react';
import Link from 'next/link';
import {
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
  const { data: quiz, isLoading: quizLoading } = useQuizWithAnswers(id);
  const { data: attempts, isLoading: attemptsLoading } = useQuizResults(id);

  if (quizLoading || attemptsLoading || !quiz) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  const attempt = attempts?.find((a) => a._id === attemptId);

  if (!attempt) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <p className="text-muted-foreground">Urinish topilmadi</p>
        <Button variant="outline" render={<Link href={`/teacher/quizzes/${id}/results`} />}>
          Natijalarga qaytish
        </Button>
      </div>
    );
  }

  const student = typeof attempt.student === 'object' ? attempt.student : null;
  const questions = quiz.questions ?? [];
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.question, a]));
  const isPending = attempt.status === 'submitted';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/teacher/quizzes/${id}/results`} />}
        className="w-fit"
      >
        <ArrowLeft className="size-4" /> Natijalarga qaytish
      </Button>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
          <Avatar size="lg" className="size-14">
            <AvatarFallback>{initials(student?.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl font-semibold">{student?.name ?? '—'}</h1>
            <p className="text-sm text-muted-foreground">{quiz.title}</p>
          </div>

          {isPending ? (
            <>
              <Badge variant="secondary">
                <Hourglass className="size-3.5" /> Tekshirilmoqda
              </Badge>
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
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Natija:{' '}
                <span className="font-semibold text-foreground">{attempt.scorePercent ?? 0}%</span>
                {' · '}
                {attempt.earnedPoints ?? 0} / {attempt.totalPoints ?? 0} ball
                {' · '}O&apos;tish balli: {quiz.passingScore}%
              </p>
              <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                {attempt.passed ? (
                  <>
                    <Trophy className="size-3.5" /> O&apos;tdi
                  </>
                ) : (
                  <>
                    <XCircle className="size-3.5" /> O&apos;tmadi
                  </>
                )}
              </Badge>
            </>
          )}
          {attempt.startedAt && (
            <p className="text-xs text-muted-foreground">
              Boshlagan: {formatTashkentDateTime(attempt.startedAt)}
              {attempt.submittedAt && ` · Topshirgan: ${formatDateTime(attempt.submittedAt)}`}
              {' · '}
              {attempt.attemptNumber}-urinish
            </p>
          )}
          {attempt.durationSeconds != null && (
            <p
              className={cn(
                'text-xs',
                quiz.timeLimit != null && attempt.durationSeconds > quiz.timeLimit * 60
                  ? 'font-medium text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              Davomiyligi: {formatDuration(attempt.durationSeconds)}
              {quiz.timeLimit != null &&
                attempt.durationSeconds > quiz.timeLimit * 60 &&
                ' ⚠️ (belgilangan vaqtdan oshgan)'}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {questions.map((question, idx) => {
          const answer = answerByQuestion.get(question._id);
          const isOpenPending = question.type === 'open_ended' && isPending;
          return (
            <Card key={question._id}>
              <CardContent className="flex items-start gap-3 pt-2">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    isOpenPending
                      ? 'bg-muted text-muted-foreground'
                      : answer?.isCorrect
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {isOpenPending ? (
                    <Hourglass className="size-4" />
                  ) : answer?.isCorrect ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {idx + 1}. {question.text}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                    <ul className="mt-2 space-y-1 text-xs">
                      {question.options.map((option, optIdx) => {
                        const isGiven = optIdx === answer?.givenAnswer;
                        const isCorrectOption = optIdx === question.correctAnswer;
                        return (
                          <li
                            key={option.label}
                            className={cn(
                              'rounded-md border px-2 py-1',
                              isCorrectOption
                                ? 'border-success bg-success/10 font-medium text-success'
                                : isGiven
                                  ? 'border-destructive bg-destructive/10 font-medium text-destructive'
                                  : 'border-transparent text-muted-foreground'
                            )}
                          >
                            {option.label}. {option.text}
                            {isGiven && (
                              <span className="ml-1.5 text-[10px]">(o&apos;quvchi javobi)</span>
                            )}
                            {isCorrectOption && !isGiven && (
                              <span className="ml-1.5 text-[10px]">(to&apos;g&apos;ri javob)</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {question.type === 'true_false' && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {[true, false].map((value) => {
                        const isGiven = answer?.givenAnswer === value;
                        const isCorrectOption = question.correctAnswer === value;
                        return (
                          <span
                            key={String(value)}
                            className={cn(
                              'rounded-md border px-2 py-1',
                              isCorrectOption
                                ? 'border-success bg-success/10 font-medium text-success'
                                : isGiven
                                  ? 'border-destructive bg-destructive/10 font-medium text-destructive'
                                  : 'border-border text-muted-foreground'
                            )}
                          >
                            {value ? "To'g'ri" : "Noto'g'ri"}
                            {isGiven && (
                              <span className="ml-1 text-[10px]">(javob)</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'open_ended' && (
                    <div className="mt-2 space-y-1.5">
                      <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">O&apos;quvchi javobi: </span>
                        {typeof answer?.givenAnswer === 'string' && answer.givenAnswer
                          ? answer.givenAnswer
                          : '—'}
                      </p>
                      {question.sampleAnswer && (
                        <p className="rounded-md bg-success/10 p-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Namuna javob: </span>
                          {question.sampleAnswer}
                        </p>
                      )}
                      {answer?.feedback && (
                        <p className="rounded-md bg-primary/5 p-2 text-xs text-muted-foreground">
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
