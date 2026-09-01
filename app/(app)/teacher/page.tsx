'use client';

import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Star,
  Users,
  Wallet,
  Sparkles,
  BarChart3,
  FileQuestion,
  BookMarked,
  ArrowRight,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { useTeacherStats } from '@/hooks/use-stats';
import { useAuthStore } from '@/store/auth-store';
import { formatNumber, formatPrice } from '@/lib/format';

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading, isError, refetch } = useTeacherStats();

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Teacher Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-800 via-purple-800 to-primary p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-primary/20">
        {/* Glow and background circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-amber-400/25 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/25 px-3.5 py-1 text-xs font-bold backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300 shrink-0" />
              <span>Ustoz & Muallif Boshqaruv Markazi</span>
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Xush kelibsiz, {user?.name || 'Ustoz'}!
            </h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              O&apos;quvchilaringizga yangi bilimlarni ulashing, kurslar sifatini oshiring va
              ta&apos;lim natijalarini kuzatib boring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              render={<Link href="/teacher/courses/new" />}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl font-bold rounded-2xl h-11 px-5 cursor-pointer border border-white/40 active:scale-98"
            >
              <Plus className="size-4 mr-1.5 shrink-0" />
              Yangi kurs yaratish
            </Button>
            <Button
              variant="outline"
              render={<Link href="/teacher/quizzes" />}
              className="border-white/40 text-white hover:bg-white/20 bg-white/10 backdrop-blur-md rounded-2xl h-11 px-5 font-bold cursor-pointer active:scale-98"
            >
              <FileQuestion className="size-4 mr-1.5 shrink-0" />
              Testlar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Kurslar */}
          <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs transition-all hover:border-primary/50 card-hover-glow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mening Kurslarim
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? '—' : formatNumber(stats?.courses.total ?? 0)}
              </p>
              <p className="mt-1 text-xs text-primary font-bold flex items-center gap-1">
                <TrendingUp className="size-3.5" /> Faol kurslar
              </p>
            </div>
          </div>

          {/* O'quvchilar */}
          <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/50 card-hover-glow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Jami O&apos;quvchilar
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <Users className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? '—' : formatNumber(stats?.students.total ?? 0)}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                Tinglovchilar auditoriyasi
              </p>
            </div>
          </div>

          {/* Daromad */}
          <div className="rounded-2xl border border-amber-500/30 bg-card p-5 shadow-xs transition-all hover:border-amber-500/50 card-hover-glow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Umumiy Daromad
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <Wallet className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? '—' : formatPrice(stats?.revenue.total ?? 0)}
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
                Kurslar sotuvidan tushum
              </p>
            </div>
          </div>

          {/* O'rtacha Reyting */}
          <div className="rounded-2xl border border-purple-500/30 bg-card p-5 shadow-xs transition-all hover:border-purple-500/50 card-hover-glow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                O&apos;rtacha Reyting
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                <Star className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {isLoading ? '—' : stats?.rating.avg ? stats.rating.avg.toFixed(1) : '5.0'}
              </p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-bold">
                O&apos;quvchilar bahosi
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control & Management Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Boshqaruv va Vositalar
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/teacher/courses" className="group">
            <Card className="h-full border border-border/80 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg card-hover-glow">
              <CardContent className="flex flex-col justify-between h-full p-5">
                <div className="space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary group-hover:scale-105 transition-transform">
                    <BookOpen className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      Kurslarni Boshqarish
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Yangi darslar qo&apos;shing, modullarni va narxlarni tahrirlang
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-primary pt-3 border-t border-border/60">
                  <span>Kurslarga o&apos;tish</span>
                  <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/quizzes" className="group">
            <Card className="h-full border border-border/80 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg card-hover-glow">
              <CardContent className="flex flex-col justify-between h-full p-5">
                <div className="space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 group-hover:scale-105 transition-transform">
                    <FileQuestion className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      Testlar & Savollar
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Savollar bankini boyiting va sinov testlari yarating
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-primary pt-3 border-t border-border/60">
                  <span>Testlarga o&apos;tish</span>
                  <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/books" className="group">
            <Card className="h-full border border-border/80 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg card-hover-glow">
              <CardContent className="flex flex-col justify-between h-full p-5">
                <div className="space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 group-hover:scale-105 transition-transform">
                    <BookMarked className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      Kitoblar & Resurslar
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      O&apos;quv materiallari va elektron kitoblarni boshqaring
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-primary pt-3 border-t border-border/60">
                  <span>Kutubxonaga o&apos;tish</span>
                  <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/stats" className="group">
            <Card className="h-full border border-border/80 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg card-hover-glow">
              <CardContent className="flex flex-col justify-between h-full p-5">
                <div className="space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 group-hover:scale-105 transition-transform">
                    <BarChart3 className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      Batafsil Tahlillar
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      O&apos;quvchilar faolligi va daromad grafiklarini ko&apos;ring
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-primary pt-3 border-t border-border/60">
                  <span>Tahlillarni ko&apos;rish</span>
                  <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Teacher Pro Tip / Motivation Box */}
      <div className="rounded-3xl border border-primary/30 bg-primary/5 dark:bg-primary/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Lightbulb className="size-6" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold text-foreground">Ustoz uchun foydali maslahat:</h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Darslar so&apos;ngida qisqa 3-5 savolli testlar qo&apos;shish o&apos;quvchilarning
            bilimni o&apos;zlashtirish darajasini va kurs reytingini sezilarli darajada oshiradi!
          </p>
        </div>
        <Button
          render={<Link href="/teacher/courses/new" />}
          variant="outline"
          size="sm"
          className="rounded-xl shrink-0 font-bold"
        >
          Dars yuklash
        </Button>
      </div>
    </div>
  );
}
