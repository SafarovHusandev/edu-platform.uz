import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';

export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_55%_at_50%_-20%,var(--color-primary),transparent)] opacity-[0.15]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)] opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -left-24 -z-10 size-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 -right-24 -z-10 size-72 rounded-full bg-gold/25 blur-3xl"
      />

      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Yangi avlod ta&apos;lim platformasi
        </div>
        <h1 className="max-w-3xl text-balance font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          O&apos;rganing, sinovdan o&apos;ting va{' '}
          <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            mukofotlarni
          </span>{' '}
          qo&apos;lga kiriting
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Kurslar, interaktiv testlar, bepul kitoblar, sertifikatlar va gamifikatsiya — bir
          platformada. O&apos;quvchi, o&apos;qituvchi va administrator uchun moslashtirilgan
          tajriba.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-11 px-6 text-base shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
            render={<Link href="/courses" />}
          >
            Kurslarni ko&apos;rish
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 bg-background/80 px-6 text-base backdrop-blur-sm"
            render={<Link href="/register" />}
          >
            Bepul ro&apos;yxatdan o&apos;tish
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 shadow-xs backdrop-blur-sm">
            <ShieldCheck className="size-4 text-success" />
            Tasdiqlangan sertifikatlar
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 shadow-xs backdrop-blur-sm">
            <Gem className="size-4 text-gold" />
            Olmoslar bilan mukofotlash
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 shadow-xs backdrop-blur-sm">
            <Sparkles className="size-4 text-primary" />
            Har bir rol uchun moslashuvchan panel
          </span>
        </div>
      </Container>
    </div>
  );
}
