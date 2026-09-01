import Image from 'next/image';
import Link from 'next/link';
import { Check, Crown, Minus, RotateCw, Lock, Repeat } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';

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
    <div className="border-b border-border/60 bg-muted/20 py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-widest text-gold-foreground uppercase">
            Premium
          </p>
          <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Ko&apos;proq olmos, ko&apos;proq imkoniyat
          </h2>
          <p className="mt-3 text-muted-foreground">
            Premium tarif o&apos;yin iqtisodiyotini butunlay boshqa darajaga olib chiqadi.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
            <h3 className="font-heading text-lg font-semibold">Standart</h3>
            <p className="mt-1 text-sm text-muted-foreground">Bepul, boshlash uchun yetarli</p>
            <ul className="mt-6 space-y-3.5">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm">
                  {f.standard === false ? (
                    <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                  ) : (
                    <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
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

          <div className="relative overflow-hidden rounded-2xl border-2 border-gold/50 bg-linear-to-b from-gold/10 to-transparent p-6 shadow-lg sm:p-8">
            <span className="absolute right-6 top-6 flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-gold-foreground">
              <Crown className="size-3.5" /> Tavsiya etiladi
            </span>
            <h3 className="flex items-center gap-1.5 font-heading text-lg font-semibold text-gold-foreground">
              Premium
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">To&apos;liq o&apos;yin tajribasi</p>
            <ul className="mt-6 space-y-3.5">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm font-medium">
                  {f.icon === 'diamond' ? (
                    <Image
                      src="/diamond.png"
                      alt=""
                      width={32}
                      height={32}
                      className="mt-0.5 size-4 shrink-0"
                    />
                  ) : (
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
                  )}
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
              className="mt-7 h-11 w-full bg-gold text-base text-gold-foreground shadow-md hover:bg-gold/90"
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
