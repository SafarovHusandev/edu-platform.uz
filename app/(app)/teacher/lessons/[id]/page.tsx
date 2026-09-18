'use client';

import { Suspense, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, FileUp, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  useLesson,
  useUpdateLesson,
  useDeleteLesson,
  useUploadMaterial,
} from '@/hooks/use-lessons';
import { resolveAssetUrl } from '@/lib/config';

interface PageProps {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  title: z.string().min(2, { error: 'Kamida 2 ta belgi' }),
  description: z.string().optional(),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function LessonEditContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: lesson, isLoading, isError, refetch } = useLesson(id);
  // Backend /lessons/:id javobida `course` maydoni bo'sh kelishi mumkin, shuning
  // uchun kurs sahifasidan o'tilganda query orqali uzatilgan courseId'ga tayanamiz.
  const courseId = lesson?.course || searchParams.get('courseId') || undefined;
  const updateLesson = useUpdateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);
  const uploadMaterial = useUploadMaterial(courseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: lesson
      ? {
          title: lesson.title,
          description: lesson.description ?? '',
          content: lesson.content ?? '',
        }
      : undefined,
  });

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-md bg-muted" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!lesson) {
    return (
      <EmptyState
        title="Dars topilmadi"
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

  const attachments = (lesson.attachments ?? []).map((path) => ({
    path,
    url: resolveAssetUrl(path),
    name: path.split('/').pop() ?? path,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={courseId ? `/teacher/courses/${courseId}` : '/teacher/courses'} />}
        >
          <ArrowLeft className="size-4" /> Kursga qaytish
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
            <Trash2 className="size-4" /> O&apos;chirish
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Darsni o&apos;chirasizmi?</AlertDialogTitle>
              <AlertDialogDescription>Bu amalni bekor qilib bo&apos;lmaydi.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteLesson.mutate(id, {
                    onSuccess: () =>
                      router.push(courseId ? `/teacher/courses/${courseId}` : '/teacher/courses'),
                  })
                }
              >
                O&apos;chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Darsni tahrirlash</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => updateLesson.mutate({ id, ...values }))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dars nomi</FormLabel>
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
                    <FormLabel>Qisqacha tavsif</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dars matni</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateLesson.isPending}>
                {updateLesson.isPending && <Loader2 className="size-4 animate-spin" />}
                Saqlash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qo&apos;shimcha materiallar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {attachments.length > 0 ? (
            <ul className="space-y-1.5">
              {attachments.map(({ path, url, name }) => (
                <li
                  key={path}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm text-primary hover:underline"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Material yuklanmagan</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMaterial.isPending}
          >
            {uploadMaterial.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            Fayl qo&apos;shish
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMaterial.mutate({ id, file });
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeacherLessonEditPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-muted" />}>
      <LessonEditContent id={id} />
    </Suspense>
  );
}
