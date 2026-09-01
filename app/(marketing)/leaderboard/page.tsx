'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trophy, Crown, LogIn, Medal, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLeaderboard } from '@/hooks/use-users';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api-client';
import type { User } from '@/types';

const PODIUM_STYLES = [
  {
    order: 'sm:order-2',
    ring: 'ring-amber-400 dark:ring-amber-400',
    badge: 'bg-linear-to-r from-amber-400 to-amber-500 text-slate-950 font-bold',
    card: 'sm:-translate-y-5 bg-linear-to-b from-amber-500/15 via-card to-card border-2 border-amber-400/50 shadow-2xl shadow-amber-500/20 card-hover-glow',
    avatarSize: 'size-20 sm:size-24',
    icon: Crown,
    rankNum: '1',
  },
  {
    order: 'sm:order-1',
    ring: 'ring-slate-300 dark:ring-slate-400',
    badge: 'bg-linear-to-r from-slate-300 to-slate-400 text-slate-900 font-bold',
    card: 'bg-linear-to-b from-slate-400/15 via-card to-card border border-slate-300 dark:border-slate-700 shadow-xl shadow-slate-500/10 card-hover-glow',
    avatarSize: 'size-16 sm:size-18',
    icon: Medal,
    rankNum: '2',
  },
  {
    order: 'sm:order-3',
    ring: 'ring-orange-400 dark:ring-orange-500',
    badge: 'bg-linear-to-r from-orange-400 to-orange-600 text-white font-bold',
    card: 'bg-linear-to-b from-orange-500/15 via-card to-card border border-orange-400/40 dark:border-orange-500/30 shadow-xl shadow-orange-500/10 card-hover-glow',
    avatarSize: 'size-16 sm:size-18',
    icon: Medal,
    rankNum: '3',
  },
];

function PodiumCard({ entry, rank }: { entry: User; rank: number }) {
  const style = PODIUM_STYLES[rank - 1];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2.5 rounded-3xl p-5 text-center transition-all duration-300',
        style.order,
        style.card
      )}
    >
      <div className="relative">
        <Avatar
          className={cn(
            style.avatarSize,
            'ring-4 ring-offset-2 ring-offset-background shadow-md',
            style.ring
          )}
        >
          <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
          <AvatarFallback className="text-xl font-bold">{initials(entry.name)}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute -bottom-2 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full shadow-lg',
            style.badge
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 w-full">
        <p className="line-clamp-1 text-sm sm:text-base font-extrabold text-foreground">{entry.name}</p>
        {entry.grade?.number && (
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {entry.grade.number}-{entry.grade.letter} sinf
          </p>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-extrabold text-amber-600 dark:text-amber-400 shadow-xs">
        <Image src="/diamond.png" alt="" width={32} height={32} className="size-4.5" />
        {formatNumber(entry.diamonds ?? 0)}
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [page] = useState(1);
  const { data, isLoading, error } = useLeaderboard(page, 20);

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const items = data?.items ?? [];
  const hasPodium = items.length >= 3;
  const podium = hasPodium ? items.slice(0, 3) : [];
  const rest = hasPodium ? items.slice(3) : items;

  return (
    <Container className="py-12 max-w-4xl">
      <div className="mx-auto mb-10 max-w-xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Sparkles className="size-3.5" />
          <span>Eng Faol O&apos;quvchilar</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Reyting Jadvali
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Darslar va testlarni muvaffaqiyatli topshirib eng ko&apos;p olmos to&apos;plagan peshqadamlar
        </p>
      </div>

      {isUnauthorized && !user ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-border/80 p-8 sm:p-12 text-center bg-card/60">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LogIn className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">Reytingni ko&apos;rish uchun tizimga kiring</p>
            <p className="text-xs text-muted-foreground">O&apos;z o&apos;rningizni bilish va raqobatda qatnashish uchun kiring</p>
          </div>
          <Button render={<Link href="/login?redirect=/leaderboard" />} className="rounded-xl px-6 font-bold shadow-md shadow-primary/20">
            Tizimga kirish
          </Button>
        </div>
      ) : isLoading ? (
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="mb-6 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          {hasPodium && (
            <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-4">
              {podium.map((entry, idx) => (
                <PodiumCard key={entry._id} entry={entry} rank={idx + 1} />
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {rest.map((entry, idx) => {
              const rank = idx + (hasPodium ? 4 : 1);
              const isMe = !!user && entry._id === user._id;
              return (
                <div
                  key={entry._id}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border p-4 shadow-xs transition-all duration-200 card-hover-glow',
                    isMe
                      ? 'border-primary/50 bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/20'
                      : 'border-border/80 bg-card hover:border-primary/30'
                  )}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center font-mono font-extrabold text-sm text-muted-foreground">
                    #{rank}
                  </div>
                  <Avatar className="size-10 border border-border">
                    <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
                    <AvatarFallback className="font-bold">{initials(entry.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-2 text-sm font-bold text-foreground truncate">
                      <span>{entry.name}</span>
                      {isMe && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                          Siz
                        </span>
                      )}
                    </p>
                    {entry.grade?.number && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.grade.number}-{entry.grade.letter} sinf
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                    <Image
                      src="/diamond.png"
                      alt=""
                      width={32}
                      height={32}
                      className="size-4.5"
                    />
                    {formatNumber(entry.diamonds ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
}

