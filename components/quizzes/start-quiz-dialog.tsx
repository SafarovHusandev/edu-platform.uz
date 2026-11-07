'use client';

import { AlertTriangle, Clock, ListChecks, Loader2, RotateCcw, Shuffle, Lock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface StartQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  questionCount?: number | null;
  timeLimit?: number | null;
  // Shu urinish tugagach qoladigan emas, hozir qolgan urinishlar soni
  attemptsLeft: number;
  maxAttempts: number;
  // Oldingi (tekshirilgan) urinish natijasi — bo'lsa, natija pasayishi haqida ogohlantiramiz
  previousScore?: number | null;
  pending?: boolean;
  onConfirm: () => void;
}

// Testni boshlashdan oldingi tasdiqlash oynasi
export function StartQuizDialog({
  open,
  onOpenChange,
  title,
  questionCount,
  timeLimit,
  attemptsLeft,
  maxAttempts,
  previousScore,
  pending = false,
  onConfirm,
}: StartQuizDialogProps) {
  const attemptNumber = maxAttempts - attemptsLeft + 1;
  const isLastAttempt = attemptsLeft === 1;

  const facts = [
    questionCount ? { icon: ListChecks, text: `${questionCount} ta savol` } : null,
    { icon: Clock, text: timeLimit ? `${timeLimit} daqiqa` : 'Vaqt cheklanmagan' },
    { icon: RotateCcw, text: `${attemptNumber}-urinish (${maxAttempts} tadan)` },
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Testni boshlaysizmi?</AlertDialogTitle>
          <AlertDialogDescription className="font-semibold text-foreground">
            {title}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {facts.map((fact) => (
              <span
                key={fact.text}
                className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 font-medium"
              >
                <fact.icon className="size-4 text-primary" /> {fact.text}
              </span>
            ))}
          </div>

          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            {timeLimit ? (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" />
                Boshlagach taymer to&apos;xtamaydi — vaqt tugasa urinish bekor qilinadi.
              </li>
            ) : null}
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 size-4 shrink-0" />
              Testdan faqat uni yakunlab chiqish mumkin.
            </li>
            <li className="flex items-start gap-2">
              <Shuffle className="mt-0.5 size-4 shrink-0" />
              Savollar va javob variantlari aralashtirib beriladi.
            </li>
          </ul>

          {previousScore != null && (
            <div className="flex items-start gap-2.5 rounded-xl border border-gold/50 bg-gold-soft px-3.5 py-3 text-gold-foreground">
              <AlertTriangle className="mt-0.5 size-4.5 shrink-0" />
              <p>
                Oldingi natijangiz: <strong>{previousScore} ball</strong>. Diqqat:{' '}
                <strong>oxirgi urinish natijasi hisobga olinadi</strong> — bu safar kamroq ball
                olsangiz, natijangiz shunga tushadi.
              </p>
            </div>
          )}

          {isLastAttempt && (
            <div className="flex items-start gap-2.5 rounded-xl bg-destructive-soft px-3.5 py-3 text-destructive">
              <AlertTriangle className="mt-0.5 size-4.5 shrink-0" />
              <p>
                Bu <strong>oxirgi urinishingiz</strong> — undan keyin testni qayta ishlab
                bo&apos;lmaydi.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Bekor qilish</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Boshlash
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
