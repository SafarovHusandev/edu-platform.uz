'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TgGradePicker } from '@/components/tg/tg-grade-picker';
import { TgMainButton, TgSecondaryButton } from '@/components/tg/tg-main-button';
import { useTgBackOverride } from '@/components/tg/tg-shell';
import { QUIZ_BUILDER_STEPS, TgHeader, TgPage, TgSteps, TgWebHint } from '@/components/tg/tg-ui';
import { useCreateQuiz, type TargetGradeInput } from '@/hooks/use-quizzes';
import { getMinQuestionsForGrades } from '@/lib/quiz-rules';
import { haptic } from '@/lib/telegram-webapp';
import { useAuthStore } from '@/store/auth-store';

const fieldClass =
  'h-12 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus:border-primary';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="truncate text-[13px] font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

const digits = (value: string) => value.replace(/\D/g, '').slice(0, 4);

// Test yaratish: 1-bosqich — asosiy ma'lumot, 2-bosqich — sinflar. Test qoralama
// sifatida yaratiladi va 3-bosqichga (savollar, /tg/teacher/quizzes/[id]) o'tiladi.
export default function TgNewQuizPage() {
  const router = useRouter();
  const tarif = useAuthStore((s) => s.user?.tarif);
  const createQuiz = useCreateQuiz();

  const [title, setTitle] = useState('');
  const [grades, setGrades] = useState<TargetGradeInput[]>([]);
  const [timeLimit, setTimeLimit] = useState('30');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [passingScore, setPassingScore] = useState('60');
  const [step, setStep] = useState<1 | 2>(1);

  // 2-bosqichda Telegram «Orqaga» tugmasi sahifadan chiqmay, 1-bosqichga qaytaradi
  useTgBackOverride(step === 2 ? () => setStep(1) : null);

  const titleOk = title.trim().length >= 3;
  const numbersOk =
    Number(timeLimit) >= 1 &&
    Number(maxAttempts) >= 1 &&
    passingScore !== '' &&
    Number(passingScore) <= 100;
  const minQuestions = getMinQuestionsForGrades(grades);

  function submit() {
    if (step === 1) {
      haptic('light');
      setStep(2);
      window.scrollTo({ top: 0 });
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
        onError: () => haptic('error'),
      }
    );
  }

  return (
    <TgPage className="gap-3">
      <TgHeader eyebrow="Test yaratish" title={title.trim() || 'Yangi test'} />
      <TgSteps steps={QUIZ_BUILDER_STEPS} current={step} />

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
              enterKeyHint="next"
            />
          </Field>
          {title.length > 0 && !titleOk && (
            <span className="-mt-1.5 text-xs text-destructive">Kamida 3 ta belgi kiriting</span>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Field label="Vaqt (daq)" htmlFor="q-time">
              <input
                id="q-time"
                inputMode="numeric"
                className={fieldClass}
                value={timeLimit}
                onChange={(e) => setTimeLimit(digits(e.target.value))}
              />
            </Field>
            <Field label="Urinish" htmlFor="q-attempts">
              <input
                id="q-attempts"
                inputMode="numeric"
                className={fieldClass}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(digits(e.target.value))}
              />
            </Field>
            <Field label="O'tish %" htmlFor="q-pass">
              <input
                id="q-pass"
                inputMode="numeric"
                className={fieldClass}
                value={passingScore}
                onChange={(e) => setPassingScore(digits(e.target.value))}
              />
            </Field>
          </div>
          {!numbersOk && (
            <span className="-mt-1.5 text-xs text-destructive">
              Vaqt va urinish kamida 1, o&apos;tish bali 0–100 oralig&apos;ida bo&apos;lsin
            </span>
          )}
          {tarif !== 'premium' && Number(maxAttempts) > 1 && (
            <p className="rounded-xl bg-gold-soft px-3 py-2.5 text-[13px] text-gold-foreground">
              Standart tarifda o&apos;quvchilarga baribir 1 ta urinish beriladi. Ko&apos;proq urinish —
              Premium tarifda.
            </p>
          )}
        </>
      ) : (
        <>
          <TgGradePicker value={grades} onChange={setGrades} disabled={createQuiz.isPending} />
          {grades.length > 0 && (
            <p className="rounded-xl bg-primary-soft px-3 py-2.5 text-[13px] text-primary">
              Faollashtirish uchun kamida <strong>{minQuestions} ta savol</strong> kerak. Test
              qoralama sifatida yaratiladi — savollarni keyingi bosqichda qo&apos;shasiz.
            </p>
          )}
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
        secondary={
          step === 2 ? (
            <TgSecondaryButton onClick={() => setStep(1)} disabled={createQuiz.isPending}>
              Orqaga
            </TgSecondaryButton>
          ) : undefined
        }
      />
    </TgPage>
  );
}
