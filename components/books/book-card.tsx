import Link from 'next/link';
import { Download } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Book } from '@/types';

// Muqova rasmi bo'lmaganda — rangli fon ustida kitob nomi (dizayn: Main / Library)
const BOOK_TONES = [
  'bg-accent-foreground text-white',
  'bg-success text-success-foreground',
  'bg-[#B45309] text-white',
  'bg-primary text-primary-foreground',
  'bg-admin text-admin-foreground',
] as const;

export function BookCover({
  book,
  index = 0,
  className,
}: {
  book: Pick<Book, 'title' | 'coverImage'>;
  index?: number;
  className?: string;
}) {
  const cover = resolveAssetUrl(book.coverImage);
  if (cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cover}
        alt=""
        className={cn('aspect-3/4 w-full rounded-[14px] object-cover', className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex aspect-3/4 w-full items-end rounded-[14px] p-[18px] font-heading text-lg font-semibold leading-tight',
        BOOK_TONES[index % BOOK_TONES.length],
        className
      )}
    >
      {book.title}
    </div>
  );
}

export function BookCard({
  book,
  index = 0,
  basePath = '/books',
}: {
  book: Book;
  index?: number;
  basePath?: string;
}) {
  const category = typeof book.category === 'object' ? book.category?.name : undefined;

  return (
    <Link href={`${basePath}/${book._id}`} className="group flex h-full flex-col gap-2.5">
      <div className="overflow-hidden rounded-[14px]">
        <BookCover
          book={book}
          index={index}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="line-clamp-2 font-semibold group-hover:text-primary">{book.title}</div>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="truncate">
          {[book.grade != null ? `${book.grade}-sinf` : null, category]
            .filter(Boolean)
            .join(' · ') || book.author}
        </span>
        {book.downloadsCount ? (
          <span className="flex shrink-0 items-center gap-0.5 text-xs">
            <Download className="size-3" /> {formatNumber(book.downloadsCount)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="aspect-3/4 animate-pulse rounded-[14px] bg-muted" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      <div className="h-3.5 w-3/5 animate-pulse rounded bg-muted" />
    </div>
  );
}
