'use client';

import { useCallback, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { boardButton } from '@/components/super-teacher/board-layout';

const KEY = 'st-sound-muted';

// Doska asboblari uchun ovozni o'chirish/yoqish (tanlov eslab qolinadi)
export function useBoardSound() {
  const [muted, setMuted] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setMuted((m) => {
      try {
        localStorage.setItem(KEY, m ? '0' : '1');
      } catch {}
      return !m;
    });
  }, []);

  const button = (
    <button
      type="button"
      onClick={toggle}
      className={boardButton('secondary', 'min-h-14 min-w-14 px-0 sm:min-h-16 sm:min-w-16')}
      aria-label={muted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
      title={muted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
    >
      {muted ? <VolumeX className="size-7" /> : <Volume2 className="size-7" />}
    </button>
  );

  return { muted, button };
}
