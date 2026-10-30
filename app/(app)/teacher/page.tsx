'use client';

import Link from 'next/link';
import { Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ErrorState } from '@/components/ui/error-state';
import {
  DashboardGreeting,
  SectionCard,
  SectionLink,
  StatGrid,
  StatTile,
  StatusPill,
  type StatusPillTone,
} from '@/components/dashboard/dashboard-ui';
import { useAuthStore } from '@/store/auth-store';
import { useTeacherStats, useTopTeachers } from '@/hooks/use-stats';
import { usePendingReviews, useQuizShares, useQuizzesMy } from '@/hooks/use-quizzes';
import { formatNumber, formatPrice, initials } from '@/lib/format';
import type { Attempt, Quiz, User } from '@/types';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Xayrli tong';
  if (hour < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

function quizStatus(quiz: Quiz): { label: string; tone: StatusPillTone } {
  if (!quiz.isActive) return { label: 'Qoralama', tone: 'neutral' };
  const now = Date.now();
  const starts = [quiz.availableFrom, ...quiz.targetGrades.map((tg) => tg.availableFrom)]
    .filter((v): v is string => !!v)
    .map((v) => new Date(v).getTime());
  if (starts.length > 0 && Math.min(...starts) > now)
    return { label: 'Rejalashtirilgan', tone: 'warning' };
  return { label: 'Faol', tone: 'success' };
}

function gradesLabel(quiz: Quiz) {
  if (quiz.targetGrades.length === 0) return '—';
  return quiz.targetGrades
    .map((tg) => (tg.letter ? `${tg.number}-${tg.letter}` : `${tg.number}-sinf`))
    .join(', ');
}

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const stats = useTeacherStats();
  const quizzes = useQuizzesMy({ page: 1, limit: 100 });
  const { data: topTeachers } = useTopTeachers(1, 1);
  const pending = usePendingReviews({ page: 1, limit: 4 });
  const { data: incomingShares } = useQuizShares('incoming', 'pending');

  const firstName = user?.name?.split(' ')[0] ?? '';
  const isPremium = user?.tarif === 'premium';
  const myRank = topTeachers?.me?.rank;
  const pendingReviews = pending.data?.items ?? [];
  const pendingTotal = pending.data?.total ?? 0;

  const s = stats.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <DashboardGreeting
        title={`${greeting()}, ${firstName}`}
        subtitle={
          isPremium ? 'Tarif: Premium — testlarda kengaytirilgan urinish limiti' : 'Tarif: Standart'
        }
        actions={
          <>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-4 font-semibold"
              render={<Link href="/teacher/courses/new" />}
            >
              <Plus className="size-4" /> Kurs
            </Button>
            <Button
              size="lg"
              className="h-11 px-4 font-semibold"
              render={<Link href="/teacher/quizzes/new" />}
            >
              <Plus className="size-4" /> Yangi test
            </Button>
          </>
        }
      />

      {stats.isError ? (
        <ErrorState onRetry={() => stats.refetch()} />
      ) : (
        <StatGrid>
          <StatTile
            label="Kurslar"
            value={formatNumber(s?.courses.total ?? 0)}
            href="/teacher/courses"
            loading={stats.isLoading}
          />
          <StatTile
            label="Nashr qilingan"
            value={formatNumber(s?.courses.published ?? 0)}
            loading={stats.isLoading}
          />
          <StatTile
            label="O'rtacha reyting"
            value={s ? s.rating.avg.toFixed(1) : '—'}
            loading={stats.isLoading}
          />
          <StatTile
            label="Daromad"
            value={<span className="text-[22px]">{formatPrice(s?.revenue.total ?? 0)}</span>}
            loading={stats.isLoading}
          />
          <StatTile
            label="O'rtacha test balli"
            value={s ? Math.round(s.quizzes.avgScore) : '—'}
            href="/teacher/stats"
            loading={stats.isLoading}
          />
          <StatTile
            label="O'tish foizi"
            value={s ? `${Math.round(s.quizzes.passRate)}%` : '—'}
            href="/teacher/stats"
            loading={stats.isLoading}
          />
        </StatGrid>
      )}

      {(incomingShares?.length ?? 0) > 0 && (
        <Link
          href="/teacher/quizzes"
          className="flex items-center gap-3 rounded-[18px] border border-primary/30 bg-primary-soft p-4 transition-colors hover:border-primary/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Share2 className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">
              Sizga {incomingShares!.length} ta test ulashildi
            </span>
            <span className="block text-sm text-muted-foreground">
              Qabul qilsangiz, nusxasi testlaringizga qo&apos;shiladi
            </span>
          </span>
          <span className="text-sm font-semibold text-primary">Ko&apos;rish →</span>
        </Link>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SectionCard
          flush
          title="Testlarim"
          action={<SectionLink href="/teacher/quizzes">Barchasi</SectionLink>}
        >
          {quizzes.isError ? (
            <div className="p-5">
              <ErrorState onRetry={() => quizzes.refetch()} />
            </div>
          ) : quizzes.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (quizzes.data?.items.length ?? 0) === 0 ? (
            <div className="flex flex-col items-start gap-3 p-5">
              <p className="text-muted-foreground">Hali test yaratmagansiz.</p>
              <Button render={<Link href="/teacher/quizzes/new" />}>
                <Plus className="size-4" /> Birinchi testni yaratish
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Test</th>
                    <th className="px-3 py-3 font-semibold">Sinflar</th>
                    <th className="px-3 py-3 font-semibold">Savollar</th>
                    <th className="px-3 py-3 font-semibold">Holat</th>
                    <th className="px-5 py-3 font-semibold">O&apos;rtacha</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.data!.items.slice(0, 6).map((quiz) => {
                    const status = quizStatus(quiz);
                    return (
                      <tr key={quiz._id} className="border-t border-muted">
                        <td className="px-5 py-3.5 font-semibold">
                          <Link
                            href={`/teacher/quizzes/${quiz._id}`}
                            className="hover:text-primary"
                          >
                            {quiz.title}
                          </Link>
                        </td>
                        <td className="px-3 py-3.5">{gradesLabel(quiz)}</td>
                        <td className="px-3 py-3.5 tabular-nums">
                          {quiz.questionsCount ?? quiz.questions?.length ?? '—'}
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusPill tone={status.tone}>{status.label}</StatusPill>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {quiz.stats?.avgScorePercent != null
                            ? Math.round(quiz.stats.avgScorePercent)
                            : '—'}
                          {quiz.stats?.pendingReviews ? (
                            <span className="ml-1.5 text-xs font-semibold text-gold-foreground">
                              +{quiz.stats.pendingReviews} kutmoqda
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard
            title="Tekshirish kerak"
            action={pendingTotal > 0 && <StatusPill tone="danger">{pendingTotal}</StatusPill>}
            bodyClassName="flex flex-col gap-3"
          >
            {pending.isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
              ))
            ) : pendingReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Baholanishi kerak bo&apos;lgan javoblar yo&apos;q
              </p>
            ) : (
              <>
                {pendingReviews.map((attempt) => (
                  <PendingReviewRow key={attempt._id} attempt={attempt} />
                ))}
                <Button
                  size="lg"
                  className="h-11 font-semibold"
                  render={<Link href={`/teacher/grading?attempt=${pendingReviews[0]._id}`} />}
                >
                  Baholashni boshlash
                </Button>
              </>
            )}
          </SectionCard>

          <Link
            href="/leaderboard"
            className="flex flex-col gap-1.5 rounded-[20px] bg-primary p-5 text-primary-foreground transition-opacity hover:opacity-95"
          >
            <span className="text-[13px] text-primary-foreground/75">
              Eng faol o&apos;qituvchilar reytingi
            </span>
            <span className="font-heading text-2xl font-bold">
              {myRank ? `${myRank}-o'rin` : "Reytingni ko'rish"}
            </span>
            <span className="text-sm text-primary-foreground/80">
              Kurs, test, dars va kitoblar soniga qarab hisoblanadi
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PendingReviewRow({ attempt }: { attempt: Attempt }) {
  const student = typeof attempt.student === 'object' ? (attempt.student as User) : null;
  const quiz = typeof attempt.quiz === 'object' ? attempt.quiz : null;
  return (
    <Link
      href={`/teacher/grading?attempt=${attempt._id}`}
      className="flex items-center gap-2.5 rounded-xl hover:bg-muted/60"
    >
      <Avatar>
        <AvatarFallback className="bg-primary-soft text-[13px] font-bold text-primary">
          {initials(student?.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{student?.name ?? "O'quvchi"}</span>
        <span className="block truncate text-[13px] text-muted-foreground">
          {quiz?.title ?? 'Test'}
        </span>
      </span>
    </Link>
  );
}
