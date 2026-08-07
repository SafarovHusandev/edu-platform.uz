'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Gem,
  Hourglass,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuiz, useMyAttempts } from '@/hooks/use-quizzes';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDuration } from '@/lib/format';
import { calculateQuizDiamonds } from '@/lib/gamification';

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Ko'p tanlovli",
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq savol',
};

export default function QuizAttemptResultPage({ params }: PageProps) {
  const { id, attemptId } = use(params);
  const { data: quiz, isLoading: quizLoading } = useQuiz(id);
  const { data: attemptsData, isLoading: attemptsLoading } = useMyAttempts(id);

  if (quizLoading || attemptsLoading || !quiz) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  const attempt = attemptsData?.attempts.find((a) => a._id === attemptId);

  if (!attempt) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <p className="text-muted-foreground">Urinish topilmadi</p>
        <Button variant="outline" render={<Link href={`/student/quizzes/${id}`} />}>
          Testga qaytish
        </Button>
      </div>
    );
  }

  const questions = quiz.questions ?? [];
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.question, a]));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/student/quizzes/${id}`} />}
        className="w-fit"
      >
        <ArrowLeft className="size-4" /> Testga qaytish
      </Button>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
          {attempt.status === 'submitted' ? (
            <>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Hourglass className="size-6" />
              </span>
              <h1 className="font-heading text-xl font-semibold">{quiz.title}</h1>
              <p className="text-muted-foreground">
                Ochiq savollar ustoz tomonidan tekshirilmoqda. Yakuniy natija tayyor bo&apos;lganda
                bildirishnoma keladi.
              </p>
            </>
          ) : (
            <>
              <span
                className={cn(
                  'flex size-14 items-center justify-center rounded-2xl',
                  attempt.passed
                    ? 'bg-success/15 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {attempt.passed ? <Trophy className="size-6" /> : <XCircle className="size-6" />}
              </span>
              <h1 className="font-heading text-xl font-semibold">{quiz.title}</h1>
              <p className="text-muted-foreground">
                Natija:{' '}
                <span className="font-semibold text-foreground">{attempt.scorePercent ?? 0}%</span>
                {' · '}
                {attempt.earnedPoints ?? 0} / {attempt.totalPoints ?? 0} ball
                {' · '}O&apos;tish balli: {quiz.passingScore}%
              </p>
              <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                {attempt.passed ? "O'tdi" : "O'ta olmadi"}
              </Badge>
              {calculateQuizDiamonds(attempt) > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-gold/15 px-4 py-2.5 text-gold-foreground">
                  <Gem className="size-5 text-gold" />
                  <span className="font-semibold">
                    🎉 {calculateQuizDiamonds(attempt)} diamond qo&apos;lga kiritdingiz!
                  </span>
                </div>
              )}
            </>
          )}
          {attempt.submittedAt && (
            <p className="text-xs text-muted-foreground">
              Topshirilgan: {formatDateTime(attempt.submittedAt)}
              {attempt.durationSeconds != null &&
                ` · Davomiyligi: ${formatDuration(attempt.durationSeconds)}`}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {questions.map((question, idx) => {
          const answer = answerByQuestion.get(question._id);
          const isPendingReview = question.type === 'open_ended' && attempt.status === 'submitted';
          return (
            <Card key={question._id}>
              <CardContent className="flex items-start gap-3 pt-2">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    isPendingReview
                      ? 'bg-muted text-muted-foreground'
                      : answer?.isCorrect
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {isPendingReview ? (
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
                    {isPendingReview ? (
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
                      {question.options.map((option, optIdx) => (
                        <li
                          key={option.label}
                          className={cn(
                            'rounded-md border px-2 py-1',
                            optIdx === answer?.givenAnswer
                              ? answer?.isCorrect
                                ? 'border-success bg-success/10 font-medium text-success'
                                : 'border-destructive bg-destructive/10 font-medium text-destructive'
                              : 'border-transparent text-muted-foreground'
                          )}
                        >
                          {option.label}. {option.text}
                          {optIdx === answer?.givenAnswer && (
                            <span className="ml-1.5 text-[10px]">(sizning javobingiz)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {question.type === 'true_false' && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {[true, false].map((value) => (
                        <span
                          key={String(value)}
                          className={cn(
                            'rounded-md border px-2 py-1',
                            answer?.givenAnswer === value
                              ? answer?.isCorrect
                                ? 'border-success bg-success/10 font-medium text-success'
                                : 'border-destructive bg-destructive/10 font-medium text-destructive'
                              : 'border-border text-muted-foreground'
                          )}
                        >
                          {value ? "To'g'ri" : "Noto'g'ri"}
                        </span>
                      ))}
                    </div>
                  )}

                  {question.type === 'open_ended' && (
                    <div className="mt-2 space-y-1.5">
                      <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Sizning javobingiz: </span>
                        {typeof answer?.givenAnswer === 'string' && answer.givenAnswer
                          ? answer.givenAnswer
                          : '—'}
                      </p>
                      {answer?.feedback && (
                        <p className="rounded-md bg-primary/5 p-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Ustoz izohi: </span>
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
