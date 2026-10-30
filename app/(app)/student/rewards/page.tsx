'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Gift, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useMyRedemptions, useRewards, useRedeemReward } from '@/hooks/use-rewards';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Reward } from '@/types';

type Filter = 'all' | 'affordable' | 'premium';

function RewardImage({ reward, locked }: { reward: Reward; locked: boolean }) {
  const image = resolveAssetUrl(reward.image);
  if (!image) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-[14px] bg-muted">
        <Gift className="size-10 text-muted-foreground" />
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`${reward.title} rasmini kattalashtirish`}
            className="group relative block aspect-4/3 cursor-zoom-in overflow-hidden rounded-[14px] bg-muted"
          />
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={reward.title}
          className={cn(
            'size-full object-contain transition-transform duration-300',
            locked ? 'opacity-60' : 'group-hover:scale-105'
          )}
        />
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 sm:max-w-lg" showCloseButton>
        <DialogTitle className="sr-only">{reward.title}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={reward.title}
          className="max-h-[80vh] w-full rounded-xl object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}

export default function StudentRewardsPage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'student';
  const isPremium = user?.tarif === 'premium';
  const diamonds = user?.diamonds ?? 0;
  const { data, isLoading, isError, refetch } = useRewards({ page: 1, limit: 50 });
  const { data: redemptions } = useMyRedemptions(1, 50);
  const redeem = useRedeemReward();
  const [filter, setFilter] = useState<Filter>('all');

  const openRequests =
    redemptions?.items.filter((r) => r.status === 'pending' || r.status === 'approved').length ?? 0;

  const all = data?.items ?? [];
  const isAvailable = (reward: Reward) =>
    (reward.stock === null || reward.stock > 0) && (!reward.premiumOnly || isPremium);
  const items = all.filter((reward) => {
    if (filter === 'affordable') return isAvailable(reward) && reward.cost <= diamonds;
    if (filter === 'premium') return !!reward.premiumOnly;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Mukofotlar"
        description={isStudent ? undefined : "O'quvchilar uchun sovg'alar katalogi"}
        actions={
          isStudent && (
            <>
              <span className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 font-heading font-semibold text-primary-foreground">
                <DiamondIcon className="size-4.5" /> {formatNumber(diamonds)}
              </span>
              <Button variant="outline" render={<Link href="/student/rewards/redemptions" />}>
                So&apos;rovlarim{openRequests > 0 ? ` · ${openRequests}` : ''}
              </Button>
            </>
          )
        }
      />

      {isLoading ? (
        <div className="grid gap-[18px] sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-[20px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : all.length === 0 ? (
        <EmptyState icon={Gift} title="Hozircha mukofotlar mavjud emas" />
      ) : (
        <div className="flex flex-col gap-4">
          {isStudent && (
            <FilterPills
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Barchasi' },
                { value: 'affordable', label: "Olsa bo'ladi" },
                { value: 'premium', label: 'Premium' },
              ]}
            />
          )}

          {items.length === 0 ? (
            <EmptyState
              icon={Gift}
              title={
                filter === 'affordable'
                  ? "Hozircha olmosingiz yetadigan mukofot yo'q"
                  : "Premium mukofotlar yo'q"
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:gap-[18px]">
              {items.map((reward) => {
                const inStock = reward.stock === null || reward.stock > 0;
                const locked = !!reward.premiumOnly && !isPremium;
                const canAfford = diamonds >= reward.cost && inStock && !locked;
                return (
                  <article
                    key={reward._id}
                    className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-3 sm:p-3.5"
                  >
                    <div className="relative">
                      <RewardImage reward={reward} locked={locked} />
                      {reward.premiumOnly && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-admin">
                          <Crown className="size-3.5" /> Premium
                        </span>
                      )}
                    </div>
                    <h2 className="line-clamp-2 text-base font-bold">{reward.title}</h2>
                    {reward.description && (
                      <p className="line-clamp-2 text-[13px] text-muted-foreground">
                        {reward.description}
                      </p>
                    )}
                    <span
                      className={cn(
                        'text-[13px]',
                        inStock ? 'text-muted-foreground' : 'font-semibold text-destructive'
                      )}
                    >
                      {reward.stock === null
                        ? 'Cheksiz'
                        : inStock
                          ? `Qoldi: ${reward.stock} ta`
                          : 'Tugagan'}
                    </span>

                    {!isStudent ? (
                      <span className="mt-auto flex items-center gap-1.5 font-heading font-semibold text-gold-foreground">
                        <DiamondIcon className="size-4" /> {formatNumber(reward.cost)}
                      </span>
                    ) : locked ? (
                      <Button
                        variant="outline"
                        className="mt-auto h-11 w-full"
                        render={<Link href="/premium" />}
                      >
                        <Lock className="size-4" /> Premium oling
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              className="mt-auto h-11 w-full"
                              variant={canAfford ? 'default' : 'secondary'}
                              disabled={!canAfford}
                            />
                          }
                        >
                          <DiamondIcon className="size-4" /> {formatNumber(reward.cost)}
                          <span className="hidden sm:inline"> · Almashtirish</span>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mukofotga almashtirasizmi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{reward.title}&quot; uchun {formatNumber(reward.cost)} ta olmos
                              yechiladi. Balansingizda {formatNumber(diamonds - reward.cost)} ta
                              qoladi. So&apos;rov admin tasdiqlagach mukofot maktabda topshiriladi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction onClick={() => redeem.mutate(reward._id)}>
                              Tasdiqlash
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
