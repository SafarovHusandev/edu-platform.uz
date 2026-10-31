'use client';

import { Suspense, use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Clapperboard, FileUp, Loader2, Trash2, Upload, X } from 'lucide-react';
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
  useUploadLessonVideo,
  LESSON_VIDEO_ACCEPT,
  LESSON_VIDEO_MAX_BYTES,
} from '@/hooks/use-lessons';
import { resolveAssetUrl } from '@/lib/config';
import { formatFileSize } from '@/lib/format';
import { LessonVideo } from '@/components/courses/lesson-video';

interface PageProps {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  title: z.string().min(2, { error: 'Kamida 2 ta belgi' }),
  description: z.string().optional(),
  content: z.string().optional(),
  // Input qiymati sifatida satr; yuborishda songa aylantiriladi (bo'sh — o'chiriladi)
  durationMinutes: z
    .string()
    .optional()
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) > 0), {
      error: 'Musbat butun son kiriting',
    }),
});

type FormValues = z.infer<typeof schema>;

// Video faylning davomiyligini (daqiqa, yuqoriga yaxlitlangan) brauzerda aniqlaydi
function readVideoMinutes(file: File) {
  return new Promise<number | undefined>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(
        Number.isFinite(video.duration) ? Math.max(1, Math.ceil(video.duration / 60)) : undefined
      );
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

function LessonVideoSection({
  lesson,
  courseId,
}: {
  lesson: { _id: string; videoUrl?: string | null; durationMinutes?: number | null };
  courseId?: string;
}) {
  const uploadVideo = useUploadLessonVideo(courseId);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState('');

  async function handleFile(file: File) {
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) {
      toast.error('Faqat MP4, WebM yoki MOV video yuklash mumkin');
      return;
    }
    if (file.size > LESSON_VIDEO_MAX_BYTES) {
      toast.error(`Video hajmi ${formatFileSize(file.size)} — ruxsat etilgan maksimum 300 MB`);
      return;
    }
    // Davomiylik kiritilmagan bo'lsa, fayldan avtomatik olinadi
    const durationMinutes = lesson.durationMinutes ? undefined : await readVideoMinutes(file);
    const controller = new AbortController();
    abortRef.current = controller;
    setFileName(file.name);
    setProgress(0);
    uploadVideo.mutate(
      {
        id: lesson._id,
        file,
        durationMinutes,
        onProgress: setProgress,
        signal: controller.signal,
      },
      {
        onSettled: () => {
          setProgress(null);
          abortRef.current = null;
        },
      }
    );
  }

  const uploading = progress !== null;
  const percent = Math.round((progress ?? 0) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asosiy video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {uploading ? (
          <div className="space-y-2.5 rounded-[14px] border border-border p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{fileName}</span>
              <span className="shrink-0 font-heading font-semibold text-primary">
                {percent < 100 ? `${percent}%` : 'Qayta ishlanmoqda...'}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </div>
            {percent < 100 && (
              <Button variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>
                <X className="size-4" /> Bekor qilish
              </Button>
            )}
          </div>
        ) : lesson.videoUrl ? (
          <LessonVideo url={lesson.videoUrl} />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-[14px] border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Clapperboard className="size-6" />
            </span>
            <span className="font-semibold">Darsning asosiy videosini yuklang</span>
            <span className="text-sm text-muted-foreground">MP4, WebM yoki MOV · 300 MB gacha</span>
          </button>
        )}

        {!uploading && (
          <Button
            variant={lesson.videoUrl ? 'outline' : 'default'}
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {lesson.videoUrl ? 'Videoni almashtirish' : 'Asosiy videoni yuklash'}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={LESSON_VIDEO_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </CardContent>
    </Card>
  );
}

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
          durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : '',
        }
      : undefined,
  });

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
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
              onSubmit={form.handleSubmit(({ durationMinutes, ...values }) =>
                updateLesson.mutate({
                  id,
                  ...values,
                  durationMinutes: durationMinutes ? Number(durationMinutes) : null,
                })
              )}
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
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem className="sm:max-w-48">
                    <FormLabel>Davomiyligi (daqiqa)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="15"
                        {...field}
                      />
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

      <LessonVideoSection lesson={lesson} courseId={courseId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qo&apos;shimcha materiallar</CardTitle>
          <p className="text-sm text-muted-foreground">
            PDF, taqdimot, mashq fayllari. Darsning asosiy videosini bu yerga emas, yuqoridagi
            &quot;Asosiy video&quot; bo&apos;limiga yuklang.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {attachments.length > 0 ? (
            <ul className="space-y-1.5">
              {attachments.map(({ path, url, name }) => (
                <li
                  key={path}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
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
            Material qo&apos;shish
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
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <LessonEditContent id={id} />
    </Suspense>
  );
}
