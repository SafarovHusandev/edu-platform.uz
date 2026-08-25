'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { useCourses, useUpdateCourse, useDeleteCourse } from '@/hooks/use-courses';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function AdminCoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useCourses({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  return (
    <div>
      <PageHeader title="Kurslar" description="Platformadagi barcha kurslar" />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Kurs nomi bo'yicha qidirish..."
          className="h-11 rounded-md pl-10 text-base"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={BookOpen} title="Kurs topilmadi" />
      ) : (
        <>
          <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-sm ring-1 ring-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kurs
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    O&apos;qituvchi
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kategoriya
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Narx
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Holat
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((course) => {
                  const teacher = typeof course.teacher === 'object' ? course.teacher : undefined;
                  const category =
                    typeof course.category === 'object' ? course.category?.name : undefined;
                  return (
                    <TableRow key={course._id} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/courses/${course._id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {course.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {course.studentsCount ?? 0} o&apos;quvchi · {course.lessonsCount ?? 0}{' '}
                              dars
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {teacher?.name ?? '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {category ? (
                          <Badge variant="outline" className="rounded-full px-2.5 py-1">
                            {category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold">
                        {formatPrice(course.price)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={course.isPublished ?? false}
                            onCheckedChange={(checked) =>
                              updateCourse.mutate({ id: course._id, isPublished: checked })
                            }
                            aria-label={course.isPublished ? 'Nashrdan olish' : 'Nashr etish'}
                          />
                          <Badge
                            className={cn(
                              'rounded-full px-2.5 py-1',
                              course.isPublished
                                ? 'bg-success/10 text-success'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {course.isPublished ? 'Nashr etilgan' : 'Qoralama'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-lg"
                                aria-label="O'chirish"
                              />
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kursni o&apos;chirasizmi?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &quot;{course.title}&quot; va unga bog&apos;liq darslar butunlay
                                o&apos;chib ketadi. Bu amalni bekor qilib bo&apos;lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCourse.mutate(course._id)}>
                                O&apos;chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-4">
            <PaginationBar
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="kurs"
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
