'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { BoardLayout, boardButton } from '@/components/super-teacher/board-layout';
import { useBoardSound } from '@/components/super-teacher/sound-toggle';
import { sounds } from '@/lib/class-roster';
import { cn } from '@/lib/utils';

const HUB_HREF = '/super-teacher';
const PRESETS = [30, 60, 120, 180, 300, 600, 900, 1200];
const MAX_SEC = 99 * 60 + 59;
const DURATION_KEY = 'st-timer-duration';

type Status = 'idle' | 'running' | 'paused' | 'done';

function formatTime(totalSec: number) {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function presetLabel(sec: number) {
  return sec < 60 ? `${sec} s` : `${sec / 60} daq`;
}

export default function TimerPage() {
  const { muted, button: soundButton } = useBoardSound();
  const [duration, setDuration] = useState(() => {
    try {
      const v = Number(typeof window !== 'undefined' && localStorage.getItem(DURATION_KEY));
      return v > 0 && v <= MAX_SEC ? v : 300;
    } catch {
      return 300;
    }
  });
  const [status, setStatus] = useState<Status>('idle');
  // running: endAt bo'yicha hisoblanadi (tab fonda bo'lsa ham aniq); paused: remainingMs
  const [endAt, setEndAt] = useState(0);
  const [remainingMs, setRemainingMs] = useState(duration * 1000);
  const [now, setNow] = useState(0);
  const lastBeep = useRef<number | null>(null);

  const leftMs = status === 'running' ? Math.max(0, endAt - now) : remainingMs;
  const leftSec = Math.ceil(leftMs / 1000);
  const total = Math.max(duration * 1000, leftMs);
  const progress = status === 'idle' ? 1 : leftMs / total;
  const warning = status === 'running' && leftSec <= 10;

  const setDurationSaved = useCallback((sec: number) => {
    const v = Math.min(MAX_SEC, Math.max(5, sec));
    setDuration(v);
    setRemainingMs(v * 1000);
    try {
      localStorage.setItem(DURATION_KEY, String(v));
    } catch {}
  }, []);

  const start = useCallback(() => {
    const ms = status === 'paused' ? remainingMs : duration * 1000;
    const t = Date.now();
    setNow(t);
    setEndAt(t + ms);
    lastBeep.current = null;
    setStatus('running');
  }, [status, remainingMs, duration]);

  const pause = useCallback(() => {
    setRemainingMs(Math.max(0, endAt - Date.now()));
    setStatus('paused');
  }, [endAt]);

  const reset = useCallback(() => {
    setRemainingMs(duration * 1000);
    setStatus('idle');
  }, [duration]);

  const addTime = (sec: number) => {
    if (status === 'running') setEndAt((e) => e + sec * 1000);
    else if (status === 'paused') setRemainingMs((r) => Math.min(MAX_SEC * 1000, r + sec * 1000));
    else if (status === 'done') {
      const t = Date.now();
      setNow(t);
      setEndAt(t + sec * 1000);
      setStatus('running');
    }
  };

  // Tik-tak
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [status]);

  // Tugash va oxirgi 5 soniya signali
  useEffect(() => {
    if (status !== 'running') return;
    if (leftMs <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('done');
      setRemainingMs(0);
      if (!muted) sounds.alarm();
      return;
    }
    if (leftSec <= 5 && lastBeep.current !== leftSec) {
      lastBeep.current = leftSec;
      if (!muted) sounds.beep();
    }
  }, [status, leftMs, leftSec, muted]);

  // Klaviatura: Probel — start/pauza, R — qaytadan
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'running') pause();
        else if (status !== 'done') start();
      } else if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, start, pause, reset]);

  const done = status === 'done';

  return (
    <BoardLayout
      exitHref={HUB_HREF}
      controls={soundButton}
      className={cn('transition-colors duration-500', done && 'animate-pulse bg-[#D01937]')}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {status === 'idle' && (
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDurationSaved(sec)}
                className={cn(
                  'min-h-14 rounded-xl px-5 text-xl font-bold transition-colors select-none active:scale-[0.97]',
                  duration === sec ? 'bg-white text-[#141B3D]' : 'bg-white/10 text-white'
                )}
              >
                {presetLabel(sec)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 sm:gap-8">
          {status === 'idle' && (
            <button
              type="button"
              onClick={() => setDurationSaved(duration - (duration > 60 ? 60 : 10))}
              className={boardButton('secondary', 'px-0')}
              aria-label="Kamaytirish"
            >
              <Minus className="size-8" />
            </button>
          )}
          <span
            className={cn(
              'font-heading font-bold tabular-nums leading-none',
              'text-[min(20vw,35vh)]',
              warning && 'text-[#FFB020]'
            )}
            role="timer"
            aria-live="off"
          >
            {done ? '00:00' : formatTime(status === 'idle' ? duration : leftSec)}
          </span>
          {status === 'idle' && (
            <button
              type="button"
              onClick={() => setDurationSaved(duration + 60)}
              className={boardButton('secondary', 'px-0')}
              aria-label="Ko'paytirish"
            >
              <Plus className="size-8" />
            </button>
          )}
        </div>

        {done ? (
          <p className="font-heading text-5xl font-bold sm:text-6xl">Vaqt tugadi!</p>
        ) : (
          <div className="h-4 w-full max-w-4xl overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-200 ease-linear',
                warning ? 'bg-[#FFB020]' : 'bg-white'
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {status === 'running' ? (
            <button
              type="button"
              onClick={pause}
              className={boardButton('primary', 'min-h-20 px-12 text-2xl')}
            >
              <Pause className="size-7" /> Pauza
            </button>
          ) : (
            !done && (
              <button
                type="button"
                onClick={start}
                className={boardButton('success', 'min-h-20 px-12 text-2xl')}
              >
                <Play className="size-7" /> {status === 'paused' ? 'Davom etish' : 'Boshlash'}
              </button>
            )
          )}
          {status !== 'idle' && (
            <>
              <button
                type="button"
                onClick={() => addTime(60)}
                className={boardButton('secondary')}
              >
                <Plus className="size-6" /> 1 daqiqa
              </button>
              <button
                type="button"
                onClick={reset}
                className={boardButton(
                  done ? 'primary' : 'secondary',
                  done ? 'min-h-20 px-10 text-2xl' : ''
                )}
              >
                <RotateCcw className="size-6" /> Qaytadan
              </button>
            </>
          )}
        </div>
      </div>
    </BoardLayout>
  );
}
