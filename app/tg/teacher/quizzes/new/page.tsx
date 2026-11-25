'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import { TgHeader, TgPage, TgWebHint } from '@/components/tg/tg-ui';
import { useCreateQuiz, type TargetGradeInput } from '@/hooks/use-quizzes';
import { GRADE_LETTERS } from '@/lib/class-roster';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

const fieldClass =
  'h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus:border-primary';

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function gradeKey(g: TargetGradeInput) {
  return `${g.number}-${g.letter ?? '*'}`;
}

export default function TgNewQuizPage() {
  const router = useRouter();
  const tarif = useAuthStore((s) => s.user?.tarif);
  const createQuiz = useCreateQuiz();

  const [title, setTitle] = useState('');
  const [grades, setGrades] = useState<TargetGradeInput[]>([]);
  const [gradeNumber, setGradeNumber] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState('30');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [passingScore, setPassingScore] = useState('60');
  const [step, setStep] = useState<1 | 2>(1);

  function addGrade(letter: string | null) {
    if (!gradeNumber) return;
    const entry: TargetGradeInput = letter ? { number: gradeNumber, letter } : { number: gradeNumber };
    setGrades((prev) => {
      // "Barcha parallellar" tanlansa shu raqamdagi alohida harflar keraksiz
      const rest = letter
        ? prev.filter((g) => !(g.number === gradeNumber && !g.letter))
        : prev.filter((g) => g.number !== gradeNumber);
      return rest.some((g) => gradeKey(g) === gradeKey(entry)) ? rest : [...rest, entry];
    });
    haptic('selection');
  }

  const titleOk = title.trim().length >= 3;
  const numbersOk =
    Number(timeLimit) >= 1 && Number(maxAttempts) >= 1 && Number(passingScore) >= 0 && Number(passingScore) <= 100;

  function submit() {
    if (step === 1) {
      setStep(2);
      return;
    }
    createQuiz.mutate(
      {
        title: title.trim(),
        targetType: 'standalone',
        passingScore: Number(passingScore),
        maxAttempts: Number(maxAttempts),
        timeLimit: Number(timeLimit),
        targetGrades: grades,
        isActive: false,
      },
      {
        onSuccess: (quiz) => {
          haptic('success');
          router.replace(`/tg/teacher/quizzes/${quiz._id}`);
        },
      }
    );
  }

  return (
    <TgPage>
      <TgHeader eyebrow="Test yaratish" title={title.trim() || 'Yangi test'} />

      <ol aria-label="Bosqichlar" className="grid grid-cols-3 gap-1.5">
        {['1. Asosiy', '2. Sinflar', '3. Savollar'].map((label, i) => (
          <li key={label} className="flex flex-col gap-1.5">
            <span className={cn('h-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')} />
            <span className={cn('text-xs font-semibold', i + 1 === step ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <>
          <Field label="Test nomi" htmlFor="q-title">
            <input
              id="q-title"
              className={fieldClass}
              placeholder="Masalan: Algebra 1-bob yakuniy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Vaqt (daq)" htmlFor="q-time">
              <input id="q-time" inputMode="numeric" className={fieldClass} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Urinish" htmlFor="q-attempts">
              <input id="q-attempts" inputMode="numeric" className={fieldClass} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="O'tish %" htmlFor="q-pass">
              <input id="q-pass" inputMode="numeric" className={fieldClass} value={passingScore} onChange={(e) => setPassingScore(e.target.value.replace(/\D/g, ''))} />
            </Field>
          </div>
          {tarif !== 'premium' && Number(maxAttempts) > 1 && (
            <p className="rounded-xl bg-gold-soft px-3.5 py-2.5 text-[13px] text-gold-foreground">
              Standart tarifda o&apos;quvchilarga baribir 1 ta urinish beriladi. Ko&apos;proq urinish —
              Premium tarifda.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Sinf</span>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={gradeNumber === n}
                  onClick={() => setGradeNumber(n)}
                  className={cn(
                    'h-11 rounded-xl font-heading text-sm font-bold',
                    gradeNumber === n ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {gradeNumber && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{gradeNumber}-sinf parallelini qo&apos;shing</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => addGrade(null)}
                  className="h-10 rounded-xl border border-primary/40 bg-primary-soft px-3 text-sm font-semibold text-primary"
                >
                  Barchasi
                </button>
                {GRADE_LETTERS.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => addGrade(letter)}
                    className="h-10 min-w-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold"
                  >
                    {gradeNumber}-{letter}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5">
            <span className="text-sm font-semibold">Tanlangan sinflar</span>
            {grades.length === 0 ? (
              <span className="text-sm text-muted-foreground">Hali sinf tanlanmagan</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {grades.map((g) => (
                  <span
                    key={gradeKey(g)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pr-1 pl-3 text-sm font-semibold text-primary"
                  >
                    {g.letter ? `${g.number}-${g.letter}` : `${g.number}-sinf (barchasi)`}
                    <button
                      type="button"
                      aria-label="Olib tashlash"
                      onClick={() => setGrades((prev) => prev.filter((x) => gradeKey(x) !== gradeKey(g)))}
                      className="flex size-6 items-center justify-center rounded-full hover:bg-primary/15"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={() => setStep(1)} className="self-start text-sm font-semibold text-primary">
            ← Asosiy ma&apos;lumotlarga qaytish
          </button>
        </>
      )}

      <TgWebHint href="/teacher/quizzes/new">
        Kurs yoki darsga biriktirilgan test, sinf bo&apos;yicha alohida muddat va Word&apos;dan import —
      </TgWebHint>

      <TgMainButton
        text={step === 1 ? 'Davom etish' : 'Yaratish va savollarga o\'tish'}
        onClick={submit}
        loading={createQuiz.isPending}
        disabled={step === 1 ? !titleOk || !numbersOk : grades.length === 0}
      />
    </TgPage>
  );
}
