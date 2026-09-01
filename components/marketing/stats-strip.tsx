import { BookOpen, FolderOpen, Gift, GraduationCap } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { formatNumber } from '@/lib/format';

export interface StatsStripData {
  courses: number;
  categories: number;
  books: number;
  rewards: number;
}

export function StatsStrip({ stats }: { stats: StatsStripData }) {
  const STATS = [
    { icon: GraduationCap, value: stats.courses, label: 'kurs' },
    { icon: BookOpen, value: stats.books, label: 'bepul kitob' },
    { icon: FolderOpen, value: stats.categories, label: 'kategoriya' },
    { icon: Gift, value: stats.rewards, label: "mukofot turi" },
  ];

  return (
    <div className="border-b border-border/60 bg-background py-10">
      <Container>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:hidden">
                <stat.icon className="size-4.5" />
              </span>
              <div>
                <p className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                  {formatNumber(stat.value)}+
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
