'use client';

import Link from 'next/link';
import { BookMarked, Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useBooks, useDeleteBook, useRegisterBookDownload } from '@/hooks/use-books';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl, bookDownloadUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatusPill, coverTone } from '@/components/dashboard/dashboard-ui';

export default function TeacherBooksPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useBooks({ page: 1, limit: 100 });
  const deleteBook = useDeleteBook();
  const registerDownload = useRegisterBookDownload();

  const myBooks = data?.items.filter((book) => {
    const uploaderId = typeof book.uploadedBy === 'object' ? book.uploadedBy?._id : book.uploadedBy;
    return uploaderId === user?._id;
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Kitoblarim"
        description={myBooks && myBooks.length > 0 ? `${myBooks.length} ta kitob` : undefined}
        actions={
          <Button size="lg" render={<Link href="/teacher/books/new" />}>
            <Plus className="size-4" /> Kitob qo&apos;shish
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !myBooks || myBooks.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Hali kitob yuklamagansiz"
          action={
            <Button render={<Link href="/teacher/books/new" />}>
              <Plus className="size-4" /> Birinchi kitobni qo&apos;shish
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:gap-4">
          {myBooks.map((book, index) => {
            const cover = resolveAssetUrl(book.coverImage);
            return (
              <article
                key={book._id}
                className="flex flex-col gap-2 rounded-[18px] border border-border bg-card p-3"
              >
                {cover ? (
                  <Dialog>
                    <DialogTrigger
                      render={
                        <button
                          type="button"
                          aria-label={`${book.title} muqovasini kattalashtirish`}
                          className="block aspect-3/4 cursor-zoom-in overflow-hidden rounded-xl bg-muted"
                        />
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt={book.title} className="size-full object-cover" />
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-0 sm:max-w-md" showCloseButton>
                      <DialogTitle className="sr-only">{book.title}</DialogTitle>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt={book.title}
                        className="max-h-[80vh] w-full rounded-xl object-contain"
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Link
                    href={`/teacher/books/${book._id}`}
                    className={cn(
                      'flex aspect-3/4 items-end rounded-xl p-3 font-heading text-lg font-bold leading-tight',
                      coverTone(index)
                    )}
                  >
                    {book.title}
                  </Link>
                )}
                <div className="flex items-start justify-between gap-1.5">
                  <Link
                    href={`/teacher/books/${book._id}`}
                    className="line-clamp-2 text-sm font-bold hover:text-primary"
                  >
                    {book.title}
                  </Link>
                  <StatusPill
                    tone={book.isPublished ? 'success' : 'neutral'}
                    className="px-2 py-0.5 text-[11px]"
                  >
                    {book.isPublished ? 'Nashr' : 'Qoralama'}
                  </StatusPill>
                </div>
                <span className="text-[13px] text-muted-foreground">
                  {book.grade != null ? `${book.grade}-sinf` : 'Barcha sinflar'} · ↓{' '}
                  {book.downloadsCount ? formatNumber(book.downloadsCount) : '—'}
                </span>
                <div className="mt-auto flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    render={<Link href={`/teacher/books/${book._id}`} />}
                  >
                    Tahrir
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!book.file}
                    aria-label="Yuklab olish"
                    render={
                      book.file ? (
                        <a
                          href={bookDownloadUrl(book._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => registerDownload(book._id)}
                        />
                      ) : undefined
                    }
                  >
                    <Download className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
                    >
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kitobni o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu amalni bekor qilib bo&apos;lmaydi. Muqova va fayl ham diskdan
                          o&apos;chiriladi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => deleteBook.mutate(book._id)}
                        >
                          O&apos;chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
