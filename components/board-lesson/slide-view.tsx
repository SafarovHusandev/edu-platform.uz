'use client';

import { createElement } from 'react';
import { Star } from 'lucide-react';
import { QuestionMarkdown } from '@/components/live-quiz/question-markdown';
import { LESSON_ICONS, lessonTheme } from '@/lib/board-lesson';
import { toServerUrl } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { BoardLessonSlide, LessonThemeKey } from '@/types/board-lesson';

const SPARKS = [
  { top: '12%', left: '8%', size: 'size-6', delay: '0s' },
  { top: '22%', left: '88%', size: 'size-8', delay: '0.8s' },
  { top: '78%', left: '6%', size: 'size-5', delay: '1.4s' },
  { top: '84%', left: '92%', size: 'size-7', delay: '0.4s' },
  { top: '50%', left: '96%', size: 'size-4', delay: '2s' },
  { top: '6%', left: '55%', size: 'size-4', delay: '1.1s' },
];

// Rangli harakatlanuvchi fon: gradient + suzuvchi "pufaklar" + miltillovchi yulduzchalar
export function LessonBackdrop({
  theme,
  children,
  className,
}: {
  theme?: LessonThemeKey | null;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = lessonTheme(theme);
  return (
    <div
      className={cn('relative isolate overflow-hidden text-white', t.gradient, className)}
      style={{ '--lesson-accent': t.accent } as React.CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="lesson-blob absolute -left-[10%] -top-[15%] size-[45vmax] rounded-full opacity-35 blur-3xl"
          style={{ backgroundColor: t.blob1 }}
        />
        <div
          className="lesson-blob absolute -bottom-[20%] -right-[10%] size-[40vmax] rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: t.blob2, animationDelay: '-7s' }}
        />
        {SPARKS.map((s, i) => (
          <Star
            key={i}
            className={cn('lesson-twinkle absolute fill-current', s.size)}
            style={{ top: s.top, left: s.left, color: t.accent, animationDelay: s.delay }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

// Slayd bezak belgisi (kalit bo'yicha lucide ikonka)
export function LessonIcon({
  name,
  className,
  strokeWidth,
}: {
  name?: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  const entry = name ? LESSON_ICONS[name] : undefined;
  return entry ? createElement(entry.icon, { className, strokeWidth }) : null;
}

export function SlideView({
  slide,
  lessonThemeKey,
  className,
}: {
  slide: BoardLessonSlide;
  lessonThemeKey?: LessonThemeKey | null;
  className?: string;
}) {
  const t = lessonTheme(slide.theme ?? lessonThemeKey);
  const hasIcon = !!(slide.icon && LESSON_ICONS[slide.icon]);
  const image = toServerUrl(slide.image);
  const layout = slide.layout === 'text' || !image ? 'text' : slide.layout;

  const heading = (slide.title || hasIcon) && (
    <div className={cn('flex items-center gap-5', layout === 'image' && 'justify-center')}>
      {hasIcon && (
        <span
          className="lesson-bob flex size-[clamp(4rem,7vw,6.5rem)] shrink-0 items-center justify-center rounded-[28%] shadow-[0_10px_0_rgb(0_0_0/0.2)]"
          style={{ backgroundColor: t.accent }}
        >
          <LessonIcon name={slide.icon} className="size-[55%] text-[#1B1B3A]" strokeWidth={2.2} />
        </span>
      )}
      {slide.title && (
        <h2 className="font-heading text-[clamp(2.25rem,4.4vw,4.75rem)] font-bold leading-[1.08] text-balance drop-shadow-[0_3px_0_rgb(0_0_0/0.18)]">
          {slide.title}
        </h2>
      )}
    </div>
  );

  const body = slide.body.trim() && <QuestionMarkdown text={slide.body} variant="slide" />;

  if (layout === 'image') {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center gap-6 text-center', className)}>
        {heading}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="max-h-[52vh] max-w-full rounded-[28px] border-[6px] border-white/90 object-contain shadow-2xl"
        />
        {body && <div className="max-w-5xl">{body}</div>}
      </div>
    );
  }

  if (layout === 'split') {
    return (
      <div className={cn('grid h-full items-center gap-10 lg:grid-cols-[1.1fr_1fr]', className)}>
        <div className="flex min-w-0 flex-col gap-6">
          {heading}
          {body}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="mx-auto max-h-[62vh] max-w-full rotate-[1.5deg] rounded-[28px] border-[6px] border-white/90 object-contain shadow-2xl"
        />
      </div>
    );
  }

  return (
    <div className={cn('mx-auto flex h-full w-full max-w-6xl flex-col justify-center gap-7', className)}>
      {heading}
      {body}
    </div>
  );
}
