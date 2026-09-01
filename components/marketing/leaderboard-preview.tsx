import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Crown, Medal, Trophy } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import type { User } from '@/types';

export function LeaderboardPreview({ students }: { students: User[] }) {
  return (
    <div className="border-b border-border/60 bg-muted/20 py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Reyting</p>
          <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Eng ko&apos;p olmos to&apos;plaganlar
          </h2>
          <p className="mt-3 text-muted-foreground">
            Faol o&apos;quvchilar orasida raqobatlashing va yuqori o&apos;rinlarni egallang.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl space-y-2.5">
          {students.map((entry, idx) => {
            const rank = idx + 1;
            const Icon = rank === 1 ? Crown : Medal;
            return (
              <div
                key={entry._id}
                className="flex items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-xs"
              >
                <span
                  className={
                    rank === 1
                      ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-foreground'
                      : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                  }
                >
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.name}</p>
                  {entry.grade?.number && (
                    <p className="text-xs text-muted-foreground">
                      {entry.grade.number}
                      {entry.grade.letter ? `-${entry.grade.letter}` : ''} sinf
                    </p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-gold-foreground">
                  <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" />
                  {formatNumber(entry.diamonds ?? 0)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="outline" render={<Link href="/leaderboard" />} className="group">
            <Trophy className="size-4" />
            To&apos;liq reytingni ko&apos;rish
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </Container>
    </div>
  );
}
