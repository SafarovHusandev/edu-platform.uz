'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  aiErrorInfo,
  isAbortError,
  useGenerateBoardLesson,
  type AiErrorInfo,
} from '@/hooks/use-board-lessons';
import { LESSON_LIMITS } from '@/lib/board-lesson';
import { cn } from '@/lib/utils';
import type { BoardLessonDraft } from '@/types/board-lesson';

const SLIDE_COUNTS = [4, 6, 8];
const EXERCISE_COUNTS = [5, 8, 10];
const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);
const NOTES_MAX = 300;
const TOPIC_MIN = 3;
const GRADE_STORAGE_KEY = 'st-ai-grade';

// Kutish paytida almashib turadigan yozuvlar (AI 2 daqiqagacha ishlashi mumkin)
const STEPS = [
  'Mavzu tahlil qilinmoqda...',
  'Slaydlar yozilmoqda...',
  'Misollar tanlanmoqda...',
  'Mashqlar tuzilmoqda...',
  'Oxirgi tekshiruv...',
];

const chip =
  'flex h-10 min-w-10 items-center justify-center rounded-xl border-2 px-3 text-sm font-semibold transition-colors disabled:opacity-50';

// O'qituvchining oxirgi tanlagan sinfi
function readStoredGrade() {
  try {
    const value = Number(window.localStorage.getItem(GRADE_STORAGE_KEY));
    return Number.isInteger(value) && value >= 1 && value <= 11 ? value : null;
  } catch {
    return null;
  }
}

function storeGrade(grade: number) {
  try {
    window.localStorage.setItem(GRADE_STORAGE_KEY, String(grade));
  } catch {
    // localStorage yopiq bo'lsa — shunchaki eslab qolinmaydi
  }
}

