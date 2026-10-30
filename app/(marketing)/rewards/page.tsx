'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useRewards } from '@/hooks/use-rewards';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'cheap' | 'premium';

const STEPS = ['Tanlang', 'Admin tasdiqlaydi', "Qo'lingizga topshiriladi"];

// Ochiq mukofotlar katalogi (edu-platform-dizayn: RewardsCatalog)
export default function PublicRewardsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useRewards({ page: 1, limit: 60 });
  const [filter, setFilter] = useState<Filter>('all');

  const all = data?.items ?? [];
  const items =
    filter === 'premium'
      ? all.filter((r) => r.premiumOnly)
      : filter === 'cheap'
        ? [...all].sort((a, b) => a.cost - b.cost)
        : all;

  const cta =
    user?.role === 'student'
      ? { href: '/student/rewards', label: 'Almashtirish' }
      : user
        ? null
        : { href: '/login?redirect=/student/rewards', label: 'Almashtirish uchun kiring' };

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-300 flex-wrap items-center gap-8 px-4 py-12 sm:px-6">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-3.5">
            <h1 className="font-heading text-3xl leading-tight font-bold sm:text-[38px]">
              Olmoslarni sovg&apos;aga almashtiring
            </h1>
            <p className="text-[17px] leading-relaxed text-primary-foreground/80">
              Testlar, darslar va kunlik barabondan olmos to&apos;plang. So&apos;rovni admin
              tasdiqlaydi va mukofot sizga topshiriladi.
            </p>
          </div>
          <ol className="grid flex-[1_1_340px] grid-cols-3 gap-2.5">
            {STEPS.map((step, i) => (
              <li key={step} className="rounded-2xl bg-white/12 p-4">
                <div className="font-heading text-xl font-bold text-gold">{i + 1}</div>
                <div className="mt-1.5 text-sm">{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto flex max-w-300 flex-col gap-5 px-4 pt-8 pb-16 sm:px-6">
        <FilterPills
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Barchasi' },
            { value: 'cheap', label: 'Arzonroq' },
            { value: 'premium', label: 'Faqat Premium' },
          ]}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-[20px] bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={filter === 'premium' ? "Premium mukofotlar yo'q" : "Hozircha mukofotlar yo'q"}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:gap-[18px]">
            {items.map((reward) => {
              const image = resolveAssetUrl(reward.image);
              const inStock = reward.stock === null || reward.stock > 0;
              return (
                <article
                  key={reward._id}
                  className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-3 sm:p-3.5"
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-[14px] bg-muted">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={reward.title}
                        className={cn('size-full object-contain', !inStock && 'opacity-50')}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Gift className="size-10 text-muted-foreground" />
                      </div>
                    )}
                    {reward.premiumOnly && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-admin">
                        <Crown className="size-3.5" /> Premium
                      </span>
                    )}
                  </div>
                  <h2 className="line-clamp-2 text-[17px] font-bold">{reward.title}</h2>
                  {reward.description && (
                    <p className="line-clamp-2 text-sm leading-normal text-muted-foreground">
                      {reward.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 font-heading font-bold text-gold-foreground">
                      <DiamondIcon className="size-4" /> {formatNumber(reward.cost)}
                    </span>
                    <span
                      className={cn(
                        'text-[13px]',
                        inStock ? 'text-muted-foreground' : 'font-semibold text-destructive'
                      )}
                    >
                      {reward.stock === null
                        ? 'Cheksiz'
                        : inStock
                          ? `Qoldi: ${reward.stock}`
                          : 'Tugagan'}
                    </span>
                  </div>
                  {cta && (
                    <Button
                      variant={user ? 'default' : 'outline'}
                      className="h-11 w-full"
                      render={<Link href={cta.href} />}
                    >
                      {cta.label}
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
