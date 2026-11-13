'use client';

import MDEditor from '@uiw/react-md-editor/nohighlight';
import rehypeSanitize from 'rehype-sanitize';
import { toServerUrl } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';

type Variant = 'board' | 'phone' | 'card';

const VARIANT_CLASS: Record<Variant, string> = {
  board: 'live-md-board',
  phone: 'live-md-phone',
  card: 'live-md-card',
};

// Savol matnini xavfsiz ko'rsatish (muharrirdan tashqarida faqat shu komponent).
// rehype-sanitize MAJBURIY — XSS himoyasi. Rasm yo'llari nisbiy keladi
// (/uploads/...) va server manziliga ulanadi.
export function QuestionMarkdown({
  text,
  variant = 'card',
  className,
  onImageClick,
}: {
  text: string;
  variant?: Variant;
  className?: string;
  onImageClick?: (src: string) => void;
}) {
  return (
    <MDEditor.Markdown
      source={text}
      disableCopy
      rehypePlugins={[rehypeSanitize]}
      className={cn('live-md', VARIANT_CLASS[variant], className)}
      components={{
        img: ({ src, alt }) => {
          const url = toServerUrl(typeof src === 'string' ? src : undefined);
          if (!url) return null;
          // eslint-disable-next-line @next/next/no-img-element
          const img = <img src={url} alt={alt ?? ''} loading="lazy" />;
          return onImageClick ? (
            <button
              type="button"
              className="live-md-zoom"
              onClick={() => onImageClick(url)}
              aria-label="Rasmni kattalashtirish"
            >
              {img}
            </button>
          ) : (
            img
          );
        },
      }}
    />
  );
}
