import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';

export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-primary),transparent)] opacity-[0.12]"
      />
      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Yangi avlod ta&apos;lim platformasi
        </div>
        <h1 className="max-w-3xl text-balance font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          O&apos;rganing, sinovdan o&apos;ting va{' '}
          <span className="text-primary">mukofotlarni </span> qo&apos;lga kiriting
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Kurslar, interaktiv testlar, sertifikatlar va gamifikatsiya — bir platformada.
          O&apos;quvchi, o&apos;qituvchi va administrator uchun moslashtirilgan tajriba.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-11 px-6 text-base" render={<Link href="/courses" />}>
            Kurslarni ko&apos;rish
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-6 text-base"
            render={<Link href="/register" />}
          >
            Bepul ro&apos;yxatdan o&apos;tish
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" />
            Tasdiqlangan sertifikatlar
          </span>
          <span className="flex items-center gap-1.5">
            <Gem className="size-4 text-gold" />
            Olmoslar bilan mukofotlash
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" />
            Har bir rol uchun moslashuvchan panel
          </span>
        </div>
      </Container>
    </div>
  );
}
