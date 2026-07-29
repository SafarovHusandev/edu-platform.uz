'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, XCircle } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuizWithAnswers, useQuizResults, useReviewOpenEnded } from '@/hooks/use-quizzes';
import { formatDateTime } from '@/lib/format';
import type { Attempt } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TeacherQuizResultsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: quiz } = useQuizWithAnswers(id);
  const { data: attempts, isLoading } = useQuizResults(id);
  const reviewOpenEnded = useReviewOpenEnded(id);

  const [reviewingAttempt, setReviewingAttempt] = useState<Attempt | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const openEndedQuestions = (quiz?.questions ?? []).filter((q) => q.type === 'open_ended');

  function openReview(attempt: Attempt) {
    setReviewingAttempt(attempt);
    const initial: Record<string, number> = {};
    for (const q of openEndedQuestions) {
      const answer = attempt.answers.find((a) => a.question === q._id);
      initial[q._id] = answer?.pointsEarned ?? 0;
    }
    setScores(initial);
  }

  function handleSubmitReview() {
    if (!reviewingAttempt) return;
    reviewOpenEnded.mutate(
      {
        attemptId: reviewingAttempt._id,
        reviewedAnswers: openEndedQuestions.map((q) => ({
          questionId: q._id,
          pointsEarned: scores[q._id] ?? 0,
        })),
      },
      { onSuccess: () => setReviewingAttempt(null) }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href={`/teacher/quizzes/${id}`} />}>
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
              {openEndedQuestions.length > 0 && <TableHead className="text-right">Amal</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts?.map((attempt) => {
              const student = typeof attempt.student === 'object' ? attempt.student : null;
              return (
                <TableRow key={attempt._id}>
                  <TableCell>{student?.name ?? '—'}</TableCell>
                  <TableCell>{attempt.scorePercent ?? 0}%</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : '—'}
                  </TableCell>
                  {openEndedQuestions.length > 0 && (
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openReview(attempt)}>
                        Baholash
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!reviewingAttempt} onOpenChange={(open) => !open && setReviewingAttempt(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ochiq savollarni baholash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {openEndedQuestions.map((question) => {
              const answer = reviewingAttempt?.answers.find((a) => a.question === question._id);
              return (
                <div key={question._id} className="space-y-1.5 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{question.text}</p>
                  <p className="rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                    {(answer?.givenAnswer as string) || 'Javob berilmagan'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Ball (max {question.points})</Label>
                    <Input
                      type="number"
                      min={0}
                      max={question.points}
                      className="w-24"
                      value={scores[question._id] ?? 0}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, [question._id]: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitReview} disabled={reviewOpenEnded.isPending}>
              {reviewOpenEnded.isPending && <Loader2 className="size-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
