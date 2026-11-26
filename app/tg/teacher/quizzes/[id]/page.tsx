'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { TgGradePicker } from '@/components/tg/tg-grade-picker';
import { TgMainButton, TgSecondaryButton } from '@/components/tg/tg-main-button';
import {
  QUIZ_BUILDER_STEPS,
  TgChips,
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgSteps,
  TgWebHint,
} from '@/components/tg/tg-ui';
import { quizGradesLabel, quizStatus } from '@/components/tg/tg-quiz-utils';
import {
  useAddQuestion,
  useDeleteQuestion,
  useQuizWithAnswers,
  useUpdateQuiz,
  type QuestionPayload,
  type TargetGradeInput,
} from '@/hooks/use-quizzes';
import { getMinQuestions, getMinQuestionsForGrades } from '@/lib/quiz-rules';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';
import type { QuestionType, TargetGrade } from '@/types';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TYPE_SHORT: Record<QuestionType, string> = {
  multiple_choice: 'Bir javobli',
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq',
};

const fieldClass =
  'w-full rounded-xl border border-input bg-card px-3 text-[15px] outline-none focus:border-primary';

function toGradeInput(g: TargetGrade): TargetGradeInput {
  return {
    number: g.number,
    ...(g.letter ? { letter: g.letter } : {}),
    ...(g.availableFrom !== undefined ? { availableFrom: g.availableFrom } : {}),
    ...(g.availableUntil !== undefined ? { availableUntil: g.availableUntil } : {}),
    ...(g.maxAttempts != null ? { maxAttempts: g.maxAttempts } : {}),
    ...(g.timeLimit != null ? { timeLimit: g.timeLimit } : {}),
  };
}

// Eng qattiq talab qo'yayotgan sinf ("8-sinf uchun ...")
function strictestGrade(grades: { number: number }[]) {
  if (grades.length === 0) return null;
  return grades.reduce((a, b) => (getMinQuestions(b.number) > getMinQuestions(a.number) ? b : a)).number;
}

function GradesEditor({ quizId, grades }: { quizId: string; grades: TargetGrade[] }) {
  const updateQuiz = useUpdateQuiz();
  const [draft, setDraft] = useState<TargetGradeInput[]>(() => grades.map(toGradeInput));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5">
      <TgGradePicker value={draft} onChange={setDraft} disabled={updateQuiz.isPending} />
      <button
        type="button"
        disabled={draft.length === 0 || updateQuiz.isPending}
        onClick={() =>
          updateQuiz.mutate(
            { id: quizId, targetGrades: draft },
            { onSuccess: () => haptic('success'), onError: () => haptic('error') }
          )
        }
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {updateQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
        Sinflarni saqlash
      </button>
    </div>
  );
}

