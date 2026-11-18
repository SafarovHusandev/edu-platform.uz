'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Loader2, School, UserX, Users } from 'lucide-react';
import { boardButton } from '@/components/super-teacher/board-layout';
import { StudentAvatar } from '@/components/super-teacher/student-avatar';
import { classRosterErrorMessage, useClassRoster } from '@/hooks/use-class-roster';
import {
  GRADE_LETTERS,
  GRADE_NUMBERS,
  parseNames,
  readRosterSource,
  saveRosterSource,
  type RosterStudent,
} from '@/lib/class-roster';
import { cn } from '@/lib/utils';

type Mode = 'class' | 'manual';

const chip =
  'min-h-14 min-w-14 rounded-xl px-4 text-xl font-bold transition-colors select-none active:scale-[0.97]';

// Tasodifiy o'quvchi va guruhlarga bo'lish uchun umumiy "kimlar bor?" ekrani.
// Sinf ro'yxati backenddan keladi; bo'lmasa — qo'lda kiritiladi.
export function RosterSetup({
  title,
  minStudents = 1,
  submitLabel = 'Davom etish',
  onReady,
}: {
  title: string;
  minStudents?: number;
  submitLabel?: string;
  onReady: (students: RosterStudent[], label: string) => void;
}) {
  // Oxirgi tanlovni tiklash. (board) layout rol tekshirilguncha bolalarni
  // render qilmaydi, shuning uchun bu faqat clientda ishlaydi.
  const [saved] = useState(() => (typeof window === 'undefined' ? null : readRosterSource()));
  const [mode, setMode] = useState<Mode>(saved?.mode ?? 'class');
  const [grade, setGrade] = useState(saved?.mode === 'class' ? saved.grade : undefined);
  const [letter, setLetter] = useState(saved?.mode === 'class' ? saved.letter : undefined);
  const [text, setText] = useState(saved?.mode === 'manual' ? saved.text : '');
  const [absent, setAbsent] = useState<Set<string>>(new Set());

  const roster = useClassRoster(mode === 'class' ? grade : undefined, mode === 'class' ? letter : undefined);
  const manualStudents = useMemo(() => parseNames(text), [text]);

  const students = mode === 'class' ? (roster.data ?? []) : manualStudents;
  const present = students.filter((s) => !absent.has(s.id));
  const classUnavailable = mode === 'class' && roster.isError;

  const toggleAbsent = (id: string) =>
    setAbsent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (present.length < minStudents) return;
    if (mode === 'class' && grade && letter) {
      saveRosterSource({ mode: 'class', grade, letter });
      onReady(present, `${grade}-${letter} sinf`);
    } else {
      saveRosterSource({ mode: 'manual', text });
      onReady(present, "Ro'yxat");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
      <h1 className="font-heading text-4xl font-bold sm:text-5xl">{title}</h1>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode('class')}
          className={boardButton(mode === 'class' ? 'primary' : 'secondary')}
        >
          <School className="size-6" /> Sinfdan
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={boardButton(mode === 'manual' ? 'primary' : 'secondary')}
        >
          <Users className="size-6" /> Qo&apos;lda kiritish
        </button>
      </div>

      {mode === 'class' ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <span className="text-lg text-white/70">Sinf</span>
            <div className="flex flex-wrap gap-2">
              {GRADE_NUMBERS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setGrade(n);
                    setAbsent(new Set());
                  }}
                  className={cn(chip, grade === n ? 'bg-white text-[#141B3D]' : 'bg-white/10 text-white')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-lg text-white/70">Guruh</span>
            <div className="flex flex-wrap gap-2">
              {GRADE_LETTERS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLetter(l);
                    setAbsent(new Set());
                  }}
                  className={cn(chip, letter === l ? 'bg-white text-[#141B3D]' : 'bg-white/10 text-white')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {roster.isFetching && (
            <div className="flex items-center gap-3 text-white/70">
              <Loader2 className="size-6 animate-spin" /> Yuklanmoqda...
            </div>
          )}
          {classUnavailable && (
            <div className="rounded-2xl bg-white/10 p-5 text-lg">
              {classRosterErrorMessage(roster.error)}.{' '}
              <button type="button" className="font-bold underline" onClick={() => setMode('manual')}>
                Ismlarni qo&apos;lda kiriting
              </button>
            </div>
          )}
          {roster.isSuccess && students.length === 0 && (
            <div className="rounded-2xl bg-white/10 p-5 text-lg">
              Bu sinfda o&apos;quvchilar topilmadi.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-lg text-white/70">Har qatorga bitta ism yozing</span>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setAbsent(new Set());
            }}
            rows={8}
            placeholder={'Aliyev Ali\nValiyeva Malika\n...'}
            className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-xl text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
          />
        </div>
      )}

      {students.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 text-lg text-white/70">
            <UserX className="size-5" /> Kelmaganlarni bosib belgilang · {present.length}/{students.length}{' '}
            o&apos;quvchi
          </span>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => {
              const isAbsent = absent.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleAbsent(s.id)}
                  aria-pressed={!isAbsent}
                  className={cn(
                    'flex min-h-12 items-center gap-2 rounded-xl px-4 text-lg font-semibold transition-colors select-none',
                    s.avatar !== undefined && 'pl-2',
                    isAbsent ? 'bg-white/5 text-white/35 line-through' : 'bg-white/15 text-white'
                  )}
                >
                  {s.avatar !== undefined && (
                    <StudentAvatar student={s} className={cn('size-9', isAbsent && 'opacity-40')} />
                  )}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={submit}
          disabled={present.length < minStudents}
          className={boardButton('success', 'w-full sm:w-auto sm:px-10')}
        >
          {submitLabel} <ArrowRight className="size-6" />
        </button>
        {present.length > 0 && present.length < minStudents && (
          <p className="mt-2 text-white/60">Kamida {minStudents} ta o&apos;quvchi kerak</p>
        )}
      </div>
    </div>
  );
}
