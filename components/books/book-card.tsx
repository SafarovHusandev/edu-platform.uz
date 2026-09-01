import Link from 'next/link';
import Image from 'next/image';
import { BookMarked, Download } from 'lucide-react';
import type { Book } from '@/types';
import { formatNumber } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/config';

export function BookCard({ book }: { book: Book }) {
  const category = typeof book.category === 'object' ? book.category?.name : undefined;
  const cover = resolveAssetUrl(book.coverImage);

  return (
    <Link href={`/books/${book._id}`} className="group block h-full select-none outline-none">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 dark:border-border/60 dark:hover:border-primary/50 dark:hover:shadow-primary/10">
        {/* Cover */}
        <div className="relative aspect-3/4 w-full overflow-hidden bg-muted/70">
          {cover ? (
            <Image
              src={cover}
              alt={book.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="relative flex size-full items-center justify-center bg-linear-to-br from-primary/15 via-primary/5 to-accent/30">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background/80 shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <BookMarked className="size-7 text-primary" />
              </div>
            </div>
          )}

          {/* Subtle gradient vignette overlay at bottom */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

          {book.grade != null && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-background/85 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-md">
              {book.grade}-sinf
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between gap-2 p-4">
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
              {book.title}
            </h3>
            <p className="line-clamp-1 text-sm text-muted-foreground">{book.author}</p>
            {category && (
              <span className="inline-flex w-fit items-center rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {category}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-base font-bold text-success">Bepul</span>
            {book.downloadsCount !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="size-3.5" />
                {formatNumber(book.downloadsCount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
      <div className="aspect-3/4 w-full animate-pulse bg-muted/80" />
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="space-y-2">
          <div className="h-4.5 w-4/5 animate-pulse rounded bg-muted/80" />
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-muted/80" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-muted/80" />
        </div>
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <div className="h-4.5 w-12 animate-pulse rounded bg-muted/80" />
          <div className="h-3.5 w-10 animate-pulse rounded bg-muted/80" />
        </div>
      </div>
    </div>
  );
}