export interface AiRequestedCounts {
  slideCount: number;
  exerciseCount: number;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function AiGenerateDialog({
  open,
  onOpenChange,
  initialTopic,
  initialGrade,
  initialSubject,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
  initialGrade?: number | null;
  initialSubject?: string;
  onGenerated: (draft: BoardLessonDraft, requested: AiRequestedCounts) => void;
}) {
  const generate = useGenerateBoardLesson();
  const abortRef = useRef<AbortController | null>(null);
  const [topic, setTopic] = useState(initialTopic ?? '');
  const [grade, setGrade] = useState<number | null>(
    () => initialGrade ?? (typeof window === 'undefined' ? null : readStoredGrade())
  );
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [slideCount, setSlideCount] = useState(6);
  const [exerciseCount, setExerciseCount] = useState(5);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<AiErrorInfo | null>(null);
  const [step, setStep] = useState(0);

  const pending = generate.isPending;
  const fields = error?.fields ?? {};

  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 15000);
    return () => window.clearInterval(id);
  }, [pending]);

  // Oyna yopilsa / komponent o'chsa — davom etayotgan so'rov to'xtatiladi
  useEffect(() => () => abortRef.current?.abort(), []);

  const topicTooShort = topic.trim().length < TOPIC_MIN;
  const canSubmit = !topicTooShort && !!grade && !pending;

  function clearField(field: string) {
    if (error?.fields[field]) setError({ ...error, fields: { ...error.fields, [field]: '' } });
  }

  function submit() {
    if (!canSubmit || !grade) return;
    setError(null);
    setStep(0);
    storeGrade(grade);
    const controller = new AbortController();
    abortRef.current = controller;
    const requested = { slideCount, exerciseCount };
    generate.mutate(
      {
        body: {
          topic: topic.trim(),
          grade,
          subject: subject.trim() || undefined,
          slideCount,
          exerciseCount,
          notes: notes.trim() || undefined,
        },
        signal: controller.signal,
      },
      {
        onSuccess: (draft) => onGenerated(draft, requested),
        onError: (e) => {
          if (isAbortError(e)) return;
          const info = aiErrorInfo(e);
          setError(info);
          toast.error(info.message);
        },
        onSettled: () => {
          if (abortRef.current === controller) abortRef.current = null;
        },
      }
    );
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    generate.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && pending) cancel();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> AI bilan dars tuzish
          </DialogTitle>
          <DialogDescription>
            Mavzu va sinfni yozing — AI slaydlar va mashqlarni tayyorlaydi. Natijani tekshirib, o&apos;zingiz
            saqlaysiz.
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Wand2 className="size-8 animate-pulse" />
              <Loader2 className="absolute -right-2 -top-2 size-6 animate-spin" />
            </span>
            <p key={step} className="live-pop-in font-heading text-lg font-semibold">
              {STEPS[step]}
            </p>
            <p className="text-sm text-muted-foreground">
              AI dars tayyorlamoqda... Bu 2 daqiqagacha vaqt olishi mumkin
            </p>
            <Button variant="outline" onClick={cancel} className="mt-2">
              Bekor qilish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-topic">Mavzu</Label>
              <Input
                id="ai-topic"
                value={topic}
                maxLength={LESSON_LIMITS.titleMax}
                onChange={(e) => {
                  setTopic(e.target.value);
                  clearField('topic');
                }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Masalan: Oddiy kasrlarni qo'shish"
                className="h-11 text-base"
                aria-invalid={!!fields.topic || undefined}
                autoFocus
              />
              <FieldError
                message={
                  fields.topic ||
                  (topic.trim() && topicTooShort ? `Kamida ${TOPIC_MIN} ta belgi yozing` : undefined)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Sinf</Label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Sinf">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={grade === g}
                    onClick={() => {
                      setGrade(g);
                      clearField('grade');
                    }}
                    className={cn(chip, grade === g ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <FieldError message={fields.grade} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-subject">Fan (ixtiyoriy)</Label>
              <Input
                id="ai-subject"
                value={subject}
                maxLength={LESSON_LIMITS.subjectMax}
                onChange={(e) => {
                  setSubject(e.target.value);
                  clearField('subject');
                }}
                placeholder="Matematika"
                className="h-11 text-base"
                aria-invalid={!!fields.subject || undefined}
              />
              <FieldError message={fields.subject} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Slaydlar soni</Label>
                <div className="flex gap-1.5">
                  {SLIDE_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setSlideCount(n);
                        clearField('slideCount');
                      }}
                      className={cn(chip, 'flex-1', slideCount === n ? 'border-primary bg-primary-soft text-primary' : 'border-input')}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <FieldError message={fields.slideCount} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Mashqlar soni</Label>
                <div className="flex gap-1.5">
                  {EXERCISE_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setExerciseCount(n);
                        clearField('exerciseCount');
                      }}
                      className={cn(chip, 'flex-1', exerciseCount === n ? 'border-primary bg-primary-soft text-primary' : 'border-input')}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <FieldError message={fields.exerciseCount} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-notes">Qo&apos;shimcha istak (ixtiyoriy)</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {notes.length}/{NOTES_MAX}
                </span>
              </div>
              <Textarea
                id="ai-notes"
                value={notes}
                maxLength={NOTES_MAX}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearField('notes');
                }}
                rows={2}
                placeholder="Masalan: hayotiy misollar ko'proq bo'lsin"
                aria-invalid={!!fields.notes || undefined}
              />
              <FieldError message={fields.notes} />
            </div>

            {error && (
              <div
                className="flex flex-wrap items-center gap-3 rounded-xl bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive"
                role="alert"
              >
                <span className="min-w-0 flex-1">{error.message}</span>
                {error.retryable && (
                  <Button size="sm" variant="outline" onClick={submit} disabled={!canSubmit}>
                    <RotateCcw className="size-3.5" /> Qayta urinish
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {!pending && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button onClick={submit} disabled={!canSubmit}>
              <Sparkles className="size-4" /> Yaratish
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