// Test tuzish 3-bosqichi: savollar qo'shish va testni faollashtirish
export default function TgQuizEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const quiz = useQuizWithAnswers(id);
  const updateQuiz = useUpdateQuiz();
  const addQuestion = useAddQuestion(id);
  const deleteQuestion = useDeleteQuestion(id);

  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [trueFalse, setTrueFalse] = useState<boolean | null>(null);
  const [sample, setSample] = useState('');
  const [points, setPoints] = useState('1');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editGrades, setEditGrades] = useState(false);

  const data = quiz.data;
  const questions = data?.questions ?? [];
  const grades = data?.targetGrades ?? [];
  const minQuestions = getMinQuestionsForGrades(grades);
  const missing = Math.max(0, minQuestions - questions.length);
  const strictest = strictestGrade(grades);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const valid =
    text.trim().length > 0 &&
    Number(points) >= 1 &&
    (type === 'open_ended' ||
      (type === 'true_false' && trueFalse !== null) ||
      (type === 'multiple_choice' && filledOptions.length >= 2 && !!options[correct]?.trim()));

  function resetForm() {
    setText('');
    setOptions(['', '', '', '']);
    setCorrect(0);
    setTrueFalse(null);
    setSample('');
  }

  function setActive(isActive: boolean) {
    haptic('light');
    updateQuiz.mutate(
      { id, isActive },
      { onSuccess: () => haptic('success'), onError: () => haptic('error') }
    );
  }

  function saveQuestion() {
    let payload: QuestionPayload;
    if (type === 'multiple_choice') {
      // Bo'sh variantlar tashlanadi — to'g'ri javob indeksi shunga moslab qayta hisoblanadi
      const kept = options.map((o, i) => ({ text: o.trim(), i })).filter((o) => o.text);
      payload = {
        text: text.trim(),
        type,
        points: Number(points),
        options: kept.map((o, idx) => ({ label: LABELS[idx], text: o.text })),
        correctAnswer: kept.findIndex((o) => o.i === correct),
      };
    } else if (type === 'true_false') {
      payload = {
        text: text.trim(),
        type,
        points: Number(points),
        correctAnswer: trueFalse === true,
        options: [
          { label: 'A', text: "To'g'ri" },
          { label: 'B', text: "Noto'g'ri" },
        ],
      };
    } else {
      payload = {
        text: text.trim(),
        type,
        points: Number(points),
        sampleAnswer: sample.trim() || undefined,
      };
    }
    addQuestion.mutate(payload, {
      onSuccess: () => {
        haptic('success');
        resetForm();
      },
      onError: () => haptic('error'),
    });
  }

  if (quiz.isLoading) {
    return (
      <TgPage>
        <TgSkeletonList count={4} height={90} />
      </TgPage>
    );
  }
  if (quiz.isError || !data) {
    return (
      <TgPage>
        <TgHeader eyebrow="Test tahriri" title="Test" />
        <TgError onRetry={() => quiz.refetch()} />
      </TgPage>
    );
  }

  const status = quizStatus(data);
  const ready = missing === 0 && grades.length > 0;

  return (
    <TgPage className="gap-3">
      <TgHeader
        eyebrow={data.isActive ? 'Test tahriri' : 'Test yaratish'}
        title={data.title}
        action={<TgPill tone={status.tone}>{status.label}</TgPill>}
      />
      {!data.isActive && <TgSteps steps={QUIZ_BUILDER_STEPS} current={3} />}

      <div className="flex flex-wrap items-center gap-x-1 text-[13px] text-muted-foreground">
        <span>
          {[data.timeLimit ? `${data.timeLimit} daq` : null, `o'tish ${data.passingScore}%`]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span aria-hidden>·</span>
        <Link href={`/tg/teacher/quizzes/${id}/results`} className="font-semibold text-primary">
          Natijalar
        </Link>
      </div>

      {/* Sinflar: ulashilgan testni qabul qilgandan keyin o'z sinfini shu yerda tanlaydi */}
      <button
        type="button"
        aria-expanded={editGrades || grades.length === 0}
        onClick={() => setEditGrades((v) => !v)}
        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-left active:bg-muted"
      >
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">Sinflar</span>
          <span className="block truncate font-semibold">{quizGradesLabel(data)}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-primary">
          {editGrades ? 'Yopish' : "O'zgartirish"}
        </span>
      </button>
      {(editGrades || grades.length === 0) && (
        <GradesEditor
          key={grades.map((g) => `${g.number}${g.letter ?? ''}`).join()}
          quizId={id}
          grades={grades}
        />
      )}

      {missing > 0 && (
        <div role="alert" className="rounded-xl bg-gold-soft px-3 py-2.5 text-[13px] text-gold-foreground">
          <strong>
            {questions.length} / {minQuestions} savol.
          </strong>{' '}
          {strictest ? `${strictest}-sinf uchun faollashtirishga` : 'Faollashtirishga'} yana {missing} ta
          kerak.
          {data.isActive && ' Test hozir faol — o\'quvchilar uni yecha oladi.'}
        </div>
      )}

      {ready && !data.isActive && (
        <div role="status" className="rounded-xl bg-success-soft px-3 py-2.5 text-[13px] text-success">
          <strong>
            {questions.length} / {minQuestions} savol.
          </strong>{' '}
          Test tayyor — «Faollashtirish» tugmasi bilan o&apos;quvchilarga oching.
        </div>
      )}

      {data.isActive && (
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
          <span>
            <span className="block font-bold">O&apos;quvchilarga ochiq</span>
            <span className="block text-xs text-muted-foreground">
              Test faol — o&apos;chirsangiz qoralamaga qaytadi
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="size-6 accent-primary"
            checked
            disabled={updateQuiz.isPending}
            onChange={() => setActive(false)}
          />
        </label>
      )}

      <h2 className="mt-1 text-base font-bold">Savollar · {questions.length}</h2>

      {questions.length > 0 && (
        <ol className="flex flex-col gap-2">
          {questions.map((q, index) => (
            <li
              key={q._id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted font-heading text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold wrap-break-word">{q.text}</span>
                <span className="block text-xs wrap-break-word text-muted-foreground">
                  {TYPE_SHORT[q.type]} · {q.points} ball
                  {q.type === 'multiple_choice' &&
                    typeof q.correctAnswer === 'number' &&
                    q.options?.[q.correctAnswer] &&
                    ` · ✓ ${q.options[q.correctAnswer].text}`}
                  {q.type === 'true_false' && ` · ✓ ${q.correctAnswer ? "To'g'ri" : "Noto'g'ri"}`}
                </span>
              </span>
              {confirmDelete === q._id ? (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="Bekor qilish"
                    onClick={() => setConfirmDelete(null)}
                    className="flex size-8 items-center justify-center rounded-lg border border-border"
                  >
                    <X className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deleteQuestion.isPending}
                    onClick={() =>
                      deleteQuestion.mutate(q._id, {
                        onSuccess: () => haptic('success'),
                        onSettled: () => setConfirmDelete(null),
                      })
                    }
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-xs font-bold text-background disabled:opacity-60"
                  >
                    {deleteQuestion.isPending && <Loader2 className="size-3 animate-spin" />}
                    O&apos;chirish
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  aria-label="Savolni o'chirish"
                  onClick={() => setConfirmDelete(q._id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <section className="flex flex-col gap-3 rounded-[18px] border-2 border-primary bg-card p-3.5">
        <TgChips
          value={type}
          onChange={setType}
          options={(Object.keys(TYPE_SHORT) as QuestionType[]).map((t) => ({
            value: t,
            label: TYPE_SHORT[t],
          }))}
        />
        <label htmlFor="q-text" className="flex items-center gap-1.5 text-[13px] font-semibold">
          <Plus className="size-3.5" /> {questions.length + 1}-savol
        </label>
        <textarea
          id="q-text"
          placeholder="Savol matni"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn(fieldClass, 'resize-none py-3 leading-snug')}
        />

        {type === 'multiple_choice' && (
          <div className="flex flex-col gap-2">
            {options.map((option, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3',
                  correct === idx
                    ? 'border-[1.5px] border-success bg-success-soft'
                    : 'border border-input bg-card'
                )}
              >
                <input
                  type="radio"
                  name="correct"
                  aria-label={`${LABELS[idx]} — to'g'ri javob`}
                  checked={correct === idx}
                  onChange={() => {
                    haptic('selection');
                    setCorrect(idx);
                  }}
                  className="size-4.5 shrink-0 accent-success"
                />
                <input
                  aria-label={`${LABELS[idx]} variant`}
                  placeholder={`${LABELS[idx]} variant`}
                  value={option}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, i) => (i === idx ? e.target.value : o)))
                  }
                  className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                />
                {correct === idx && (
                  <span className="shrink-0 text-xs font-bold text-success">To&apos;g&apos;ri</span>
                )}
                {options.length > 2 && correct !== idx && (
                  <button
                    type="button"
                    aria-label={`${LABELS[idx]} variantni olib tashlash`}
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, i) => i !== idx));
                      if (correct > idx) setCorrect((c) => c - 1);
                    }}
                    className="flex size-8 shrink-0 items-center justify-center text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < LABELS.length && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ''])}
                className="self-start py-1 text-sm font-semibold text-primary"
              >
                + Variant qo&apos;shish
              </button>
            )}
          </div>
        )}

        {type === 'true_false' && (
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={trueFalse === value}
                onClick={() => {
                  haptic('selection');
                  setTrueFalse(value);
                }}
                className={cn(
                  'h-12 rounded-xl font-semibold transition-colors',
                  trueFalse === value
                    ? 'border-[1.5px] border-success bg-success-soft text-success'
                    : 'border border-input bg-card'
                )}
              >
                {value ? "To'g'ri" : "Noto'g'ri"}
              </button>
            ))}
          </div>
        )}

        {type === 'open_ended' && (
          <textarea
            aria-label="Namuna javob"
            placeholder="Namuna javob (ixtiyoriy — baholashda ko'rinadi)"
            rows={2}
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            className={cn(fieldClass, 'resize-none py-3 leading-snug')}
          />
        )}

        <div className="flex items-center gap-2.5">
          <label htmlFor="q-points" className="text-[13px] font-semibold">
            Ball
          </label>
          <input
            id="q-points"
            inputMode="numeric"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/\D/g, '').slice(0, 3))}
            className={cn(fieldClass, 'h-10 w-16 text-center')}
          />
        </div>
      </section>

      <TgWebHint href={`/teacher/quizzes/${id}`}>
        Savollarni tahrirlash, Word&apos;dan import va sozlamalar —
      </TgWebHint>

      <TgMainButton
        text="Savolni saqlash"
        onClick={saveQuestion}
        loading={addQuestion.isPending}
        disabled={!valid}
        secondary={
          ready && !data.isActive ? (
            <TgSecondaryButton onClick={() => setActive(true)} disabled={updateQuiz.isPending}>
              {updateQuiz.isPending ? 'Saqlanmoqda…' : 'Faollashtirish'}
            </TgSecondaryButton>
          ) : undefined
        }
      />
    </TgPage>
  );
}
