import Image from 'next/image';
import Link from 'next/link';
import { Flame, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';

const SEGMENTS = 8;
const WHEEL_GRADIENT = [
  'var(--color-primary) 0deg 45deg',
  'var(--color-gold) 45deg 90deg',
  '#10b981 90deg 135deg',
  '#f43f5e 135deg 180deg',
  'var(--color-primary) 180deg 225deg',
  'var(--color-gold) 225deg 270deg',
  '#10b981 270deg 315deg',
  '#f43f5e 315deg 360deg',
].join(', ');

export function DailySpinShowcase() {
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-slate-950 py-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
      />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-xs font-semibold tracking-widest text-gold uppercase">
            Kunlik barabon
          </p>
          <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Har kuni aylantiring, bepul olmos yutib oling
          </h2>
          <p className="mt-3 max-w-md text-balance text-white/70 lg:mx-0">
            Har kuni tizimga kirib g&apos;ildirakni aylantiring — ketma-ket necha kun
            aylantirganingizga qarab seriyangiz o&apos;sib boradi. Standart tarifda kuniga 1
            marta, Premiumda esa 3 martagacha aylantirish mumkin.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 ring-1 ring-white/15">
              <Flame className="size-4 text-orange-400" /> Kunma-kun seriya
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 ring-1 ring-white/15">
              <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" /> Har
              safar bepul olmos
            </span>
          </div>
          <Button
            size="lg"
            className="mt-7 h-11 bg-gold px-6 text-base text-gold-foreground shadow-lg shadow-gold/20 hover:bg-gold/90"
            render={<Link href="/register" />}
          >
            Bugun aylantiring
          </Button>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative size-64 sm:size-80">
            <div className="absolute inset-[-20px] rounded-full bg-linear-to-br from-primary/40 via-gold/30 to-transparent blur-2xl" />

            <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
              <div className="size-0 border-x-[12px] border-t-[22px] border-x-transparent border-t-white drop-shadow-lg" />
            </div>

            <div
              className="relative z-10 size-full animate-[spin_26s_linear_infinite] rounded-full shadow-2xl ring-[6px] ring-white/90"
              style={{ background: `conic-gradient(${WHEEL_GRADIENT})` }}
            >
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <div
                  key={`line-${i}`}
                  className="absolute left-1/2 top-1/2 h-1/2 w-px origin-top bg-white/40"
                  style={{ transform: `rotate(${(360 / SEGMENTS) * i}deg)` }}
                />
              ))}
              {Array.from({ length: SEGMENTS }).map((_, i) => {
                const angle = (360 / SEGMENTS) * i + 360 / SEGMENTS / 2;
                return (
                  <div
                    key={i}
                    className="absolute inset-0 flex items-start justify-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <Image
                      src="/diamond.png"
                      alt=""
                      width={32}
                      height={32}
                      className="mt-4 size-7 drop-shadow-md sm:mt-5 sm:size-8"
                    />
                  </div>
                );
              })}
            </div>

            <div className="absolute left-1/2 top-1/2 z-20 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-white/20 sm:size-24">
              <Sparkles className="size-8 text-primary sm:size-9" />
            </div>

            <div className="absolute -right-4 top-2 rounded-2xl bg-white px-3.5 py-2 text-center shadow-lg sm:-right-8">
              <p className="font-heading text-lg font-bold text-gold-foreground">+15</p>
              <p className="text-[10px] font-medium text-muted-foreground">bugungi yutuq</p>
            </div>
            <div className="absolute -bottom-3 -left-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-lg sm:-left-8">
              <Flame className="size-3.5 text-orange-500" />
              <span className="text-xs font-bold text-foreground">7 kunlik seriya</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
