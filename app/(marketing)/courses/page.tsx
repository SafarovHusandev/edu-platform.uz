'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, SearchX } from 'lucide-react';
import { DebouncedSearch } from '@/components/ui/debounced-search';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { CourseCard, CourseCardSkeleton } from '@/components/courses/course-card';
import { useCourses, type CourseSort } from '@/hooks/use-courses';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

const SORT_LABELS: Record<CourseSort, string> = {
  popular: 'Mashhurlari',
  newest: 'Yangilari',
  rating: "Reyting bo'yicha",
  price_asc: 'Avval arzon',
  price_desc: 'Avval qimmat',
};

function isCourseSort(value: string | null): value is CourseSort {
  return !!value && value in SORT_LABELS;
}

function CoursesCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page') ?? '1');
  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';
  const sortParam = searchParams.get('sort');
  const sortBy: CourseSort = isCourseSort(sortParam) ? sortParam : 'popular';
  const onlyFree = searchParams.get('free') === '1';

  const { data: categories } = useCategories();
  const { data, isLoading, isPlaceholderData } = useCourses({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    category: category || undefined,
    sort: sortBy,
    isFree: onlyFree || undefined,
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

  const courses = data?.items ?? [];
  const filtersActive = Boolean(search || category || onlyFree);

  function resetFilters() {
    router.push(pathname);
  }

  return (
    <div className="mx-auto max-w-300 px-4 pt-10 pb-14 sm:px-6">
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-3xl font-bold sm:text-[34px]">Kurslar</h1>

        <div className="flex flex-wrap gap-2.5">
          <DebouncedSearch
            key={search}
            initial={search}
            onSearch={(value) => updateParams({ search: value || undefined, page: undefined })}
            placeholder="Kurs nomini kiriting"
            label="Kurs qidirish"
            className="flex-[1_1_360px]"
          />
          <Select
            value={sortBy}
            onValueChange={(v) =>
              updateParams({ sort: v && v !== 'popular' ? v : undefined, page: undefined })
            }
            items={SORT_LABELS}
          >
            <SelectTrigger
              className="h-[52px] w-full rounded-[14px] text-[15px] sm:w-52"
              aria-label="Saralash"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as CourseSort[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ _id: '', name: 'Barchasi' }, ...(categories ?? [])].map((cat) => {
            const active = category === cat._id;
            return (
              <button
                key={cat._id || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => updateParams({ category: cat._id || undefined, page: undefined })}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2.5 font-semibold transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-card hover:bg-muted'
                )}
              >
                {cat.name}
              </button>
            );
          })}
          <span className="mx-1.5 w-px shrink-0 bg-input" />
          <button
            type="button"
            aria-pressed={onlyFree}
            onClick={() => updateParams({ free: onlyFree ? undefined : '1', page: undefined })}
            className={cn(
              'shrink-0 rounded-full px-4 py-2.5 font-semibold transition-colors',
              onlyFree
                ? 'bg-success text-success-foreground'
                : 'border border-success/40 bg-success-soft text-success hover:bg-success/15'
            )}
          >
            Faqat bepul
          </button>
        </div>

        <span className="text-sm text-muted-foreground">
          {isLoading
            ? 'Yuklanmoqda...'
            : `${data?.total ?? 0} ta ${onlyFree ? 'bepul ' : ''}kurs topildi`}
        </span>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div
            className={cn(
              'grid gap-5 transition-opacity sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))]',
              isPlaceholderData && 'opacity-60'
            )}
          >
            {courses.map((course, i) => (
              <CourseCard key={course._id} course={course} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-input bg-card px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <SearchX className="size-8" />
            </span>
            <h2 className="font-heading text-xl font-semibold">Hech qanday kurs topilmadi</h2>
            <p className="max-w-md text-muted-foreground">
              Qidiruv so&apos;zini o&apos;zgartiring yoki filtrlarni tozalang.
            </p>
            {filtersActive && (
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="size-4" /> Filtrlarni tozalash
              </Button>
            )}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <PaginationBar
            className="mt-8"
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="kurs"
            onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : undefined })}
          />
        )}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense>
      <CoursesCatalog />
    </Suspense>
  );
}
