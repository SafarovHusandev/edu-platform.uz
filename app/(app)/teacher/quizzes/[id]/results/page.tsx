'use client';

import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuizWithAnswers, useQuizResults, useReviewOpenEnded } from '@/hooks/use-quizzes';
import { formatDateTime, formatDuration, formatTashkentDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Attempt, Question } from '@/types';

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
function ReviewDialog({ attempt, questions, isPending, onOpenChange, onSubmit }: ReviewDialogProps) {
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
                  <Label className="text-xs">Ball (max {question.points})</Label>
                  <Input
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
                  <Label htmlFor={`correct-${question._id}`} className="cursor-pointer font-normal">
                    ✅ To&apos;g&apos;ri deb belgilash
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

function ResultsContent({ quizId }: { quizId: string }) {
  const searchParams = useSearchParams();
  const deepLinkAttemptId = searchParams.get('attemptId');

  const { data: quiz } = useQuizWithAnswers(quizId);
  const { data: attempts, isLoading } = useQuizResults(quizId);
  const reviewOpenEnded = useReviewOpenEnded(quizId);

  const [manualAttemptId, setManualAttemptId] = useState<string | null>(null);
  const [dismissedDeepLink, setDismissedDeepLink] = useState(false);

  const activeAttemptId = manualAttemptId ?? (dismissedDeepLink ? null : deepLinkAttemptId);
  const reviewingAttempt = attempts?.find((a) => a._id === activeAttemptId) ?? null;

  function closeReview() {
    setManualAttemptId(null);
    setDismissedDeepLink(true);
  }

  const openEndedQuestions = (quiz?.questions ?? []).filter((q) => q.type === 'open_ended');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href={`/teacher/quizzes/${quizId}`} />}>
          <ArrowLeft className="size-4" /> Testga qaytish
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Natijalar</h1>
        <p className="mt-1 text-muted-foreground">{quiz?.title}</p>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : !attempts || attempts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardCheck className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hali hech kim testdan o&apos;tmagan</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O&apos;quvchi</TableHead>
              <TableHead>Ball</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Boshlagan vaqti</TableHead>
              <TableHead>Davomiyligi</TableHead>
              <TableHead className="text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts?.map((attempt) => {
              const student = typeof attempt.student === 'object' ? attempt.student : null;
              const isOverTime =
                attempt.durationSeconds != null &&
                quiz?.timeLimit != null &&
                attempt.durationSeconds > quiz.timeLimit * 60;
              return (
                <TableRow
                  key={attempt._id}
                  className={cn(
                    attempt._id === deepLinkAttemptId && 'bg-primary/5',
                    isOverTime && 'bg-destructive/5'
                  )}
                >
                  <TableCell>{student?.name ?? '—'}</TableCell>
                  <TableCell>
                    {attempt.status === 'submitted' ? '—' : `${attempt.scorePercent ?? 0}%`}
                  </TableCell>
                  <TableCell>
                    {attempt.status === 'submitted' ? (
                      <Badge variant="secondary">Tekshirilmoqda</Badge>
                    ) : (
                      <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                        {attempt.passed ? (
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
                  <TableCell className="text-muted-foreground">
                    {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {attempt.startedAt ? formatTashkentDateTime(attempt.startedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span
                      className={cn(
                        'flex items-center gap-1',
                        isOverTime && 'font-medium text-destructive'
                      )}
                      title={isOverTime ? "Belgilangan vaqtdan (timeLimit) oshib ketgan" : undefined}
                    >
                      {isOverTime && <AlertTriangle className="size-3.5 shrink-0" />}
                      {formatDuration(attempt.durationSeconds) ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/teacher/quizzes/${quizId}/results/${attempt._id}`} />}
                      >
                        <Eye className="size-4" /> Ko&apos;rish
                      </Button>
                      {openEndedQuestions.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManualAttemptId(attempt._id)}
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
      )}

      {reviewingAttempt && (
        <ReviewDialog
          key={reviewingAttempt._id}
          attempt={reviewingAttempt}
          questions={openEndedQuestions}
          isPending={reviewOpenEnded.isPending}
          onOpenChange={(open) => !open && closeReview()}
          onSubmit={(reviewedAnswers) =>
            reviewOpenEnded.mutate({ attemptId: reviewingAttempt._id, reviewedAnswers }, {
              onSuccess: closeReview,
            })
          }
        />
      )}
    </div>
  );
}

export default function TeacherQuizResultsPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
      <ResultsContent quizId={id} />
    </Suspense>
  );
}
