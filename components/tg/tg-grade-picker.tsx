'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { TargetGradeInput } from '@/hooks/use-quizzes';
import { GRADE_LETTERS } from '@/lib/class-roster';
import { haptic } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';

function gradeKey(g: Pick<TargetGradeInput, 'number' | 'letter'>) {
  return `${g.number}-${g.letter ?? '*'}`;
}

// Test sinflarini tanlash: avval sinf raqami, keyin parallel (yoki "Barchasi").
// Test yaratish (2-bosqich) va tahrir sahifasida ishlatiladi.
export function TgGradePicker({
  value,
  onChange,
  disabled,
}: {
  value: TargetGradeInput[];
  onChange: (grades: TargetGradeInput[]) => void;
  disabled?: boolean;
}) {
  const [gradeNumber, setGradeNumber] = useState<number | null>(value[0]?.number ?? null);
  const selected = new Set(value.map(gradeKey));

  function toggle(letter: string | null) {
    if (!gradeNumber || disabled) return;
    const entry: TargetGradeInput = letter ? { number: gradeNumber, letter } : { number: gradeNumber };
    const key = gradeKey(entry);
    haptic('selection');
    if (selected.has(key)) {
      onChange(value.filter((g) => gradeKey(g) !== key));
      return;
    }
    // "Barchasi" tanlansa shu raqamdagi alohida parallellar keraksiz va aksincha
    const rest = letter
      ? value.filter((g) => !(g.number === gradeNumber && !g.letter))
      : value.filter((g) => g.number !== gradeNumber);
    onChange([...rest, entry]);
  }

  const optionClass = (active: boolean) =>
    cn(
      'h-10 min-w-11 rounded-xl px-3 text-sm font-semibold transition-colors disabled:opacity-50',
      active ? 'bg-primary text-primary-foreground' : 'border border-input bg-card active:bg-muted'
    );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">Sinf</span>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => {
            const used = value.some((g) => g.number === n);
            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                aria-pressed={gradeNumber === n}
                onClick={() => {
                  haptic('selection');
                  setGradeNumber(n);
                }}
                className={cn(
                  'relative h-11 rounded-xl font-heading text-sm font-bold transition-colors disabled:opacity-50',
                  gradeNumber === n
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-card active:bg-muted'
                )}
              >
                {n}
                {used && gradeNumber !== n && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {gradeNumber && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">{gradeNumber}-sinf parallellari</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={disabled}
              aria-pressed={selected.has(gradeKey({ number: gradeNumber }))}
              onClick={() => toggle(null)}
              className={optionClass(selected.has(gradeKey({ number: gradeNumber })))}
            >
              Barchasi
            </button>
            {GRADE_LETTERS.map((letter) => {
              const active = selected.has(gradeKey({ number: gradeNumber, letter }));
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => toggle(letter)}
                  className={optionClass(active)}
                >
                  {gradeNumber}-{letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5">
        <span className="text-[13px] font-semibold">Tanlangan sinflar</span>
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">Hali sinf tanlanmagan</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {value.map((g) => (
              <span
                key={gradeKey(g)}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pr-1 pl-3 text-sm font-semibold text-primary"
              >
                {g.letter ? `${g.number}-${g.letter}` : `${g.number}-sinf (barchasi)`}
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${g.letter ? `${g.number}-${g.letter}` : `${g.number}-sinf`} ni olib tashlash`}
                  onClick={() => {
                    haptic('selection');
                    onChange(value.filter((x) => gradeKey(x) !== gradeKey(g)));
                  }}
                  className="flex size-6 items-center justify-center rounded-full active:bg-primary/15"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
