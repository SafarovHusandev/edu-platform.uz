'use client';

import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard, StatGrid, StatTile } from '@/components/dashboard/dashboard-ui';
import { useTeacherStats } from '@/hooks/use-stats';
import { formatNumber, formatPrice } from '@/lib/format';

export default function TeacherStatsPage() {
  const { data: stats, isLoading, isError, refetch } = useTeacherStats();
  const draft = (stats?.courses.total ?? 0) - (stats?.courses.published ?? 0);
  const passRate = Math.round(stats?.quizzes.passRate ?? 0);

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageHeader
        title="Statistika"
        description="Kurslaringiz va testlaringiz bo'yicha umumiy ko'rsatkichlar"
        className="mb-0"
      />

      <StatGrid>
        <StatTile
          tone="primary"
          label="Jami daromad"
          value={<span className="text-[22px]">{formatPrice(stats?.revenue.total ?? 0)}</span>}
          loading={isLoading}
        />
        <StatTile
          label="O'quvchilar"
          value={formatNumber(stats?.students.total ?? 0)}
          loading={isLoading}
        />
        <StatTile
          label="Nashr qilingan kurslar"
          value={formatNumber(stats?.courses.published ?? 0)}
          href="/teacher/courses"
          loading={isLoading}
        />
        <StatTile label="Qoralama kurslar" value={formatNumber(draft)} loading={isLoading} />
        <StatTile
          label="O'rtacha reyting"
          value={stats?.rating.avg ? stats.rating.avg.toFixed(1) : '—'}
          loading={isLoading}
        />
      </StatGrid>

      <SectionCard title="Testlar" bodyClassName="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Testlar soni', value: formatNumber(stats?.quizzes.totalQuizzes ?? 0) },
            { label: 'Urinishlar', value: formatNumber(stats?.quizzes.totalAttempts ?? 0) },
            { label: "O'rtacha ball", value: `${Math.round(stats?.quizzes.avgScore ?? 0)}%` },
            { label: "O'tish darajasi", value: `${passRate}%` },
          ].map((item) => (
            <div key={item.label}>
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded-lg bg-muted" />
              ) : (
                <div className="font-heading text-2xl font-bold">{item.value}</div>
              )}
              <div className="text-[13px] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[13px] text-muted-foreground">
            <span>O&apos;tganlar ulushi</span>
            <span className="font-semibold text-foreground">{passRate}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success" style={{ width: `${passRate}%` }} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
