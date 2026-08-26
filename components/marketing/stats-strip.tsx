import Image from 'next/image';
import { GraduationCap, Presentation, BookOpen } from 'lucide-react';
import { Container } from '@/components/layout/container';

const STATS = [
  { icon: GraduationCap, value: "12 000+", label: "faol o'quvchi" },
  { icon: BookOpen, value: '350+', label: 'kurs va test' },
  { icon: Presentation, value: '200+', label: "tasdiqlangan o'qituvchi" },
  { icon: 'diamond' as const, value: '2.4 mln+', label: 'olmos yutib olingan' },
];

export function StatsStrip() {
  return (
    <div className="border-b border-border/60 bg-background py-10">
      <Container>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:hidden">
                {stat.icon === 'diamond' ? (
                  <Image src="/diamond.png" alt="" width={32} height={32} className="size-4.5" />
                ) : (
                  <stat.icon className="size-4.5" />
                )}
              </span>
              <div>
                <p className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                  {stat.value}
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
