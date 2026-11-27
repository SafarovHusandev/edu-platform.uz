'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookMarked } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
} from '@/components/tg/tg-ui';
import { useBooks } from '@/hooks/use-books';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import type { Book } from '@/types';

// uploadedBy=me — backend o'zi filtrlaydi (qoralamalar ham keladi)
const PAGE_SIZE = 20;

function BookCard({ book }: { book: Book }) {
  const cover = resolveAssetUrl(book.coverImage);
  return (
    <Link
      href={`/teacher/books/${book._id}`}
      className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border bg-card p-2.5 active:bg-muted"
    >
      {cover ? (
        <div className="aspect-3/4 overflow-hidden rounded-[10px] bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" loading="lazy" className="size-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-3/4 items-end rounded-[10px] bg-primary p-2.5 font-heading text-[13px] font-semibold text-primary-foreground">
          <span className="line-clamp-4 wrap-break-word">{book.title}</span>
        </div>
      )}
      <span className="line-clamp-2 text-[13px] font-bold">{book.title}</span>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-xs text-muted-foreground">
          {[book.grade ? `${book.grade}-sinf` : null, `↓ ${formatNumber(book.downloadsCount ?? 0)}`]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <TgPill tone={book.isPublished ? 'success' : 'neutral'} className="px-1.5 text-[10px]">
          {book.isPublished ? 'Nashr' : 'Qoralama'}
        </TgPill>
      </div>
    </Link>
  );
}

function BooksChunk({ page }: { page: number }) {
  const query = useBooks({ uploadedBy: 'me', page, limit: PAGE_SIZE });
  if (query.isLoading) return <TgSkeletonList count={2} height={220} />;
  if (query.isError) return <TgError onRetry={() => query.refetch()} />;
  const items = query.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
}

export default function TgTeacherBooksPage() {
  const router = useRouter();
  const [pages, setPages] = useState(1);
  const first = useBooks({ uploadedBy: 'me', page: 1, limit: PAGE_SIZE });
  const last = useBooks({ uploadedBy: 'me', page: pages, limit: PAGE_SIZE });
  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;

  return (
    <TgPage className="gap-3">
      <TgHeader
        variant="inner"
        title="Kitoblarim"
        eyebrow={total > 0 ? `${formatNumber(total)} ta kitob` : undefined}
      />

      {first.isLoading ? (
        <TgSkeletonList count={2} height={220} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty
          icon={BookMarked}
          title="Hali kitob yuklamagansiz"
          description="PDF yuklash web versiyada — pastdagi tugma orqali oching"
        />
      ) : (
        <>
          {Array.from({ length: pages }, (_, i) => (
            <BooksChunk key={i + 1} page={i + 1} />
          ))}
          {pages < totalPages && last.isSuccess && !last.isPlaceholderData && (
            <TgLoadMore
              onClick={() => setPages((p) => p + 1)}
              shown={Math.min(pages * PAGE_SIZE, total)}
              total={total}
            />
          )}
        </>
      )}

      <TgWebHint>Kitob qo&apos;shish, PDF va muqova yuklash web versiyada ochiladi.</TgWebHint>

      <TgMainButton text="+ Kitob qo'shish" onClick={() => router.push('/teacher/books/new')} />
    </TgPage>
  );
}
