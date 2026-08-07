'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Camera, GripVertical, Loader2, Plus, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  useCourse,
  useCourseStats,
  useDeleteCourse,
  useUpdateCourse,
  useUploadThumbnail,
} from '@/hooks/use-courses';
import { useCategories } from '@/hooks/use-categories';
import { useCreateLesson, useDeleteLesson } from '@/hooks/use-lessons';
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
  const { data, isLoading } = useCourse(id);
  const course = data?.course;
  const lessons = data?.lessons;
  const { data: stats } = useCourseStats(id);
  const { data: categories } = useCategories();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const uploadThumbnail = useUploadThumbnail();
  const createLesson = useCreateLesson(id);
  const deleteLesson = useDeleteLesson(id);

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

  if (isLoading || !course) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/teacher/courses" />}>
          <ArrowLeft className="size-4" /> Kurslarga qaytish
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" /> {course.studentsCount ?? 0}&nbsp; o&apos;quvchi
        </span>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-2">
          <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
            {thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt={course.title} className="size-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
            >
              {uploadThumbnail.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Camera className="size-5" />
              )}
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
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={course.isPublished ?? false}
                onCheckedChange={(checked) => updateCourse.mutate({ id, isPublished: checked })}
              />
              <Label>{course.isPublished ? 'Nashr etilgan' : 'Qoralama'}</Label>
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="size-4" /> O&apos;chirish
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
                    onClick={() =>
                      deleteCourse.mutate(id, { onSuccess: () => router.push('/teacher/courses') })
                    }
                  >
                    O&apos;chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">Daromad</p>
              <p className="mt-1 text-xl font-semibold">{formatPrice(stats.revenue.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">O&apos;rtacha baho</p>
              <p className="mt-1 text-xl font-semibold">
                {stats.rating.avg ? stats.rating.avg.toFixed(1) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">Sharhlar</p>
              <p className="mt-1 text-xl font-semibold">{formatNumber(stats.rating.count)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kurs ma&apos;lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <FormLabel>Kurs nomi</FormLabel>
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
                    <FormLabel>Tavsif</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategoriya</FormLabel>
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
                      <FormLabel>Narx</FormLabel>
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
              </div>
              <Button type="submit" disabled={updateCourse.isPending}>
                {updateCourse.isPending && <Loader2 className="size-4 animate-spin" />}
                Saqlash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Darslar ({lessons?.length ?? 0})</CardTitle>
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
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, content: e.target.value }))}
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
        </CardHeader>
        <CardContent>
          {!lessons || lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali darslar qo&apos;shilmagan</p>
          ) : (
            <ol className="space-y-2">
              {lessons
                .sort((a, b) => a.order - b.order)
                .map((lesson, idx) => (
                  <li
                    key={lesson._id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/teacher/lessons/${lesson._id}`}
                      className="flex-1 text-sm font-medium hover:underline"
                    >
                      {lesson.title}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="O'chirish"
                      onClick={() => deleteLesson.mutate(lesson._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
