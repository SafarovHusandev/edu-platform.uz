'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  ChevronDown,
  Layers,
  Lightbulb,
  Plus,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getMinQuestions } from '@/lib/quiz-rules';

export const ALL_LETTERS_VALUE = 'all';

export interface TargetGradeEntry {
  number: string;
  letter: string; // ALL_LETTERS_VALUE = barcha guruhlar
  availableFrom: string;
  availableUntil: string;
  maxAttempts: string;
  timeLimit: string;
}

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));
const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function entryLabel(entry: TargetGradeEntry) {
  return entry.letter === ALL_LETTERS_VALUE
    ? `${entry.number}-sinf (barcha guruhlar)`
    : `${entry.number}-${entry.letter}`;
}

interface TargetGradesEditorProps {
  value: TargetGradeEntry[];
  onChange: (value: TargetGradeEntry[]) => void;
  // O'quvchiga qancha urinish berilgan holda, foydalanuvchi (o'qituvchi)
  // premium emasligini bildiradi — shunda 1dan katta qiymatlar uchun
  // muloyim Premium eslatmasi ko'rsatiladi.
  isPremium?: boolean;
}

export function TargetGradesEditor({ value, onChange, isPremium }: TargetGradesEditorProps) {
  const [addNumber, setAddNumber] = useState('');
  const [addLetter, setAddLetter] = useState(ALL_LETTERS_VALUE);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function handleAdd() {
    if (!addNumber) return;
    const exists = value.some((e) => e.number === addNumber && e.letter === addLetter);
    if (exists) return;
    onChange([
      ...value,
      {
        number: addNumber,
        letter: addLetter,
        availableFrom: '',
        availableUntil: '',
        maxAttempts: '',
        timeLimit: '',
      },
    ]);
    setAddNumber('');
    setAddLetter(ALL_LETTERS_VALUE);
  }

  function removeEntry(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
    setExpanded((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  }

  function updateEntry(idx: number, patch: Partial<TargetGradeEntry>) {
    onChange(value.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function toggleExpanded(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const minQuestions =
    value.length > 0 ? Math.max(...value.map((e) => getMinQuestions(Number(e.number)))) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-24 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Raqam</label>
          <Select
            value={addNumber}
            onValueChange={(v) => setAddNumber(v ?? '')}
            items={GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` }))}
          >
            <SelectTrigger className="h-11 w-full rounded-md">
              <SelectValue placeholder="Sinf" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_NUMBERS.map((n) => (
                <SelectItem key={n} value={n} className="py-2 text-base">
                  {n}-sinf
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-24 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Guruh</label>
          <Select
            value={addLetter}
            onValueChange={(v) => setAddLetter(v ?? ALL_LETTERS_VALUE)}
            items={[
              { value: ALL_LETTERS_VALUE, label: 'Hammasi' },
              ...GRADE_LETTERS.map((l) => ({ value: l, label: l })),
            ]}
          >
            <SelectTrigger className="h-11 w-full rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LETTERS_VALUE} className="py-2 text-base">
                Hammasi
              </SelectItem>
              {GRADE_LETTERS.map((l) => (
                <SelectItem key={l} value={l} className="py-2 text-base">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-md"
          onClick={handleAdd}
          disabled={!addNumber}
        >
          <Plus className="size-4" /> Sinf qo&apos;shish
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-6 text-center">
          <Layers className="size-5 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Hali sinf qo&apos;shilmagan</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {value.map((entry, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-md border border-border/70 bg-background shadow-xs"
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Badge className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                  {entryLabel(entry)}
                </Badge>
                <button
                  type="button"
                  onClick={() => toggleExpanded(idx)}
                  className={cn(
                    'ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    expanded.has(idx)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <SlidersHorizontal className="size-3.5" />
                  Kengaytirilgan sozlamalar
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform',
                      expanded.has(idx) && 'rotate-180'
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  aria-label="Sinfni o'chirish"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
              {expanded.has(idx) && (
                <div className="space-y-3 border-t border-border/70 bg-muted/30 p-3.5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Boshlanish vaqti
                      </label>
                      <div className="relative">
                        <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          className="h-11 rounded-md bg-background pl-9"
                          value={entry.availableFrom}
                          onChange={(e) => updateEntry(idx, { availableFrom: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Tugash vaqti
                      </label>
                      <div className="relative">
                        <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          className="h-11 rounded-md bg-background pl-9"
                          value={entry.availableUntil}
                          onChange={(e) => updateEntry(idx, { availableUntil: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Urinishlar soni
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Umumiy"
                        className="h-11 rounded-md bg-background"
                        value={entry.maxAttempts}
                        onChange={(e) => updateEntry(idx, { maxAttempts: e.target.value })}
                      />
                      {!isPremium && Number(entry.maxAttempts) > 1 && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-gold-foreground">
                          <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                          Ajoyib! Endi bu sonni ishga tushirish uchun Premium kerak bo&apos;ladi —{' '}
                          <Link href="/premium" className="font-medium underline underline-offset-2">
                            batafsil
                          </Link>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Vaqt (daqiqa)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Umumiy"
                        className="h-11 rounded-md bg-background"
                        value={entry.timeLimit}
                        onChange={(e) => updateEntry(idx, { timeLimit: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bo&apos;sh qoldirsangiz, umumiy sozlama (yuqoridagi) ishlatiladi
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {minQuestions != null && (
        <p className="rounded-md bg-primary/5 px-3 py-2 text-xs font-medium text-muted-foreground">
          Tanlangan sinflar orasidagi eng yuqori talab: kamida {minQuestions} ta savol kerak
          bo&apos;ladi
        </p>
      )}
    </div>
  );
}
