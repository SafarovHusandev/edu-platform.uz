'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { CourseLessonsList, sortLessons } from '@/components/courses/course-lessons-list';
import { enrollmentProgress } from '@/components/courses/enrollment-card';
import { useLesson, useCompleteLesson, useCourseLessons } from '@/hooks/use-lessons';
import { useMyEnrollments } from '@/hooks/use-enrollment';
import { useQuizzes } from '@/hooks/use-quizzes';
import { resolveAssetUrl } from '@/lib/config';
import { LessonVideo, isVideoFile } from '@/components/courses/lesson-video';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LessonViewerPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: lesson, isLoading, isError, refetch } = useLesson(id);
  const completeLesson = useCompleteLesson();
  const { data: courseLessons } = useCourseLessons(lesson?.course);
  const { data: enrollments } = useMyEnrollments(1, 50);
  const { data: quizzes } = useQuizzes({ page: 1, limit: 50 });

  if (isLoading) {
    return <div className="mx-auto h-96 w-full max-w-6xl animate-pulse rounded-[22px] bg-muted" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!lesson) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Dars topilmadi"
        action={
          <Button variant="outline" render={<Link href="/student/courses" />}>
            Kurslarimga qaytish
          </Button>
        }
      />
    );
  }

  if (lesson.locked) {
    return (
      <EmptyState
        icon={Lock}
        title={lesson.title}
        description="Bu dars yopiq. Darsni ko'rish uchun avval kursga yoziling yoki kursni sotib oling."
        action={
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              render={<Link href={lesson.course ? `/courses/${lesson.course}` : '/courses'} />}
            >
              {lesson.course ? 'Kursni sotib olish' : "Kurslarni ko'rish"}
            </Button>
            <Button variant="outline" render={<Link href="/student/courses" />}>
              Kurslarim
            </Button>
          </div>
        }
      />
    );
  }

  const lessons = sortLessons(courseLessons);
  const enrollment = enrollments?.items.find(
    (e) => (typeof e.course === 'object' ? e.course._id : e.course) === lesson.course
  );
  const course = enrollment && typeof enrollment.course === 'object' ? enrollment.course : null;
  const completed = new Set(enrollment?.completedLessons ?? []);
  const isDone = lesson.isCompleted || completed.has(lesson._id);
  const progress = enrollment ? enrollmentProgress(enrollment, lessons.length || undefined) : null;
  const lessonIndex = lessons.findIndex((l) => l._id === lesson._id);
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;
  const lessonQuiz = quizzes?.items.find(
    (q) => q.targetType === 'lesson' && q.targetId === lesson._id && q.isActive !== false
  );

  const videoAttachments = (lesson.attachments ?? []).filter((path) => isVideoFile(path));
  const attachments = (lesson.attachments ?? [])
    .filter((path) => !isVideoFile(path))
    .map((path) => ({
      path,
      url: resolveAssetUrl(path),
      name: decodeURIComponent(path.split('/').pop() ?? path),
      ext: (path.split('.').pop() ?? '').toUpperCase().slice(0, 4),
    }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
        <Link href="/student/courses" className="hover:text-foreground">
          Kurslarim
        </Link>
        {course && enrollment && (
          <>
            {' / '}
            <Link href={`/student/courses/${enrollment._id}`} className="hover:text-foreground">
              {course.title}
            </Link>
          </>
        )}
        {lessonIndex >= 0 && <> / {lessonIndex + 1}-dars</>}
      </nav>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          {lesson.videoUrl && <LessonVideo url={lesson.videoUrl} />}
          {videoAttachments.map((path) => (
            <LessonVideo key={path} url={path} />
          ))}

          <div>
            <h1 className="font-heading text-2xl font-semibold wrap-break-word sm:text-[26px]">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="mt-2 text-muted-foreground">{lesson.description}</p>
            )}
          </div>

          {lesson.content && (
            <div className="whitespace-pre-wrap rounded-[20px] border border-border bg-card p-5 leading-relaxed">
              {lesson.content}
            </div>
          )}

          {(attachments.length > 0 || lessonQuiz) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {attachments.map(({ path, url, name, ext }) => (
                <a
                  key={path}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-xs font-bold text-destructive">
                    {ext || <FileText className="size-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{name}</span>
                    <span className="block text-[13px] text-muted-foreground">Yuklab olish</span>
                  </span>
                </a>
              ))}
              {lessonQuiz && (
                <Link
                  href={`/student/quizzes/${lessonQuiz._id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">Dars testi</span>
                    <span className="block text-[13px] text-muted-foreground">
                      {[
                        lessonQuiz.questionsCount != null
                          ? `${lessonQuiz.questionsCount} savol`
                          : null,
                        lessonQuiz.timeLimit ? `${lessonQuiz.timeLimit} daq` : null,
                        '+olmos',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </Link>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <Button
              size="lg"
              variant={isDone ? 'outline' : 'default'}
              onClick={() => completeLesson.mutate(id)}
              disabled={completeLesson.isPending || isDone}
              className={isDone ? 'border-success text-success' : undefined}
            >
              {completeLesson.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isDone ? 'Tugatilgan' : 'Tugatdim'}
            </Button>
            {nextLesson && (
              <Button
                size="lg"
                variant={isDone ? 'default' : 'outline'}
                render={<Link href={`/student/lessons/${nextLesson._id}`} />}
              >
                Keyingi dars <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {lessons.length > 0 && (
          <aside
            aria-label="Kurs darslari"
            className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4 lg:sticky lg:top-0"
          >
            {course && (
              <div className="flex flex-col gap-2 px-1 pb-1">
                <span className="font-bold">{course.title}</span>
                {progress && (
                  <>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <span className="text-[13px] text-muted-foreground">
                      {progress.done}/{lessons.length} dars tugatildi
                    </span>
                  </>
                )}
              </div>
            )}
            <CourseLessonsList
              lessons={lessons}
              completed={completed}
              currentLessonId={lesson._id}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
