import Link from 'next/link';
import { Star } from 'lucide-react';
import { coverTone } from '@/components/dashboard/dashboard-ui';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

// Ochiq kurslar kartochkasi (edu-platform-dizayn: Main / Catalog)
export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const category = typeof course.category === 'object' ? course.category?.name : undefined;
  const thumbnail = resolveAssetUrl(course.thumbnail);
  const isFree = !course.price;

  return (
    <Link
      href={`/courses/${course._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card transition-colors hover:border-primary/40"
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={cn(
            'flex aspect-video items-end p-[18px] font-heading text-[40px] font-bold',
            coverTone(index)
          )}
        >
          <span className="opacity-90">{course.title.slice(0, 2)}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <span className="text-[13px] font-medium text-muted-foreground">
          {[category, course.lessonsCount != null ? `${course.lessonsCount} dars` : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <h3 className="line-clamp-2 text-lg font-bold leading-snug group-hover:text-primary">
          {course.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {course.rating ? (
              <>
                <Star className="size-4 fill-gold text-gold" /> {course.rating.toFixed(1)}
                {course.reviewsCount ? ` · ${formatNumber(course.reviewsCount)} sharh` : ''}
              </>
            ) : (
              'Yangi kurs'
            )}
          </span>
          {isFree ? (
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-[13px] font-bold text-success">
              Bepul
            </span>
          ) : (
            <span className="font-heading text-[15px] font-semibold">
              {formatPrice(course.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return <div className="h-80 animate-pulse rounded-[20px] bg-muted" />;
}
