'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDown, ArrowUp, Camera, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  useCourse,
  useCourseStats,
  useDeleteCourse,
  useUpdateCourse,
  useUploadThumbnail,
} from '@/hooks/use-courses';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { useCreateLesson, useDeleteLesson, useReorderLessons } from '@/hooks/use-lessons';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, formatPrice, fromTiyin, toTiyin } from '@/lib/format';

interface PageProps {
  params: Promise<{ id: string }>;
}

const courseSchema = z.object({
  title: z.string().min(3, { error: 'Kamida 3 ta belgi' }),
  description: z.string().min(10, { error: 'Kamida 10 ta belgi' }),
  category: z.string().min(1, { error: 'Kategoriyani tanlang' }),
  price: z.coerce.number().min(0),
});

type CourseFormInput = z.input<typeof courseSchema>;
type CourseFormValues = z.output<typeof courseSchema>;

export default function TeacherCourseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCourse(id);
  const course = data?.course;
  const lessons = data?.lessons;
  const { data: stats } = useCourseStats(id);
  const { data: categories } = useCategories();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const uploadThumbnail = useUploadThumbnail();
  const createLesson = useCreateLesson(id);
  const deleteLesson = useDeleteLesson(id);
  const reorderLessons = useReorderLessons(id);
  // Saqlanguncha yangi tartibni darhol ko'rsatish uchun
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content: '' });

  const form = useForm<CourseFormInput, unknown, CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', description: '', category: '', price: 0 },
    values: course
      ? {
          title: course.title,
          description: course.description,
          category: typeof course.category === 'object' ? course.category._id : course.category,
          price: fromTiyin(course.price),
        }
      : undefined,
  });

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-md bg-muted" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!course) {
    return (
      <EmptyState
        title="Kurs topilmadi"
        description="Bu kurs o'chirilgan yoki mavjud emas."
        action={
          <Link
            href="/teacher/courses"
            className="text-sm font-medium text-primary hover:underline"
          >
            Kurslarga qaytish
          </Link>
        }
      />
    );
  }

  const thumbnail = resolveAssetUrl(course.thumbnail);

  function handleAddLesson() {
    if (!lessonForm.title.trim()) return;
    createLesson.mutate(
      { ...lessonForm, order: (lessons?.length ?? 0) + 1 },
      {
        onSuccess: () => {
          setLessonForm({ title: '', description: '', content: '' });
          setLessonDialogOpen(false);
        },
      }
    );
  }

  const serverOrder = [...(lessons ?? [])].sort((a, b) => a.order - b.order);
  const sortedLessons = pendingOrder
    ? pendingOrder
        .map((lessonId) => serverOrder.find((l) => l._id === lessonId))
        .filter((l): l is (typeof serverOrder)[number] => !!l)
    : serverOrder;

  // Backend kursdagi BARCHA darslarni yangi tartibda kutadi
  function moveLesson(fromId: string, toIndex: number) {
    const ids = sortedLessons.map((l) => l._id);
    const fromIndex = ids.indexOf(fromId);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= ids.length || fromIndex === toIndex) return;
    ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0]);
    setPendingOrder(ids);
    reorderLessons.mutate(ids, { onSettled: () => setPendingOrder(null) });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
            <Link href="/teacher/courses" className="hover:text-foreground">
              Kurslarim
            </Link>{' '}
            / {course.title}
          </nav>
          <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-[26px]">
            Darslar · {sortedLessons.length}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-[14px] border border-border bg-card px-4 py-2.5">
            <div className="text-xs text-muted-foreground">Yozilganlar</div>
            <div className="font-heading font-bold">
              {formatNumber(stats?.enrollment.total ?? course.studentsCount ?? 0)}
            </div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-4 py-2.5">
            <div className="text-xs text-muted-foreground">Daromad</div>
            <div className="font-heading font-bold">{formatPrice(stats?.revenue.total ?? 0)}</div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[20px] border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-[18px] py-3.5">
            <span className="flex items-center gap-2 font-bold">
              Tartib
              {reorderLessons.isPending ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                sortedLessons.length > 1 && (
                  <span className="hidden text-[13px] font-normal text-muted-foreground sm:inline">
                    Sudrab joyini o&apos;zgartiring
                  </span>
                )
              )}
            </span>
            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
              <DialogTrigger render={<Button type="button" size="sm" />}>
                <Plus className="size-4" /> Dars qo&apos;shish
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi dars</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Dars nomi"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder="Qisqacha tavsif"
                    value={lessonForm.description}
                    onChange={(e) =>
                      setLessonForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                  <Textarea
                    placeholder="Dars matni"
                    value={lessonForm.content}
                    onChange={(e) =>
                      setLessonForm((prev) => ({ ...prev, content: e.target.value }))
                    }
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddLesson} disabled={createLesson.isPending}>
                    {createLesson.isPending && <Loader2 className="size-4 animate-spin" />}
                    Qo&apos;shish
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {sortedLessons.length === 0 ? (
            <p className="px-[18px] py-6 text-sm text-muted-foreground">
              Hali darslar qo&apos;shilmagan
            </p>
          ) : (
            <ol>
              {sortedLessons.map((lesson, idx) => {
                const meta = [
                  lesson.videoUrl ? 'Video' : null,
                  lesson.attachments?.length ? `${lesson.attachments.length} ta fayl` : null,
                  !lesson.videoUrl && lesson.content ? 'Matn' : null,
                  lesson.durationMinutes ? `${lesson.durationMinutes} daq` : null,
                ]
                  .filter(Boolean)
                  .join(' + ');
                return (
                  <li
                    key={lesson._id}
                    draggable={!reorderLessons.isPending}
                    onDragStart={() => setDragId(lesson._id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId) moveLesson(dragId, idx);
                      setDragId(null);
                    }}
                    className={cn(
                      'flex items-center gap-3 border-b border-muted px-[18px] py-3 last:border-0',
                      dragId === lesson._id && 'bg-primary-soft opacity-70'
                    )}
                  >
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60" />
                    <span className="w-6 shrink-0 font-heading text-[13px] font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/teacher/lessons/${lesson._id}?courseId=${id}`}
                        className="block truncate text-[15px] font-semibold hover:text-primary"
                      >
                        {lesson.title}
                      </Link>
                      {meta && (
                        <span className="block text-[13px] text-muted-foreground">{meta}</span>
                      )}
                    </span>
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Yuqoriga"
                        disabled={idx === 0 || reorderLessons.isPending}
                        onClick={() => moveLesson(lesson._id, idx - 1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Pastga"
                        disabled={idx === sortedLessons.length - 1 || reorderLessons.isPending}
                        onClick={() => moveLesson(lesson._id, idx + 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/teacher/lessons/${lesson._id}?courseId=${id}`} />}
                    >
                      Tahrir
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
                      >
                        <Trash2 className="size-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Darsni o&apos;chirasizmi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{lesson.title}&quot; o&apos;chiriladi. Bu amalni bekor qilib
                            bo&apos;lmaydi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => deleteLesson.mutate(lesson._id)}
                          >
                            O&apos;chirish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
              {thumbnail && (
                <Image
                  src={thumbnail}
                  alt={course.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
              <button
                type="button"
                aria-label="Rasmni almashtirish"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-sm font-semibold text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
              >
                {uploadThumbnail.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Camera className="size-5" />
                )}
                Muqovani almashtirish
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadThumbnail.mutate({ id, file });
                  e.target.value = '';
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="course-published"
                  checked={course.isPublished ?? false}
                  onCheckedChange={(checked) => updateCourse.mutate({ id, isPublished: checked })}
                />
                <Label htmlFor="course-published" className="font-semibold">
                  {course.isPublished ? 'Nashr qilingan' : 'Qoralama'}
                </Label>
              </div>
              {stats && (
                <span className="text-sm text-muted-foreground">
                  ★ {stats.rating.avg ? stats.rating.avg.toFixed(1) : '—'} ·{' '}
                  {formatNumber(stats.rating.count)} sharh
                </span>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5">
            <h2 className="font-bold">Kurs ma&apos;lumotlari</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) =>
                  updateCourse.mutate({ id, ...values, price: toTiyin(values.price) })
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Kurs nomi</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Tavsif</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Kategoriya</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={
                          categories?.map((cat) => ({ value: cat._id, label: cat.name })) ?? []
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Narx (so&apos;m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          {...field}
                          value={field.value as number}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateCourse.isPending}>
                  {updateCourse.isPending && <Loader2 className="size-4 animate-spin" />}
                  Saqlash
                </Button>
              </form>
            </Form>
          </section>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  className="border-destructive/35 text-destructive hover:bg-destructive-soft hover:text-destructive"
                />
              }
            >
              <Trash2 className="size-4" /> Kursni o&apos;chirish
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kursni o&apos;chirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu amalni bekor qilib bo&apos;lmaydi. Kurs va unga bog&apos;liq darslar
                  o&apos;chib ketadi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    deleteCourse.mutate(id, { onSuccess: () => router.push('/teacher/courses') })
                  }
                >
                  O&apos;chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </aside>
      </div>
    </div>
  );
}
