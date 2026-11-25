'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookMarked } from 'lucide-react';
import { TgMainButton } from '@/components/tg/tg-main-button';
import { TgEmpty, TgError, TgHeader, TgPage, TgPill, TgSkeletonList } from '@/components/tg/tg-ui';
import { useBooks } from '@/hooks/use-books';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

export default function TgTeacherBooksPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?._id);
  const books = useBooks({ page: 1, limit: 100 });
  const mine =
    books.data?.items.filter((book) => {
      const uploader = typeof book.uploadedBy === 'object' ? book.uploadedBy?._id : book.uploadedBy;
      return uploader === userId;
    }) ?? [];

  return (
    <TgPage>
      <TgHeader title="Kitoblarim" />

      {books.isLoading ? (
        <TgSkeletonList count={4} height={120} />
      ) : books.isError ? (
        <TgError onRetry={() => books.refetch()} />
      ) : mine.length === 0 ? (
        <TgEmpty icon={BookMarked} title="Hali kitob yuklamagansiz" />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {mine.map((book) => {
            const cover = resolveAssetUrl(book.coverImage);
            return (
              <Link
                key={book._id}
                href={`/teacher/books/${book._id}`}
                className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-2.5 active:bg-muted"
              >
                <div className="flex aspect-3/4 items-center justify-center overflow-hidden rounded-xl bg-primary-soft p-2 text-center font-heading text-sm font-semibold text-primary">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="size-full object-cover" />
                  ) : (
                    book.title
                  )}
                </div>
                <span className="line-clamp-2 text-sm font-semibold">{book.title}</span>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] text-muted-foreground">
                    {[book.grade ? `${book.grade}-sinf` : null, `↓ ${formatNumber(book.downloadsCount ?? 0)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <TgPill tone={book.isPublished ? 'success' : 'neutral'}>
                    {book.isPublished ? 'Nashr' : 'Qoralama'}
                  </TgPill>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <TgMainButton text="+ Kitob qo'shish" onClick={() => router.push('/teacher/books/new')} />
    </TgPage>
  );
}
