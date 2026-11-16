'use client';

import { useLayoutEffect, useRef } from 'react';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { toServerUrl } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';

const MIN_PX = 14;

// Ekran kengligiga qarab eng katta shrift: 360px da ~24px, kompyuterda 64px gacha
// (globals.css dagi .live-md-phone clamp bilan bir xil formula)
function maxFontPx() {
  const w = window.innerWidth;
  return Math.min(64, Math.max(24, 14.4 + 0.028 * w));
}

// Telefon uchun savol bloki: matn shriftini blokka scroll'siz sig'adigan eng katta
// o'lchamga tushiradi (qisqa savol — katta, uzun savol — kichikroq). Blok o'lchami
// o'zgarsa yoki rasm yuklansa qayta hisoblanadi. Shrift --q-fit CSS o'zgaruvchisi
// orqali beriladi — React qayta render qilinmaydi.
export function FitQuestion({
  text,
  image,
  onImageClick,
  className,
}: {
  text: string;
  image?: string | null;
  onImageClick?: (src: string) => void;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imageUrl = toServerUrl(image);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let frame = 0;

    const fits = (px: number) => {
      box.style.setProperty('--q-fit', `${px}px`);
      return box.scrollHeight <= box.clientHeight + 1;
    };

    const fit = () => {
      const max = maxFontPx();
      if (fits(max)) return;
      // Ikkilik qidiruv: sig'adigan eng katta butun piksel
      let lo = MIN_PX;
      let hi = max;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      fits(lo);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    // Rasm yuklangach balandlik o'zgaradi (load hodisasi bubble qilmaydi — capture)
    box.addEventListener('load', schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      box.removeEventListener('load', schedule, true);
    };
  }, [text, imageUrl]);

  return (
    <div
      ref={boxRef}
      className={cn(
        'live-fit-question overflow-y-auto rounded-2xl bg-white/5 px-4 py-3.5 sm:px-6 sm:py-5',
        className
      )}
    >
      <QuestionMarkdown text={text} variant="phone" onImageClick={onImageClick} />
      {imageUrl && (
        <button
          type="button"
          className="mt-2 block cursor-zoom-in"
          onClick={() => onImageClick?.(imageUrl)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="max-h-[16svh] rounded-xl object-contain" />
        </button>
      )}
    </div>
  );
}
