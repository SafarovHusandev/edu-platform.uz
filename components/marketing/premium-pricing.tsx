import Image from 'next/image';
import Link from 'next/link';
import { Check, Crown, Minus, RotateCw, Lock, Repeat } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: 'diamond' as const,
    label: 'Har bir test/dars uchun olmos',
    standard: '1×',
    premium: '1.5×',
  },
  {
    icon: RotateCw,
    label: 'Kunlik barabon',
    standard: 'kuniga 1 marta',
    premium: 'kuniga 3 martagacha',
  },
  {
    icon: Lock,
    label: "Premium sovg'alar",
    standard: false,
    premium: true,
  },
  {
    icon: Repeat,
    label: "Testlarda qo'shimcha urinishlar",
    standard: false,
    premium: true,
  },
];

export function PremiumPricing() {
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-muted/20 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl"
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            <Crown className="size-3.5" /> Premium
          </span>
          <h2 className="mt-2.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Ko&apos;proq olmos, ko&apos;proq imkoniyat
          </h2>
          <p className="mt-3 text-muted-foreground">
            Premium tarif o&apos;yin iqtisodiyotini butunlay boshqa darajaga olib chiqadi.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs transition-shadow duration-300 hover:shadow-md sm:p-8">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Lock className="size-4.5" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold">Standart</h3>
            <p className="mt-1 text-sm text-muted-foreground">Bepul, boshlash uchun yetarli</p>
            <ul className="mt-6 space-y-3.5">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                      f.standard === false
                        ? 'bg-muted text-muted-foreground/50'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {f.standard === false ? (
                      <Minus className="size-3" />
                    ) : (
                      <Check className="size-3" />
                    )}
                  </span>
                  <span className={f.standard === false ? 'text-muted-foreground/60' : ''}>
                    {f.label}
                    {typeof f.standard === 'string' && (
                      <span className="text-muted-foreground"> — {f.standard}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-gold/50 bg-linear-to-b from-gold/10 to-transparent p-6 shadow-xl shadow-gold/10 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-gold/25 blur-3xl"
            />
            <span className="absolute top-6 right-6 flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-gold-foreground shadow-sm">
              <Crown className="size-3.5" /> Tavsiya etiladi
            </span>
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
              <Crown className="size-4.5" />
            </span>
            <h3 className="relative mt-4 flex items-center gap-1.5 font-heading text-lg font-semibold text-gold-foreground">
              Premium
            </h3>
            <p className="relative mt-1 text-sm text-muted-foreground">
              To&apos;liq o&apos;yin tajribasi
            </p>
            <ul className="relative mt-6 space-y-3.5">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm font-medium">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/20">
                    {f.icon === 'diamond' ? (
                      <Image src="/diamond.png" alt="" width={32} height={32} className="size-3" />
                    ) : (
                      <Check className="size-3 text-gold-foreground" />
                    )}
                  </span>
                  <span>
                    {f.label}
                    {typeof f.premium === 'string' && (
                      <span className="text-gold-foreground"> — {f.premium}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="relative mt-7 h-11 w-full bg-gold text-base text-gold-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-lg"
              render={<Link href="/premium" />}
            >
              <Crown className="size-4" /> Premiumga o&apos;ting
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
