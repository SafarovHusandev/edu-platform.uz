'use client';

import { useEffect, useRef, useState } from 'react';
import { History, ListRestart, RotateCcw, Shuffle, Users } from 'lucide-react';
import { BoardLayout, boardButton } from '@/components/super-teacher/board-layout';
import { RosterSetup } from '@/components/super-teacher/roster-setup';
import { StudentAvatar } from '@/components/super-teacher/student-avatar';
import { useBoardSound } from '@/components/super-teacher/sound-toggle';
import { pickRandom, sounds, type RosterStudent } from '@/lib/class-roster';
import { cn } from '@/lib/utils';

const HUB_HREF = '/super-teacher';
const SPIN_STEPS = 22;

export default function RandomPickerPage() {
  const { muted, button: soundButton } = useBoardSound();
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [label, setLabel] = useState('');
  const [noRepeat, setNoRepeat] = useState(true);
  const [picked, setPicked] = useState<RosterStudent[]>([]);
  const [display, setDisplay] = useState<RosterStudent | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!roster) {
    return (
      <BoardLayout exitHref={HUB_HREF} controls={soundButton}>
        <RosterSetup
          title="Tasodifiy o'quvchi"
          submitLabel="Boshlash"
          onReady={(students, l) => {
            setRoster(students);
            setLabel(l);
            setPicked([]);
            setDisplay(null);
          }}
        />
      </BoardLayout>
    );
  }

  const pickedIds = new Set(picked.map((s) => s.id));
  const pool = noRepeat ? roster.filter((s) => !pickedIds.has(s.id)) : roster;
  const allDone = pool.length === 0;
  const hasAvatars = roster.some((s) => s.avatar !== undefined);
  const restart = () => {
    setPicked([]);
    setDisplay(null);
  };

  const spin = () => {
    if (spinning || allDone) return;
    const winner = pickRandom(pool);
    setSpinning(true);
    let step = 0;
    const next = () => {
      step++;
      if (step >= SPIN_STEPS) {
        setDisplay(winner);
        setPicked((p) => [winner, ...p]);
        setSpinning(false);
        if (!muted) sounds.win();
        return;
      }
      // Ism almashishi asta-sekin sekinlashadi
      setDisplay(pickRandom(roster.length > 1 ? roster : pool));
      if (!muted) sounds.tick();
      timer.current = setTimeout(next, 40 + step * step * 0.9);
    };
    next();
  };

  return (
    <BoardLayout exitHref={HUB_HREF} controls={soundButton}>
      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-8 text-center">
          <p className="flex items-center gap-2 text-xl text-white/60">
            <Users className="size-6 shrink-0" />
            <span>
              {label} · {roster.length} o&apos;quvchi
              {noRepeat && ` · ${pool.length} ta qoldi`}
            </span>
          </p>

          <div
            className={cn(
              'flex min-h-[36vh] w-full max-w-4xl flex-col items-center justify-center gap-5 overflow-hidden rounded-[32px] px-6 py-8 transition-colors sm:px-10',
              display && !spinning ? 'bg-[#26890C]' : 'bg-white/10'
            )}
          >
            {hasAvatars && display && !(allDone && !spinning) && (
              <StudentAvatar
                student={display}
                className="size-[clamp(5rem,9vw,8rem)]"
                fallbackClassName="text-[clamp(2rem,3.5vw,3.25rem)]"
              />
            )}
            <span
              className={cn(
                'max-w-full font-heading font-bold leading-tight text-balance wrap-break-word',
                display
                  ? 'text-[clamp(2rem,4.2vw,4.25rem)]'
                  : 'text-[clamp(1.75rem,3.5vw,3.25rem)] text-white/50',
                spinning && 'opacity-80'
              )}
            >
              {allDone && !spinning
                ? 'Hamma javob berdi!'
                : display
                  ? display.name
                  : 'Kim javob beradi?'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {allDone ? (
              <button
                type="button"
                onClick={restart}
                className={boardButton('primary', 'min-h-20 px-10 text-2xl')}
              >
                <RotateCcw className="size-7" /> Qayta boshlash
              </button>
            ) : (
              <button
                type="button"
                onClick={spin}
                disabled={spinning}
                className={boardButton('primary', 'min-h-20 px-12 text-2xl')}
              >
                <Shuffle className="size-7" /> Tanlash
              </button>
            )}
            <button
              type="button"
              onClick={() => setNoRepeat((v) => !v)}
              disabled={spinning}
              aria-pressed={noRepeat}
              className={boardButton(noRepeat ? 'success' : 'secondary', 'text-lg')}
            >
              {noRepeat ? 'Takrorlanmaydi' : 'Takrorlanishi mumkin'}
            </button>
            {!allDone && picked.length > 0 && (
              <button
                type="button"
                onClick={restart}
                disabled={spinning}
                className={boardButton('secondary', 'text-lg')}
              >
                <RotateCcw className="size-6" /> Qayta boshlash
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setRoster(null);
                setDisplay(null);
              }}
              disabled={spinning}
              className={boardButton('secondary', 'text-lg')}
            >
              <ListRestart className="size-6" /> Ro&apos;yxat
            </button>
          </div>
        </div>

        {picked.length > 0 && (
          <aside className="flex w-full flex-col gap-3 rounded-[24px] bg-white/5 p-5 lg:w-100">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white/70">
              <History className="size-5" /> Tanlanganlar ({picked.length})
            </h2>
            <ol className="flex max-h-[70vh] flex-col gap-1.5 overflow-y-auto">
              {picked.map((s, i) => (
                <li
                  key={`${s.id}-${picked.length - i}`}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-lg',
                    i === 0 ? 'bg-white/15 font-bold' : 'text-white/70'
                  )}
                >
                  <span className="tabular-nums">{picked.length - i}.</span>
                  {hasAvatars && <StudentAvatar student={s} className="size-8" />}
                  <span className="min-w-0 wrap-break-word">{s.name}</span>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </BoardLayout>
  );
}
