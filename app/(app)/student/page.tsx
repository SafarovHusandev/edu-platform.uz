'use client';

import Link from 'next/link';
import { ArrowRight, Compass, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { ErrorState } from '@/components/ui/error-state';
import {
  DashboardGreeting,
  SectionLink,
  StatGrid,
  StatTile,
  StatusPill,
} from '@/components/dashboard/dashboard-ui';
import { RecentNotifications } from '@/components/dashboard/recent-notifications';
import { EnrollmentCard } from '@/components/courses/enrollment-card';
import { useNavBadges } from '@/components/layout/use-nav-badges';
import { useAuthStore } from '@/store/auth-store';
import { useMyEnrollments } from '@/hooks/use-enrollment';
import { useDailySpinStatus } from '@/hooks/use-daily-spin';
import { useStudentStats } from '@/hooks/use-stats';
import { useQuizzes } from '@/hooks/use-quizzes';
import { formatNumber, formatTimeLeft } from '@/lib/format';
import type { Quiz, User } from '@/types';

// O'quvchi sinfiga mo'ljallangan, hozir ochiq bo'lgan testlardan eng tez tugaydigani
function pickActiveQuiz(quizzes: Quiz[], user: User | null) {
  const now = Date.now();
  const candidates = quizzes
    // Urinishi qolmagan yoki allaqachon yechilgan testlar "faol" sanalmaydi
    .filter(
      (quiz) =>
        quiz.isActive !== false &&
        (!quiz.myAttempts ||
          (quiz.myAttempts.attemptsRemaining > 0 &&
            (quiz.myAttempts.attemptsUsed === 0 || quiz.myAttempts.hasInProgress)))
    )
    .map((quiz) => {
      const tg = user?.grade?.number
        ? quiz.targetGrades.find(
            (g) => g.number === user.grade!.number && (!g.letter || g.letter === user.grade!.letter)
          )
        : undefined;
      const from = tg?.availableFrom ?? quiz.availableFrom;
      const until = tg?.availableUntil ?? quiz.availableUntil;
      return { quiz, tg, from, until };
    })
    .filter(({ from, until }) => {
      if (from && new Date(from).getTime() > now) return false;
      if (until && new Date(until).getTime() < now) return false;
      return true;
    });
  candidates.sort((a, b) => {
    const at = a.until ? new Date(a.until).getTime() : Infinity;
    const bt = b.until ? new Date(b.until).getTime() : Infinity;
    return at - bt;
  });
  return candidates[0];
}

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const badges = useNavBadges('student');
  const enrollments = useMyEnrollments(1, 6);
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: spin } = useDailySpinStatus();
  const { data: quizzes } = useQuizzes({ page: 1, limit: 50 });

  const firstName = user?.name?.split(' ')[0] || "O'quvchi";
  const gradeLabel = user?.grade?.number
    ? `${user.grade.number}-"${user.grade.letter ?? ''}" sinf`
    : null;

  const inProgress = enrollments.data?.items.filter((e) => !e.isCompleted) ?? [];
  const activeQuiz = pickActiveQuiz(quizzes?.items ?? [], user);
  const activeQuizCount = stats?.activeQuizzesCount ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <DashboardGreeting
        title={`Salom, ${firstName}!`}
        subtitle={[gradeLabel, activeQuizCount > 0 ? `${activeQuizCount} ta faol test bor` : null]
          .filter(Boolean)
          .join(' · ')}
        actions={
          badges.notifications > 0 && (
            <Link
              href="/notifications"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 font-semibold transition-colors hover:border-primary/40"
            >
              <span className="size-2 rounded-full bg-destructive" />
              {badges.notifications} ta yangi bildirishnoma
            </Link>
          )
        }
      />

      <StatGrid>
        <StatTile
          tone="primary"
          label="Olmos balansi"
          value={formatNumber(user?.diamonds ?? 0)}
          icon={<DiamondIcon className="size-6" />}
          href="/student/rewards"
        />
        <StatTile
          label="Reytingdagi o'rin"
          value={stats?.rank != null ? stats.rank : '—'}
          href="/leaderboard"
          loading={statsLoading}
        />
        <StatTile
          label="Tugatilgan darslar"
          value={formatNumber(stats?.completedLessons ?? 0)}
          href="/student/courses"
          loading={statsLoading}
        />
        <StatTile
          label="Sertifikatlar"
          value={formatNumber(stats?.certificatesCount ?? 0)}
          href="/student/certificates"
          loading={statsLoading}
        />
      </StatGrid>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {activeQuiz && (
            <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-border bg-card p-5">
              <div className="min-w-0 flex-[1_1_260px] space-y-1.5">
                <StatusPill tone={activeQuiz.quiz.myAttempts?.hasInProgress ? 'primary' : 'danger'}>
                  {activeQuiz.quiz.myAttempts?.hasInProgress ? 'Davom etmoqda' : 'Faol test'}
                  {activeQuiz.until && formatTimeLeft(activeQuiz.until)
                    ? ` · ${formatTimeLeft(activeQuiz.until)}`
                    : ''}
                </StatusPill>
                <p className="text-lg font-bold wrap-break-word">{activeQuiz.quiz.title}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    activeQuiz.quiz.questionsCount != null
                      ? `${activeQuiz.quiz.questionsCount} savol`
                      : null,
                    (activeQuiz.tg?.effectiveTimeLimit ??
                    activeQuiz.tg?.timeLimit ??
                    activeQuiz.quiz.timeLimit)
                      ? `${activeQuiz.tg?.effectiveTimeLimit ?? activeQuiz.tg?.timeLimit ?? activeQuiz.quiz.timeLimit} daq`
                      : null,
                    activeQuiz.quiz.myAttempts
                      ? `${activeQuiz.quiz.myAttempts.attemptsRemaining}/${activeQuiz.quiz.myAttempts.maxAttempts} urinish qoldi`
                      : `o'tish balli ${activeQuiz.quiz.passingScore}%`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Button
                size="lg"
                className="h-12 px-6 text-base font-bold"
                render={<Link href={`/student/quizzes/${activeQuiz.quiz._id}`} />}
              >
                {activeQuiz.quiz.myAttempts?.hasInProgress ? 'Davom ettirish' : 'Boshlash'}
              </Button>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Davom ettirish</h2>
              <SectionLink href="/student/courses">Barcha kurslar</SectionLink>
            </div>

            {enrollments.isError ? (
              <ErrorState onRetry={() => enrollments.refetch()} />
            ) : enrollments.isLoading ? (
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-[18px] bg-muted" />
                ))}
              </div>
            ) : inProgress.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-[18px] border border-dashed border-input bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Hozircha davom etayotgan kurs yo&apos;q. Yangi kurs tanlab o&apos;rganishni
                  boshlang!
                </p>
                <Button variant="outline" render={<Link href="/courses" />}>
                  <Compass className="size-4" /> Kurslar katalogi
                </Button>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {inProgress.map((enrollment, index) => (
                  <EnrollmentCard
                    key={enrollment._id}
                    enrollment={enrollment}
                    index={index}
                    size="compact"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Link
            href="/student/daily-spin"
            className="flex items-center gap-3.5 rounded-[20px] bg-gold-soft p-[18px] transition-colors hover:bg-gold/25"
          >
            <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-gold text-admin">
              <RotateCw className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Kunlik barabon</span>
              <span className="block text-sm text-gold-foreground">
                {spin
                  ? spin.canSpin
                    ? `${spin.spinsRemainingToday} ta aylanish qoldi`
                    : 'Bugungi aylanishlar tugadi'
                  : 'Har kuni bepul olmos yuting'}
                {spin && spin.streakCount > 0 ? ` · ${spin.streakCount} kunlik seriya` : ''}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0" />
          </Link>

          <RecentNotifications />
        </div>
      </div>
    </div>
  );
}
