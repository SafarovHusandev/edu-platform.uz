import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ShieldCheck, PlayCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';

export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-border/60">
      {/* Background radial glows & grids */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_55%_at_50%_-20%,var(--color-primary),transparent)] opacity-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-grid-pattern opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 -left-20 -z-10 size-80 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -right-20 -z-10 size-80 rounded-full bg-amber-400/25 blur-3xl"
      />

      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span>Yangi avlod interaktiv ta&apos;lim platformasi</span>
        </div>

        <h1 className="max-w-4xl text-balance font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl text-foreground">
          O&apos;rganing, sinovdan o&apos;ting va{' '}
          <span className="bg-linear-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            mukofotlarni
          </span>{' '}
          qo&apos;lga kiriting!
        </h1>

        <p className="max-w-2xl text-balance text-base text-muted-foreground sm:text-lg leading-relaxed">
          Darslarni tugating, testlardan o&apos;ting — olmos ishlab toping. Kunlik barabanni
          aylantiring, reytingda ko&apos;tariling va olmoslaringizni haqiqiy sovg&apos;alarga
          almashtiring. Tasdiqlangan sertifikatlar va minglab darslar bilan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            size="lg"
            className="h-12 px-7 text-base font-bold shadow-xl shadow-primary/25 rounded-2xl bg-linear-to-r from-primary to-indigo-600 hover:shadow-primary/40 hover:opacity-95 transition-all duration-200 cursor-pointer"
            render={<Link href="/courses" />}
          >
            Kurslarni kashf etish
            <ArrowRight className="size-4 ml-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-border/80 bg-card/80 px-7 text-base font-bold rounded-2xl backdrop-blur-md hover:bg-muted cursor-pointer transition-all duration-200"
            render={<Link href="/register" />}
          >
            Bepul ro&apos;yxatdan o&apos;tish
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold">
          <span className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-600 dark:text-emerald-400 shadow-xs backdrop-blur-md">
            <ShieldCheck className="size-4" />
            Tasdiqlangan sertifikatlar
          </span>
          <span className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-600 dark:text-amber-400 shadow-xs backdrop-blur-md">
            <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" />
            Kunlik baraban va olmos mukofotlari
          </span>
          <span className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-primary shadow-xs backdrop-blur-md">
            <Sparkles className="size-4" />
            Moslashuvchan shaxsiy kabinet
          </span>
        </div>
      </Container>
    </div>
  );
}

