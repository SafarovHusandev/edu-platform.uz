'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SearchX,
  X,
  Sparkles,
  GraduationCap,
  BookOpen,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Award,
  Flame,
} from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { CourseCard, CourseCardSkeleton } from '@/components/courses/course-card';
import { useCourses } from '@/hooks/use-courses';
import { useCategories } from '@/hooks/use-categories';

const PAGE_SIZE = 12;

type PriceFilter = 'all' | 'free' | 'paid';
type SortOption = 'default' | 'popular' | 'rating' | 'price-asc' | 'price-desc';

function CoursesCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page') ?? '1');
  const category = searchParams.get('category') ?? '';
  const initialSearch = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { data, isLoading, isPlaceholderData } = useCourses({
    page,
    limit: PAGE_SIZE,
    search: initialSearch || undefined,
    category: category || undefined,
  });

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== initialSearch) {
        updateParams({ search: searchInput || undefined, page: undefined });
      }
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const clearSearch = () => {
    setSearchInput('');
    updateParams({ search: undefined, page: undefined });
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setPriceFilter('all');
    setSortBy('default');
    router.push(pathname);
  };

  // Filter & sort the current fetched items
  const processedCourses = useMemo(() => {
    if (!data?.items) return [];
    let list = [...data.items];

    // Price filter
    if (priceFilter === 'free') {
      list = list.filter((c) => !c.price || c.price === 0);
    } else if (priceFilter === 'paid') {
      list = list.filter((c) => c.price && c.price > 0);
    }

    // Sort
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.studentsCount ?? 0) - (a.studentsCount ?? 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    return list;
  }, [data?.items, priceFilter, sortBy]);

  const totalPages = data?.totalPages ?? 1;
  const isAnyFilterActive = Boolean(
    initialSearch || category || priceFilter !== 'all' || sortBy !== 'default'
  );
  const selectedCategoryName = categories?.find((c) => c._id === category)?.name;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-primary/5 via-background to-background py-8 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--color-primary),transparent)] opacity-20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/4 -z-10 size-72 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-1/4 -z-10 size-72 rounded-full bg-gold/15 blur-3xl"
        />

        <Container className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-base font-medium text-primary shadow-xs backdrop-blur-md">
            <Sparkles className="size-3.5" />
            <span>Eng so&apos;nggi va sifatli ta&apos;lim kurslari</span>
          </div>

          <h1 className="mt-4 max-w-3xl text-balance font-heading text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            O&apos;zingizga mos kursni tanlang va{' '}
            <span className="bg-linear-to-r from-primary via-primary/80 to-accent-foreground bg-clip-text text-transparent">
              professional bilim
            </span>{' '}
            oling
          </h1>

          <p className="mt-3 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            Dasturlash, dizayn, xorijiy tillar va boshqa zamonaviy sohalar bo&apos;yicha amaliy
            darslar, topshiriqlar hamda rasmiy sertifikatlar.
          </p>

          {/* Quick Value Props */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xl font-medium text-muted-foreground shadow-xs backdrop-blur-xs">
              <CheckCircle2 className="size-3.5 text-success" />
              Amaliy topshiriqlar
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xl font-medium text-muted-foreground shadow-xs backdrop-blur-xs">
              <Award className="size-3.5 text-gold" />
              Rasmiy sertifikat
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xl font-medium text-muted-foreground shadow-xs backdrop-blur-xs">
              <Flame className="size-3.5 text-primary" />
              Soha mutaxassislaridan darslar
            </span>
          </div>
        </Container>
      </div>

      <Container className="pt-8">
        {/* Category Quick Chips / Tabs */}
        <div className="mb-6">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => updateParams({ category: undefined, page: undefined })}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium transition-all duration-200 ${
                !category
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]'
                  : 'border border-border/80 bg-card/90 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <BookOpen className="size-3.5" />
              Barcha kurslar
              {data?.total ? (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    !category ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {data.total}
                </span>
              ) : null}
            </button>

            {categories?.map((cat) => {
              const isActive = category === cat._id;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() =>
                    updateParams({ category: isActive ? undefined : cat._id, page: undefined })
                  }
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]'
                      : 'border border-border/80 bg-card/90 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 rounded-2xl border border-border/70 bg-card p-3 shadow-xs sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Kurs nomi, tavsif yoki mutaxassislik bo'yicha qidirish..."
                className="h-11 rounded-xl bg-background pl-10 pr-9 text-lg shadow-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Qidiruvni tozalash"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls Group */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Price Filter Segment */}
              <div className="flex rounded-xl border border-border bg-background p-0.5 text-base font-medium">
                <button
                  type="button"
                  onClick={() => setPriceFilter('all')}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    priceFilter === 'all'
                      ? 'bg-muted font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('free')}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    priceFilter === 'free'
                      ? 'bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Bepul
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('paid')}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    priceFilter === 'paid'
                      ? 'bg-primary/15 font-semibold text-primary shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pullik
                </button>
              </div>

              {/* Sort Selector */}
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy((val as SortOption) || 'default')}
                items={[
                  { value: 'default', label: 'Odatiy tartibda' },
                  { value: 'popular', label: "Ommabopligi bo'yicha" },
                  { value: 'rating', label: 'Yuqori reytingli' },
                  { value: 'price-asc', label: 'Narx: avval arzon' },
                  { value: 'price-desc', label: 'Narx: avval qimmat' },
                ]}
              >
                <SelectTrigger className="h-10 w-44 rounded-xl border-border bg-background px-3 text-base">
                  <SelectValue placeholder="Saralash" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="default">Odatiy tartibda</SelectItem>
                  <SelectItem value="popular">Ommabopligi bo&apos;yicha</SelectItem>
                  <SelectItem value="rating">Yuqori reytingli</SelectItem>
                  <SelectItem value="price-asc">Narx: avval arzon</SelectItem>
                  <SelectItem value="price-desc">Narx: avval qimmat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Tags Row */}
          {isAnyFilterActive && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-base text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Filtrlar:</span>
                {initialSearch && (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-md px-2 py-0.5 text-base font-normal"
                  >
                    Qidiruv: &ldquo;{initialSearch}&rdquo;
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="ml-0.5 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategoryName && (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-md px-2 py-0.5 text-base font-normal"
                  >
                    Kategoriya: {selectedCategoryName}
                    <button
                      type="button"
                      onClick={() => updateParams({ category: undefined, page: undefined })}
                      className="ml-0.5 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                {priceFilter !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-md px-2 py-0.5 text-base font-normal"
                  >
                    Narx: {priceFilter === 'free' ? 'Bepul' : 'Pullik'}
                    <button
                      type="button"
                      onClick={() => setPriceFilter('all')}
                      className="ml-0.5 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                {sortBy !== 'default' && (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-md px-2 py-0.5 text-base font-normal"
                  >
                    Saralash faol
                    <button
                      type="button"
                      onClick={() => setSortBy('default')}
                      className="ml-0.5 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
              </div>

              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <RotateCcw className="size-3" />
                Tozalash
              </button>
            </div>
          )}
        </div>

        {/* Results Header Info */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
              Mavjud kurslar
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
              {isLoading ? '...' : `${processedCourses.length} ta`}
            </span>
          </div>
        </div>

        {/* Course Cards Grid */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : processedCourses.length > 0 ? (
          <div
            className={
              isPlaceholderData
                ? 'grid gap-6 opacity-60 transition-opacity sm:grid-cols-2 lg:grid-cols-3 '
                : 'grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }
          >
            {processedCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/80 bg-card/50 px-6 py-16 text-center backdrop-blur-xs sm:py-24">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SearchX className="size-8" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-foreground sm:text-2xl">
              Hech qanday kurs topilmadi
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-base text-muted-foreground">
              Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring yoki filtrlarni tozalab boshqatdan
              qidirib ko&apos;ring.
            </p>
            {isAnyFilterActive && (
              <div className="mt-6 flex justify-center">
                <Button onClick={resetAllFilters} variant="outline" className="gap-2 rounded-xl">
                  <RotateCcw className="size-4" />
                  Barcha filtrlarni tozalash
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-12">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`${pathname}?${new URLSearchParams({
                    ...(category && { category }),
                    ...(initialSearch && { search: initialSearch }),
                    page: String(Math.max(1, page - 1)),
                  }).toString()}`}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <PaginationItem key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 ? (
                      <span className="px-1 text-muted-foreground">…</span>
                    ) : null}
                    <PaginationLink
                      isActive={p === page}
                      href={`${pathname}?${new URLSearchParams({
                        ...(category && { category }),
                        ...(initialSearch && { search: initialSearch }),
                        page: String(p),
                      }).toString()}`}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext
                  href={`${pathname}?${new URLSearchParams({
                    ...(category && { category }),
                    ...(initialSearch && { search: initialSearch }),
                    page: String(Math.min(totalPages, page + 1)),
                  }).toString()}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </Container>
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
