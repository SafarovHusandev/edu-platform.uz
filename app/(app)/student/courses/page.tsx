'use client';

import { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { DebouncedSearch } from '@/components/ui/debounced-search';
import { EnrollmentCard, isEnrollmentCompleted } from '@/components/courses/enrollment-card';
import { CourseCard, CourseCardSkeleton } from '@/components/courses/course-card';
import { useMyEnrollments } from '@/hooks/use-enrollment';
import { useCourses, type CourseFilters } from '@/hooks/use-courses';

type Tab = 'active' | 'completed';
type CatalogFilter = 'popular' | 'newest' | 'free';

const CATALOG_LIMIT = 12;

const CATALOG_FILTERS: Record<CatalogFilter, Pick<CourseFilters, 'sort' | 'isFree'>> = {
  popular: { sort: 'popular' },
  newest: { sort: 'newest' },
  free: { isFree: true },
};

export default function MyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyEnrollments(1, 50);
  const [tab, setTab] = useState<Tab>('active');

  const all = data?.items ?? [];
  const active = all.filter((e) => !isEnrollmentCompleted(e));
  const completed = all.filter((e) => isEnrollmentCompleted(e));
  const items = tab === 'active' ? active : completed;
  const enrolledIds = new Set(
    all.map((e) => (typeof e.course === 'object' ? e.course._id : e.course))
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        {/* Sarlavha chapda, holat tablari o'ngda (kichik ekranda pastga tushadi) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold sm:text-[28px]">Mening kurslarim</h1>
          {all.length > 0 && (
            <FilterPills
              value={tab}
              onChange={setTab}
              options={[
                { value: 'active', label: `Davom etmoqda · ${active.length}` },
                { value: 'completed', label: `Tugatilgan · ${completed.length}` },
              ]}
            />
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[18px] bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : all.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-border bg-card p-5 text-secondary-foreground">
            <BookOpen className="size-5 shrink-0 text-muted-foreground" />
            Hali hech qanday kursga yozilmagansiz — quyidagi kurslardan birini tanlang.
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={tab === 'active' ? "Davom etayotgan kurs yo'q" : "Hali tugatilgan kurs yo'q"}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                {items.map((enrollment, index) => (
                  <EnrollmentCard key={enrollment._id} enrollment={enrollment} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <AllCoursesSection enrolledIds={enrolledIds} />
    </div>
  );
}

// Barcha kurslar katalogi: qidiruv, saralash va sahifalash serverda
function AllCoursesSection({ enrolledIds }: { enrolledIds: Set<string> }) {
  const [filter, setFilter] = useState<CatalogFilter>('popular');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching, refetch } = useCourses({
    page,
    limit: CATALOG_LIMIT,
    search: search || undefined,
    excludeEnrolled: true,
    ...CATALOG_FILTERS[filter],
  });

  // Server excludeEnrolled bilan filtrlaydi; bu yerdagi filtr faqat yangi yozilgandan
  // keyingi eskirgan kesh uchun zaxira
  const courses = (data?.items ?? []).filter((course) => !enrolledIds.has(course._id));
  const totalPages = data?.totalPages ?? 1;

  return (
    <section className="flex flex-col gap-4">
      {/* Sarlavha chapda; saralash va qidiruv o'ngda bitta qatorda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-heading text-xl font-bold sm:text-2xl">Barcha kurslar</h2>
          {data && <span className="text-sm text-muted-foreground">{data.total} ta</span>}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          <FilterPills
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            options={[
              { value: 'popular', label: 'Mashhur' },
              { value: 'newest', label: 'Yangi' },
              { value: 'free', label: 'Bepul' },
            ]}
          />
          <DebouncedSearch
            initial=""
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Kurs qidirish..."
            label="Kurs qidirish"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            search
              ? `"${search}" bo'yicha kurs topilmadi`
              : "Siz hali yozilmagan kurslar hozircha yo'q"
          }
        />
      ) : (
        <div
          className={
            isFetching
              ? 'grid gap-4 opacity-60 transition-opacity sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]'
              : 'grid gap-4 transition-opacity sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]'
          }
        >
          {courses.map((course, index) => (
            <CourseCard key={course._id} course={course} index={index} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Oldingi sahifa"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Keyingi sahifa"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
