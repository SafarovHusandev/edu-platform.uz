'use client';

import { useState } from 'react';
import { Crown, ListRestart, Minus, Plus, Settings2, Shuffle } from 'lucide-react';
import { BoardLayout, boardButton } from '@/components/super-teacher/board-layout';
import { RosterSetup } from '@/components/super-teacher/roster-setup';
import { StudentAvatar } from '@/components/super-teacher/student-avatar';
import { useBoardSound } from '@/components/super-teacher/sound-toggle';
import { shuffle, sounds, type RosterStudent } from '@/lib/class-roster';
import { cn } from '@/lib/utils';

const HUB_HREF = '/super-teacher';
const TEAM_COLORS = ['#D01937', '#1368CE', '#D89E00', '#26890C', '#864CBF', '#0AA3A3', '#E2611B', '#C2185B'];

type SplitMode = 'count' | 'size';

// Muvozanatli bo'lish: guruhlar hajmi farqi ko'pi bilan 1
function split(students: RosterStudent[], groupCount: number) {
  const mixed = shuffle(students);
  const groups: RosterStudent[][] = Array.from({ length: groupCount }, () => []);
  mixed.forEach((s, i) => groups[i % groupCount].push(s));
  return groups;
}

export default function GroupsPage() {
  const { muted, button: soundButton } = useBoardSound();
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<SplitMode>('count');
  const [value, setValue] = useState(4);
  const [withLeader, setWithLeader] = useState(true);
  const [groups, setGroups] = useState<RosterStudent[][] | null>(null);

  if (!roster) {
    return (
      <BoardLayout exitHref={HUB_HREF} controls={soundButton}>
        <RosterSetup
          title="Guruhlarga bo'lish"
          minStudents={2}
          onReady={(students, l) => {
            setRoster(students);
            setLabel(l);
            setGroups(null);
            setValue((v) => Math.min(v, Math.max(2, Math.floor(students.length / 2))));
          }}
        />
      </BoardLayout>
    );
  }

  const n = roster.length;
  const maxValue = mode === 'count' ? n : Math.max(1, n - 1);
  const v = Math.min(Math.max(mode === 'count' ? 2 : 1, value), maxValue);
  const groupCount = mode === 'count' ? v : Math.ceil(n / v);

  const run = () => {
    setGroups(split(roster, Math.max(1, groupCount)));
    if (!muted) sounds.win();
  };

  if (!groups) {
    return (
      <BoardLayout exitHref={HUB_HREF} controls={soundButton}>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 text-center">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Guruhlarga bo&apos;lish</h1>
          <p className="text-xl text-white/60">
            {label} · {n} o&apos;quvchi
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setMode('count')}
              className={boardButton(mode === 'count' ? 'primary' : 'secondary')}
            >
              Guruhlar soni
            </button>
            <button
              type="button"
              onClick={() => setMode('size')}
              className={boardButton(mode === 'size' ? 'primary' : 'secondary')}
            >
              Har guruhda
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setValue(v - 1)}
              disabled={v <= (mode === 'count' ? 2 : 1)}
              className={boardButton('secondary', 'px-0')}
              aria-label="Kamaytirish"
            >
              <Minus className="size-8" />
            </button>
            <span className="min-w-32 font-heading text-8xl font-bold tabular-nums">{v}</span>
            <button
              type="button"
              onClick={() => setValue(v + 1)}
              disabled={v >= maxValue}
              className={boardButton('secondary', 'px-0')}
              aria-label="Ko'paytirish"
            >
              <Plus className="size-8" />
            </button>
          </div>
          <p className="text-xl text-white/70">
            {mode === 'count'
              ? `Har guruhda ${Math.floor(n / groupCount)}${n % groupCount ? `–${Math.ceil(n / groupCount)}` : ''} kishi`
              : `${groupCount} ta guruh`}
          </p>

          <button
            type="button"
            onClick={() => setWithLeader((x) => !x)}
            aria-pressed={withLeader}
            className={boardButton(withLeader ? 'success' : 'secondary', 'text-lg')}
          >
            <Crown className="size-6" /> {withLeader ? 'Sardor tanlanadi' : 'Sardorsiz'}
          </button>

          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={run} className={boardButton('primary', 'min-h-20 px-12 text-2xl')}>
              <Shuffle className="size-7" /> Bo&apos;lish
            </button>
            <button type="button" onClick={() => setRoster(null)} className={boardButton('secondary', 'text-lg')}>
              <ListRestart className="size-6" /> Ro&apos;yxat
            </button>
          </div>
        </div>
      </BoardLayout>
    );
  }

  const cols =
    groups.length <= 2 ? 'sm:grid-cols-2' : groups.length <= 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <BoardLayout exitHref={HUB_HREF} controls={soundButton}>
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 pr-0 lg:pr-72">
          <button type="button" onClick={run} className={boardButton('primary')}>
            <Shuffle className="size-6" /> Qayta aralashtirish
          </button>
          <button type="button" onClick={() => setGroups(null)} className={boardButton('secondary', 'text-lg')}>
            <Settings2 className="size-6" /> Sozlash
          </button>
        </div>
        <div className={cn('grid flex-1 content-start gap-4', cols)}>
          {groups.map((members, gi) => (
            <section
              key={gi}
              className="flex flex-col gap-3 rounded-[24px] p-5"
              style={{ backgroundColor: TEAM_COLORS[gi % TEAM_COLORS.length] }}
            >
              <h2 className="flex items-baseline justify-between font-heading text-3xl font-bold">
                {gi + 1}-guruh
                <span className="text-lg font-semibold text-white/80">{members.length} kishi</span>
              </h2>
              <ul className="flex flex-col gap-1.5">
                {members.map((s, i) => (
                  <li
                    key={s.id}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2 text-xl',
                      withLeader && i === 0 ? 'bg-white/25 font-bold' : 'bg-black/10'
                    )}
                  >
                    {s.avatar !== undefined && (
                      <StudentAvatar student={s} className="size-9" fallbackClassName="bg-black/20" />
                    )}
                    {withLeader && i === 0 && <Crown className="size-5 shrink-0" aria-label="Sardor" />}
                    <span className="wrap-break-word">{s.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </BoardLayout>
  );
}
