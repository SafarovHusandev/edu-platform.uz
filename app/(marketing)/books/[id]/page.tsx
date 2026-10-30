import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard, BookCover } from '@/components/books/book-card';
import { api } from '@/lib/api-client';
import { bookDownloadUrl } from '@/lib/config';
import { formatFileSize, formatNumber } from '@/lib/format';
import type { Book, Paginated } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBook(id: string) {
  try {
    const res = await api.get<{ book: Book }>(`/books/${id}`, undefined, { skipAuth: true });
    return res.book;
  } catch {
    return null;
  }
}

async function getSimilarBooks(book: Book) {
  if (book.grade == null) return [];
  const res = await api
    .get<Paginated<Book>>('/books', { grade: book.grade, page: 1, limit: 6 }, { skipAuth: true })
    .catch(() => null);
  return (res?.items ?? []).filter((b) => b._id !== book._id).slice(0, 5);
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const similar = await getSimilarBooks(book);
  const category = typeof book.category === 'object' ? book.category?.name : undefined;
  const uploader = typeof book.uploadedBy === 'object' ? book.uploadedBy : undefined;
  const fileExt = book.file?.split('.').pop()?.toUpperCase() ?? 'PDF';

  return (
    <div className="mx-auto flex max-w-300 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
        <Link href="/books" className="hover:text-foreground">
          Kutubxona
        </Link>
        {category && ` / ${category}`} / {book.title}
      </nav>

      <div className="flex flex-wrap items-start gap-8 lg:gap-12">
        <div className="w-full max-w-[300px] shrink-0">
          <BookCover book={book} className="rounded-3xl text-4xl shadow-lg" />
        </div>

        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px]">
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[13px] font-semibold text-primary">
                {category}
              </span>
            )}
            <span className="rounded-full bg-success-soft px-3 py-1 text-[13px] font-bold text-success">
              Bepul
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold sm:text-[38px]">{book.title}</h1>
          <p className="text-[17px] text-muted-foreground">
            Muallif: {book.author}
            {uploader?.name && ` · Yuklagan: ${uploader.name}`}
          </p>
          {book.description && (
            <p className="max-w-[620px] leading-relaxed text-secondary-foreground">
              {book.description}
            </p>
          )}
          <div className="grid max-w-[640px] grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Format', value: fileExt },
              { label: 'Hajmi', value: formatFileSize(book.fileSize) ?? '—' },
              { label: 'Sinf', value: book.grade != null ? `${book.grade}-sinf` : 'Barcha' },
              { label: 'Yuklashlar', value: formatNumber(book.downloadsCount ?? 0) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[14px] border border-border bg-card p-3.5">
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="mt-1 font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
          <div>
            <Button
              size="lg"
              className="h-[52px] px-6 text-base"
              disabled={!book.file}
              render={
                book.file ? (
                  <a href={bookDownloadUrl(book._id)} target="_blank" rel="noopener noreferrer" />
                ) : undefined
              }
            >
              <Download className="size-5" />
              {book.file ? 'Yuklab olish' : 'Fayl hali yuklanmagan'}
            </Button>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-4 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Shu sinf uchun boshqa kitoblar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {similar.map((item, i) => (
              <BookCard key={item._id} book={item} index={i + 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
