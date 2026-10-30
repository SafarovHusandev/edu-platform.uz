'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DebouncedSearch } from '@/components/ui/debounced-search';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { BookCard, BookCardSkeleton } from '@/components/books/book-card';
import { useBooks } from '@/hooks/use-books';
import { useBookCategories } from '@/hooks/use-book-categories';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));

function BooksCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page') ?? '1');
  const category = searchParams.get('category') ?? '';
  const grade = searchParams.get('grade') ?? '';
  const search = searchParams.get('search') ?? '';

  const { data: categories } = useBookCategories();
  const { data, isLoading, isPlaceholderData } = useBooks({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    category: category || undefined,
    grade: grade ? Number(grade) : undefined,
  });

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const categoryName = categories?.find((c) => c._id === category)?.name;
  const subtitle = ['Barcha kitoblar bepul', grade ? `${grade}-sinf` : null, categoryName]
    .filter(Boolean)
    .join(' · ');
  const filtersActive = Boolean(category || grade || search);

  return (
    <div className="mx-auto grid max-w-300 items-start gap-6 px-4 pt-8 pb-14 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside
        aria-label="Filtrlar"
        className="flex flex-col gap-5 rounded-[20px] border border-border bg-card p-5 lg:sticky lg:top-24"
      >
        <div className="flex flex-col gap-2.5">
          <span className="font-bold">Sinf</span>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-4">
            {GRADE_NUMBERS.map((n) => {
              const active = grade === n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateParams({ grade: active ? undefined : n, page: undefined })}
                  className={cn(
                    'h-10 rounded-[10px] font-semibold transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input bg-card hover:bg-muted'
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {(categories?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="mb-1 font-bold">Kategoriya</span>
            {categories!.map((cat) => {
              const active = category === cat._id;
              return (
                <label key={cat._id} className="flex cursor-pointer items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() =>
                      updateParams({ category: active ? undefined : cat._id, page: undefined })
                    }
                    className="size-[18px] accent-primary"
                  />
                  <span className={cn(active && 'font-semibold')}>{cat.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <Button variant="outline" disabled={!filtersActive} onClick={() => router.push(pathname)}>
          Filtrlarni tozalash
        </Button>
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold sm:text-[34px]">Kutubxona</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          <DebouncedSearch
            key={search}
            initial={search}
            onSearch={(value) => updateParams({ search: value || undefined, page: undefined })}
            placeholder="Nomi yoki muallif"
            label="Kitob qidirish"
            className="w-full sm:w-80"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div
            className={cn(
              'grid grid-cols-2 gap-5 transition-opacity sm:grid-cols-3 xl:grid-cols-4',
              isPlaceholderData && 'opacity-60'
            )}
          >
            {data.items.map((book, i) => (
              <BookCard key={book._id} book={book} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-input bg-card py-16 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="font-semibold">Hech qanday kitob topilmadi</p>
            <p className="text-sm text-muted-foreground">
              Boshqa kalit so&apos;z yoki filtr bilan qidirib ko&apos;ring
            </p>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="kitob"
            onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : undefined })}
          />
        )}
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense>
      <BooksCatalog />
    </Suspense>
  );
}
