'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Award,
  ArrowRight,
  RotateCw,
  Trophy,
  PlayCircle,
  Sparkles,
  Flame,
  FileCheck2,
  Gift,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { useMyEnrollments } from '@/hooks/use-enrollment';
import { useMyCertificates } from '@/hooks/use-certificates';
import { formatNumber } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/config';

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: enrollments, isLoading, isError, refetch } = useMyEnrollments(1, 6);
  const { data: certificates } = useMyCertificates(1, 1);

  const inProgress = enrollments?.items.filter((e) => !e.isCompleted) ?? [];
  const completed = enrollments?.items.filter((e) => e.isCompleted) ?? [];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-700 via-purple-700 to-primary p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-primary/20">
        {/* Glow & background patterns */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-60 rounded-full bg-amber-400/25 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/25 px-3.5 py-1 text-xs font-bold backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300 shrink-0" />
              <span>O&apos;quvchi Paneli</span>
              {user?.grade && (
                <span className="bg-white/25 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  {user.grade.number}-{user.grade.letter} sinf
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Salom, {user?.name?.split(' ')[0] || "O'quvchi"}! 👋
            </h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Bugun ham yangi bilimlarni egallang, darslarni ko&apos;ring va qimmatbaho olmoslar to&apos;plang!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              render={<Link href="/courses" />}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl font-bold rounded-2xl h-11 px-5 cursor-pointer border border-white/40 active:scale-98"
            >
              <Compass className="size-4 mr-1.5 text-primary shrink-0" />
              Kurslarni kashf etish
            </Button>
            <Button
              variant="outline"
              render={<Link href="/student/quizzes" />}
              className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-md rounded-2xl h-11 px-5 font-bold cursor-pointer active:scale-98"
            >
              <FileCheck2 className="size-4 mr-1.5 shrink-0" />
              Testlar
            </Button>
          </div>
        </div>
      </div>

      {/* Daily Spin & Motivation Card */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-12 items-stretch">
        <Link
          href="/student/daily-spin"
          className="group md:col-span-8 relative overflow-hidden rounded-3xl border border-amber-500/40 bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-transparent p-5 sm:p-6 transition-all duration-300 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/15 card-hover-glow"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-300">
                <RotateCw className="size-7 transition-transform duration-700 group-hover:rotate-180" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-foreground">
                    Kunlik baraban
                  </span>
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                    Sovg&apos;a
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Har kuni barabanni aylantiring va bepul olmoslar hamda sovrinlarni yutib oling!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center font-bold text-sm text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Aylantirish</span>
              <ArrowRight className="size-4" />
            </div>
          </div>
        </Link>

        {/* Diamonds Quick Card */}
        <Link
          href="/student/rewards"
          className="group md:col-span-4 flex items-center justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-md card-hover-glow"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 shadow-xs">
              <DiamondIcon className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">
                {formatNumber(user?.diamonds ?? 0)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">Mavjud olmoslar</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary group-hover:underline">Do&apos;kon</span>
        </Link>
      </div>

      {/* Dynamic Statistics Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Olmoslar */}
        <div className="rounded-2xl border border-amber-500/30 bg-card p-5 shadow-xs transition-all hover:border-amber-500/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mening olmoslarim</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <DiamondIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {formatNumber(user?.diamonds ?? 0)}
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
              Darslar orqali olmos to&apos;plang
            </p>
          </div>
        </div>

        {/* Kurslar */}
        <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs transition-all hover:border-primary/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aktiv Kurslar</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BookOpen className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {enrollments?.total ?? 0}
            </p>
            <p className="mt-1 text-xs text-primary font-bold">
              {inProgress.length} tasi o&apos;rganilmoqda
            </p>
          </div>
        </div>

        {/* Sertifikatlar */}
        <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sertifikatlar</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Award className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {certificates?.total ?? 0}
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              Rasmiy yutuqlar
            </p>
          </div>
        </div>

        {/* Tugallangan darslar */}
        <div className="rounded-2xl border border-purple-500/30 bg-card p-5 shadow-xs transition-all hover:border-purple-500/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tugallangan</span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
              <CheckCircle className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {completed.length}
            </p>
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-bold">
              Muvaffaqiyatli kurslar
            </p>
          </div>
        </div>
      </div>

      {/* In Progress Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>O&apos;rganishni davom eting</span>
              <span className="rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                {inProgress.length}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Oxirgi to&apos;xtagan joyingizdan darslarni davom ettiring
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/student/courses" />}
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary/80"
          >
            Barchasi <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <SkeletonCardGrid count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : inProgress.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-8 sm:p-12 text-center bg-card/60">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4 shadow-xs">
              <Trophy className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Hali hech qanday kursga yozilmagansiz</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
              Platformamizda minglab qiziqarli darslar mavjud. O&apos;zingizga ma&apos;qul kursni tanlang va bugunoq boshlang!
            </p>
            <Button render={<Link href="/courses" />} className="rounded-2xl px-6 h-11 shadow-md shadow-primary/20 font-bold">
              <Compass className="size-4 mr-2" /> Kurslarni ko&apos;rish
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((enrollment) => {
              const course = typeof enrollment.course === 'object' ? enrollment.course : null;
              if (!course) return null;
              const thumbnail = resolveAssetUrl(course.thumbnail);
              const progressVal = Math.round(enrollment.progress ?? 0);

              return (
                <Link
                  key={enrollment._id}
                  href={`/student/courses/${enrollment._id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 card-hover-glow"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={course.title}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-tr from-primary/20 to-purple-500/20 text-primary">
                          <PlayCircle className="size-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="flex size-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                          <PlayCircle className="size-6 fill-current text-primary" />
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="line-clamp-2 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">O&apos;zlashtirish</span>
                      <span className="font-extrabold text-primary">{progressVal}%</span>
                    </div>
                    <Progress value={progressVal} className="h-2 rounded-full" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
        <Link
          href="/student/quizzes"
          className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 card-hover-glow"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
            <FileCheck2 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Testlar bazasi</p>
            <p className="text-xs text-muted-foreground">Bilimingizni sinang</p>
          </div>
        </Link>

        <Link
          href="/student/certificates"
          className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 card-hover-glow"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500">
            <Award className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Sertifikatlar</p>
            <p className="text-xs text-muted-foreground">Yutuqlaringizni ko&apos;ring</p>
          </div>
        </Link>

        <Link
          href="/student/rewards"
          className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 card-hover-glow"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500">
            <Gift className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Mukofotlar</p>
            <p className="text-xs text-muted-foreground">Olmoslarni almashtiring</p>
          </div>
        </Link>

        <Link
          href="/student/wallet"
          className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 card-hover-glow"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Hamyon & To&apos;lovlar</p>
            <p className="text-xs text-muted-foreground">Balans va operatsiyalar</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

