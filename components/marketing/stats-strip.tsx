'use client';

import CountUp from 'react-countup';
import { BookOpen, FolderOpen, Gift, GraduationCap } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface StatsStripData {
  courses: number;
  categories: number;
  books: number;
  rewards: number;
}

const ACCENTS = {
  primary: 'bg-primary/10 text-primary ring-primary/15 group-hover:bg-primary/15',
  gold: 'bg-gold/15 text-gold-foreground ring-gold/20 group-hover:bg-gold/20',
  success: 'bg-success/15 text-success ring-success/20 group-hover:bg-success/20',
  accent: 'bg-accent text-accent-foreground ring-border group-hover:bg-accent/80',
} as const;

export function StatsStrip({ stats }: { stats: StatsStripData }) {
  const STATS = [
    { icon: GraduationCap, value: stats.courses, label: 'kurslar', accent: 'primary' as const },
    { icon: BookOpen, value: stats.books, label: 'bepul kitoblar', accent: 'gold' as const },
    {
      icon: FolderOpen,
      value: stats.categories,
      label: 'kategoriyalar',
      accent: 'success' as const,
    },
    { icon: Gift, value: stats.rewards, label: 'mukofot turi', accent: 'accent' as const },
  ];

  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-muted/20 py-14">
      <div
        aria-hidden
        className="bg-grid-pattern pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <Container className="relative">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="group flex  items-center gap-4 rounded-2xl border border-border/70 bg-card px-4 py-6 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:px-5"
            >
              <span
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors duration-300 sm:size-13',
                  ACCENTS[stat.accent]
                )}
              >
                <stat.icon className="size-5.5 sm:size-6" />
              </span>
              <div className="flex flex-col items-start">
                <p className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <CountUp
                    end={stat.value}
                    duration={2.2}
                    formattingFn={formatNumber}
                    autoAnimate
                    autoAnimateOnce
                  />
                  <span className="text-primary">+</span>
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
