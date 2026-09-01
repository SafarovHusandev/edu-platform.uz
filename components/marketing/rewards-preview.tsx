import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Crown, Gift, PackageCheck, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Reward } from '@/types';

const PROCESS = [
  {
    icon: Clock,
    label: "So'ralgan",
    description: "O'quvchi olmosga sovg'a so'raydi",
    accent: 'primary' as const,
  },
  {
    icon: Check,
    label: 'Tasdiqlangan',
    description: "Administrator ko'rib chiqadi va tasdiqlaydi",
    accent: 'success' as const,
  },
  {
    icon: PackageCheck,
    label: 'Topshirilgan',
    description: "Sovg'a qo'lga topshiriladi",
    accent: 'gold' as const,
  },
];

const STEP_ACCENTS = {
  primary: 'bg-primary/10 text-primary ring-primary/20',
  success: 'bg-success/15 text-success ring-success/20',
  gold: 'bg-gold/15 text-gold-foreground ring-gold/25',
} as const;

export function RewardsPreview({ rewards }: { rewards: Reward[] }) {
  return (
    <div className="border-b border-border/60 py-20">
      <Container>
        <div className="flex flex-col items-end justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gold-foreground uppercase">
              Mukofotlar do&apos;koni
            </p>
            <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Olmoslaringizni haqiqiy sovg&apos;alarga almashtiring
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Bu — reklama emas. To&apos;plagan olmoslaringiz haqiqiy buyumlarga almashtiriladi.
            </p>
          </div>
          <Button
            variant="ghost"
            render={<Link href="/student/rewards" />}
            className="group shrink-0"
          >
            Barchasi{' '}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((reward) => {
            const image = resolveAssetUrl(reward.image);
            return (
              <div
                key={reward._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-linear-to-br from-gold/15 to-primary/10">
                  {image ? (
                    <Image
                      src={image}
                      alt={reward.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Gift className="size-10 text-gold transition-transform group-hover:scale-110" />
                  )}
                  {reward.premiumOnly && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-gold-foreground shadow-sm">
                      <Crown className="size-3" /> Premium
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-1 font-heading text-sm font-semibold">
                    {reward.title}
                  </h3>
                  <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-sm font-semibold text-gold-foreground">
                    <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" />
                    {formatNumber(reward.cost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-border/70 bg-muted/30 p-6 sm:p-8">
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            Har bir so&apos;rov shaffof, 3 bosqichli jarayondan o&apos;tadi
          </p>

          <div className="mt-7 flex items-center">
            {PROCESS.map((step, idx) => (
              <Fragment key={step.label}>
                <div className="flex flex-1 justify-center">
                  <span
                    className={cn(
                      'relative flex size-12 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-300 hover:scale-110',
                      STEP_ACCENTS[step.accent]
                    )}
                  >
                    <step.icon className="size-5" />
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background text-[16px] font-bold text-foreground ring-1 ring-border shadow-sm">
                      {idx + 1}
                    </span>
                  </span>
                </div>
                {idx < PROCESS.length - 1 && (
                  <div aria-hidden className="h-px w-8 shrink-0 bg-border sm:w-16" />
                )}
              </Fragment>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {PROCESS.map((step) => (
              <div key={step.label} className="px-1">
                <p className="text-xs font-semibold sm:text-sm">{step.label}</p>
                <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
