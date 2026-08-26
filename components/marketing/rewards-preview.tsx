import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Gift, PackageCheck } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';

const REWARDS = [
  { title: 'Simsiz quloqchin', cost: 1200 },
  { title: "Kitoblar to'plami", cost: 450 },
  { title: 'Fitnes-brend futbolka', cost: 800 },
  { title: 'Powerbank', cost: 950 },
];

const PROCESS = [
  { icon: Clock, label: "So'ralgan", description: "O'quvchi olmosga sovg'a so'raydi" },
  { icon: Check, label: 'Tasdiqlangan', description: "Administrator ko'rib chiqadi" },
  { icon: PackageCheck, label: 'Yetkazilgan', description: "Sovg'a qo'lga topshiriladi" },
];

export function RewardsPreview() {
  return (
    <div className="border-b border-border/60 py-20">
      <Container>
        <div className="flex flex-col items-end justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gold-foreground uppercase">
              Mukofotlar do&apos;koni
            </p>
            <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Olmoslaringizni haqiqiy sovg&apos;alarga yeching
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Bu — reklama emas. To&apos;plagan olmoslaringiz haqiqiy buyumlarga almashtiriladi.
            </p>
          </div>
          <Button variant="ghost" render={<Link href="/student/rewards" />} className="group shrink-0">
            Barchasi{' '}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REWARDS.map((reward) => (
            <div
              key={reward.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex aspect-square w-full items-center justify-center bg-linear-to-br from-gold/15 to-primary/10">
                <Gift className="size-10 text-gold transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-heading text-sm font-semibold">{reward.title}</h3>
                <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-sm font-semibold text-gold-foreground">
                  <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" />
                  {reward.cost}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border/70 bg-muted/30 p-6 sm:p-8">
          <p className="text-center text-sm font-semibold text-muted-foreground">
            Har bir so&apos;rov shaffof, 3 bosqichli jarayondan o&apos;tadi
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PROCESS.map((step, idx) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-sm font-bold text-gold-foreground shadow-sm ring-1 ring-border">
                  {idx + 1}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <step.icon className="size-4 text-muted-foreground" />
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
