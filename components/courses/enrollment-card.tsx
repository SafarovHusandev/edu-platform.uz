import Link from 'next/link';
import { coverTone } from '@/components/dashboard/dashboard-ui';
import { resolveAssetUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { Course, Enrollment } from '@/types';

export function enrollmentCourse(enrollment: Enrollment) {
  return typeof enrollment.course === 'object' ? (enrollment.course as Course) : null;
}

export function enrollmentProgress(enrollment: Enrollment, lessonsTotal?: number) {
  const course = enrollmentCourse(enrollment);
  const done = enrollment.completedLessons?.length ?? 0;
  const total = lessonsTotal ?? course?.lessonsCount ?? 0;
  const percent =
    enrollment.progress != null
      ? Math.round(enrollment.progress)
      : total > 0
        ? Math.round((done / total) * 100)
        : 0;
  return { done, total, percent: Math.min(100, Math.max(0, percent)) };
}

// Kurs rasmi bo'lmasa — nomining birinchi harflari rangli fonda (dizayndagi x², H₂O)
export function CourseCover({
  course,
  index,
  className,
}: {
  course: Pick<Course, 'title' | 'thumbnail'> | null;
  index: number;
  className?: string;
}) {
  const thumbnail = resolveAssetUrl(course?.thumbnail);
  if (thumbnail) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbnail} alt="" className={cn('w-full object-cover', className)} />;
  }
  return (
    <div
      className={cn(
        'flex items-end p-3.5 font-heading text-[28px] font-bold',
        coverTone(index),
        className
      )}
    >
      {(course?.title ?? 'K').slice(0, 2)}
    </div>
  );
}

export function EnrollmentCard({
  enrollment,
  index,
  size = 'default',
}: {
  enrollment: Enrollment;
  index: number;
  size?: 'default' | 'compact';
}) {
  const course = enrollmentCourse(enrollment);
  const progress = enrollmentProgress(enrollment);
  const teacher = course && typeof course.teacher === 'object' ? course.teacher : null;
  const compact = size === 'compact';

  return (
    <Link
      href={`/student/courses/${enrollment._id}`}
      className="flex flex-col overflow-hidden rounded-[18px] border border-border bg-card transition-colors hover:border-primary/40"
    >
      <CourseCover course={course} index={index} className={compact ? 'h-[90px]' : 'h-[120px]'} />
      <div className={cn('flex flex-1 flex-col gap-2', compact ? 'p-3.5' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 font-bold">{course?.title ?? 'Kurs'}</span>
          {!compact && (
            <span className="shrink-0 font-heading text-sm font-bold text-primary">
              {progress.percent}%
            </span>
          )}
        </div>
        {!compact && teacher?.name && (
          <span className="text-[13px] text-muted-foreground">{teacher.name}</span>
        )}
        <div className={cn('mt-auto rounded-full bg-muted', compact ? 'h-1.5' : 'h-2')}>
          <div
            className={cn(
              'rounded-full',
              compact ? 'h-1.5' : 'h-2',
              enrollment.isCompleted ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="text-muted-foreground">
            {progress.total > 0
              ? `${progress.done}/${progress.total} dars`
              : `${progress.percent}%`}
            {compact && progress.total > 0 && ` · ${progress.percent}%`}
          </span>
          {!compact && (
            <span
              className={cn(
                'font-semibold',
                enrollment.isCompleted ? 'text-success' : 'text-primary'
              )}
            >
              {enrollment.isCompleted ? 'Tugatilgan ✓' : 'Davom ettirish →'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
