import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lesson } from '@/types';

// Kurs darslari ro'yxati (dars sahifasining yon paneli va kurs sahifasi uchun)
export function CourseLessonsList({
  lessons,
  completed,
  currentLessonId,
}: {
  lessons: Lesson[];
  completed: Set<string>;
  currentLessonId?: string;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {lessons.map((lesson, index) => {
        const done = completed.has(lesson._id);
        const current = lesson._id === currentLessonId;
        return (
          <li key={lesson._id}>
            <Link
              href={`/student/lessons/${lesson._id}`}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors',
                current ? 'bg-primary-soft font-bold text-primary' : 'hover:bg-muted'
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  done
                    ? 'bg-success-soft text-success'
                    : current
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
              {lesson.durationMinutes ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {lesson.durationMinutes} daq
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function sortLessons(lessons: Lesson[] | undefined) {
  return [...(lessons ?? [])].sort((a, b) => a.order - b.order);
}
