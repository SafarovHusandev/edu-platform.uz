'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { EnrollmentCard } from '@/components/courses/enrollment-card';
import { useMyEnrollments } from '@/hooks/use-enrollment';

type Tab = 'active' | 'completed';

export default function MyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyEnrollments(1, 50);
  const [tab, setTab] = useState<Tab>('active');

  const all = data?.items ?? [];
  const active = all.filter((e) => !e.isCompleted);
  const completed = all.filter((e) => e.isCompleted);
  const items = tab === 'active' ? active : completed;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Mening kurslarim"
        actions={
          <Button variant="outline" render={<Link href="/courses" />}>
            <Plus className="size-4" /> Katalogdan kurs qo&apos;shish
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Hali hech qanday kursga yozilmagansiz"
          action={<Button render={<Link href="/courses" />}>Kurslarni ko&apos;rish</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilterPills
            value={tab}
            onChange={setTab}
            options={[
              { value: 'active', label: `Davom etmoqda · ${active.length}` },
              { value: 'completed', label: `Tugatilgan · ${completed.length}` },
            ]}
          />
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
        </div>
      )}
    </div>
  );
}
