'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, GraduationCap, Plus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
import { useCourses } from '@/hooks/use-courses';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatPrice } from '@/lib/format';

export default function TeacherCoursesPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useCourses({ page: 1, limit: 100 });

  const myCourses = data?.items.filter((course) => {
    const teacherId = typeof course.teacher === 'object' ? course.teacher?._id : course.teacher;
    return teacherId === user?._id;
  });

  return (
    <div>
      <PageHeader
        title="Kurslarim"
        description="Yaratgan kurslaringizni boshqaring"
        actions={
          <Button
            render={<Link href="/teacher/courses/new" />}
            size="lg"
            className="h-10 rounded-md px-5 shadow-sm"
          >
            <Plus className="size-4" /> Yangi kurs
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={3} itemClassName="h-64 rounded-2xl" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !myCourses || myCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Hali kurs yaratmagansiz"
          action={
            <Button render={<Link href="/teacher/courses/new" />}>Birinchi kursni yaratish</Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((course) => {
            const thumbnail = resolveAssetUrl(course.thumbnail);
            return (
              <Link key={course._id} href={`/teacher/courses/${course._id}`} className="group">
                <Card className="h-full gap-0 overflow-hidden rounded-2xl border-none py-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={course.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 to-accent/40">
                        <GraduationCap className="size-9 text-primary/50" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
                    <Badge
                      className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs shadow-sm backdrop-blur-sm"
                      variant={course.isPublished ? 'default' : 'secondary'}
                    >
                      {course.isPublished ? 'Nashr etilgan' : 'Qoralama'}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-col gap-3 p-5">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {course.studentsCount ?? 0} o&apos;quvchi
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="size-3.5" /> {course.lessonsCount ?? 0} dars
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t pt-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                        {formatPrice(course.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
