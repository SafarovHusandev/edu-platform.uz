'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, X } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import {
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSegment,
  TgSkeletonList,
  TgWebHint,
} from '@/components/tg/tg-ui';
import { quizGradesLabel, quizStatus } from '@/components/tg/tg-quiz-utils';
import {
  useAddQuestion,
  useDeleteQuestion,
  useQuizWithAnswers,
  useUpdateQuiz,
  type QuestionPayload,
} from '@/hooks/use-quizzes';
import { getMinQuestionsForGrades } from '@/lib/quiz-rules';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';
import type { QuestionType } from '@/types';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TYPE_SHORT: Record<QuestionType, string> = {
  multiple_choice: 'Bir javobli',
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq',
};

const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 text-[15px] outline-none focus:border-primary';

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

  const data = quiz.data;
  const questions = data?.questions ?? [];
  const minQuestions = getMinQuestionsForGrades(data?.targetGrades ?? []);
  const missing = Math.max(0, minQuestions - questions.length);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const valid =
    text.trim().length > 0 &&
    Number(points) >= 1 &&
    (type === 'open_ended' ||
      (type === 'true_false' && trueFalse !== null) ||
      (type === 'multiple_choice' && filledOptions.length >= 2 && options[correct]?.trim()));

  function resetForm() {
    setText('');
    setOptions(['', '', '', '']);
    setCorrect(0);
    setTrueFalse(null);
    setSample('');
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
        <TgError onRetry={() => quiz.refetch()} />
      </TgPage>
    );
  }

  const status = quizStatus(data);

  return (
    <TgPage>
      <TgHeader
        eyebrow="Test tahriri"
        title={data.title}
        action={<TgPill tone={status.tone}>{status.label}</TgPill>}
      />
      <div className="text-[13px] text-muted-foreground">
        {[quizGradesLabel(data), data.timeLimit ? `${data.timeLimit} daq` : null, `o'tish ${data.passingScore}%`]
          .filter(Boolean)
          .join(' · ')}
        {' · '}
        <Link href={`/tg/teacher/quizzes/${id}/results`} className="font-semibold text-primary">
          Natijalar
        </Link>
      </div>

      {missing > 0 ? (
        <div role="alert" className="rounded-2xl bg-gold-soft px-3.5 py-3 text-sm text-gold-foreground">
          <strong>
            {questions.length} / {minQuestions} savol.
          </strong>{' '}
          Faollashtirish uchun yana {missing} ta kerak.
        </div>
      ) : (
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
          <span>
            <span className="block font-bold">O&apos;quvchilarga ochiq</span>
            <span className="block text-xs text-muted-foreground">
              {data.isActive ? 'Test faol — o\'quvchilar yecha oladi' : 'Qoralama — faqat siz ko\'rasiz'}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="size-6 accent-primary"
            checked={!!data.isActive}
            disabled={updateQuiz.isPending}
            onChange={(e) => {
              haptic('light');
              updateQuiz.mutate({ id, isActive: e.target.checked });
            }}
          />
        </label>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Savollar · {questions.length}</h2>
      </div>

      {questions.length > 0 && (
        <ol className="flex flex-col gap-2">
          {questions.map((q, index) => (
            <li key={q._id} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold wrap-break-word">{q.text}</span>
                <span className="block text-xs text-muted-foreground">
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
                    onClick={() => {
                      deleteQuestion.mutate(q._id);
                      setConfirmDelete(null);
                    }}
                    className="h-8 rounded-lg bg-destructive px-2.5 text-xs font-bold text-white"
                  >
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

      <section className="flex flex-col gap-3 rounded-[18px] border border-primary/25 bg-card p-3.5">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Plus className="size-4" /> {questions.length + 1}-savol
        </div>
        <TgSegment
          value={type}
          onChange={(v) => setType(v)}
          options={(Object.keys(TYPE_SHORT) as QuestionType[]).map((t) => ({
            value: t,
            label: TYPE_SHORT[t],
          }))}
        />
        <textarea
          aria-label="Savol matni"
          placeholder="Savol matni"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn(fieldClass, 'py-3 leading-snug')}
        />

        {type === 'multiple_choice' && (
          <div className="flex flex-col gap-2">
            {options.map((option, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-2.5',
                  correct === idx ? 'border-success bg-success-soft' : 'border-input bg-background'
                )}
              >
                <input
                  type="radio"
                  name="correct"
                  aria-label={`${LABELS[idx]} to'g'ri javob`}
                  checked={correct === idx}
                  onChange={() => setCorrect(idx)}
                  className="size-5 accent-success"
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
                {correct === idx && <span className="text-xs font-bold text-success">To&apos;g&apos;ri</span>}
                {options.length > 2 && correct !== idx && (
                  <button
                    type="button"
                    aria-label="Variantni olib tashlash"
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, i) => i !== idx));
                      if (correct > idx) setCorrect((c) => c - 1);
                    }}
                    className="text-muted-foreground"
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
                className="self-start text-sm font-semibold text-primary"
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
                onClick={() => setTrueFalse(value)}
                className={cn(
                  'h-12 rounded-xl font-semibold',
                  trueFalse === value
                    ? 'bg-success text-success-foreground'
                    : 'border border-input bg-background'
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
            className={cn(fieldClass, 'py-3 leading-snug')}
          />
        )}

        <div className="flex items-center gap-2.5">
          <label htmlFor="q-points" className="text-sm font-semibold">
            Ball
          </label>
          <input
            id="q-points"
            inputMode="numeric"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/\D/g, ''))}
            className={cn(fieldClass, 'h-11 w-20 text-center font-heading')}
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
      />
    </TgPage>
  );
}
