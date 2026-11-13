'use client';

import { Suspense, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ClipboardList,
  Crown,
  Gift,
  GraduationCap,
  Inbox,
  Lock,
  PartyPopper,
  RotateCw,
  SearchX,
  Sparkles,
} from 'lucide-react';
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
import { DebouncedSearch } from '@/components/ui/debounced-search';
import { useUrlSearch } from '@/hooks/use-url-search';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useCountUp } from '@/hooks/use-count-up';
import { useMyRedemptions, useRewards, useRedeemReward } from '@/hooks/use-rewards';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Reward } from '@/types';

type Filter = 'all' | 'affordable' | 'premium';

function RewardImage({
  reward,
  locked,
  soldOut,
}: {
  reward: Reward;
  locked: boolean;
  soldOut: boolean;
}) {
  const image = resolveAssetUrl(reward.image);
  if (!image) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-[14px] bg-linear-to-br from-primary-soft to-muted">
        <Gift className="size-12 text-primary/50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
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
            'size-full object-contain transition-transform duration-500',
            soldOut && 'grayscale',
            locked || soldOut ? 'opacity-60' : 'group-hover:scale-110'
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

const CONFETTI_COLORS = ['#FFD45C', '#2B44D6', '#F59E0B', '#93C5FD', '#34D399', '#F9A8D4'];
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 37 + 5) % 97}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i * 97) % 600,
  round: i % 3 === 0,
}));

const HERO_SPARKLES = [
  { className: 'top-5 left-[46%] size-4', delay: 0 },
  { className: 'bottom-6 left-[38%] size-3', delay: 900 },
  { className: 'top-8 right-[8%] size-5', delay: 400 },
  { className: 'bottom-10 right-[30%] size-3', delay: 1500 },
];

// Olmos qayerdan keladi: darslar, testlar va kunlik baraban
const EARN_WAYS = [
  { title: "Dars o'qish", hint: 'Darsni tugating', href: '/student/courses', icon: GraduationCap },
  {
    title: 'Test ishlash',
    hint: 'Testlarni yeching',
    href: '/student/quizzes',
    icon: ClipboardList,
  },
  {
    title: 'Kunlik baraban',
    hint: 'Har kuni aylantiring',
    href: '/student/daily-spin',
    icon: RotateCw,
  },
];

function delay(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

function Balance({ value }: { value: number }) {
  const current = useCountUp(value, 1200, 200);
  return <>{formatNumber(Math.round(current * 10) / 10)}</>;
}

// O'quvchi balansi, keyingi maqsad va tezkor havolalar
function RewardsHero({
  diamonds,
  nextReward,
  affordableCount,
}: {
  diamonds: number;
  nextReward: Reward | undefined;
  affordableCount: number;
}) {
  return (
    <section className="lb-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-[oklch(0.33_0.19_268)] p-6 text-primary-foreground shadow-xl shadow-primary/25 sm:p-8">
      <span
        aria-hidden
        className="animate-pulse-slow absolute -top-20 -right-10 size-72 rounded-full bg-gold/30 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-24 -left-16 size-64 rounded-full bg-white/10 blur-3xl"
      />
      {HERO_SPARKLES.map((s) => (
        <Sparkles
          key={s.className}
          aria-hidden
          className={cn('lb-twinkle absolute text-white/70', s.className)}
          style={delay(s.delay)}
        />
      ))}
      <div aria-hidden className="absolute top-1/2 right-6 hidden -translate-y-1/2 sm:block">
        <div className="relative size-15 lg:size-24">
          <span className="animate-pulse-slow absolute inset-4 rounded-full bg-gold/40 blur-2xl" />
          <span className="animate-float relative flex size-full items-center justify-center rounded-[36px] bg-white/10 backdrop-blur-sm">
            <Gift className="size-10 text-gold drop-shadow-[0_4px_16px_var(--gold)] lg:size-12" />
          </span>
          <DiamondIcon className="lb-twinkle absolute -top-3 -left-4 size-9" />
          <DiamondIcon className="lb-twinkle absolute -right-3 -bottom-2 size-7" />
        </div>
      </div>

      <div className="relative flex max-w-xl flex-col gap-5">
        <div>
          <p className="text-base text-primary-foreground/75">Sizning balansingiz</p>
          <p className="mt-1 flex items-center gap-2.5 font-heading text-4xl font-bold sm:text-5xl">
            <DiamondIcon className="size-10 sm:size-12" />
            <Balance value={diamonds} />
          </p>
        </div>
      </div>
    </section>
  );
}

function RedeemSuccessDialog({ reward, onClose }: { reward: Reward | null; onClose: () => void }) {
  return (
    <Dialog open={!!reward} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden rounded-3xl p-6 sm:max-w-sm">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className={cn(
                'lb-confetti absolute -top-3 h-3 w-1.5',
                c.round && 'size-2 rounded-full'
              )}
              style={{ left: c.left, backgroundColor: c.color, ...delay(c.delay) }}
            />
          ))}
        </div>
        <DialogTitle className="text-center font-heading text-2xl">
          So&apos;rov yuborildi! 🎉
        </DialogTitle>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="relative flex size-28 items-center justify-center">
            <span
              aria-hidden
              className="lb-spin absolute -inset-10 rounded-full bg-[repeating-conic-gradient(var(--gold)_0deg_8deg,transparent_8deg_30deg)] opacity-30 mask-[radial-gradient(circle,black_30%,transparent_70%)]"
              style={{ animationDuration: '14s' }}
            />
            <span className="lb-pop relative flex size-24 items-center justify-center rounded-3xl bg-linear-to-b from-primary-soft to-[#DCE3FF] shadow-lg shadow-primary/20">
              <Gift className="animate-float size-12 text-primary" />
            </span>
          </span>
          <p className="text-lg font-bold">{reward?.title}</p>
          <p className="text-[15px] text-muted-foreground">
            Admin tasdiqlagach mukofot maktabda topshiriladi. Holatini &quot;So&apos;rovlarim&quot;
            bo&apos;limida kuzatib boring.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
            Yopish
          </Button>
          <Button
            size="lg"
            className="flex-1"
            render={<Link href="/student/rewards/redemptions" />}
          >
            So&apos;rovlarim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RewardCard({
  reward,
  index,
  isStudent,
  isPremium,
  diamonds,
  onRedeem,
}: {
  reward: Reward;
  index: number;
  isStudent: boolean;
  isPremium: boolean;
  diamonds: number;
  onRedeem: (reward: Reward) => void;
}) {
  const inStock = reward.stock === null || reward.stock > 0;
  const locked = !!reward.premiumOnly && !isPremium;
  const canAfford = diamonds >= reward.cost && inStock && !locked;
  const missing = Math.max(reward.cost - diamonds, 0);
  const showProgress = isStudent && inStock && !locked && !canAfford;
  const lowStock = reward.stock !== null && reward.stock > 0 && reward.stock <= 3;
  const enterMs = Math.min(index * 60, 700);

  return (
    // Tashqi blok — kirish animatsiyasi, ichki — hover (animatsiya transform'ni band qiladi)
    <div className="lb-fade-up" style={delay(enterMs)}>
      <article
        className={cn(
          'group flex h-full flex-col gap-2.5 rounded-[20px] border bg-card p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-3.5',
          isStudent && canAfford
            ? 'border-success/40 hover:shadow-success/15'
            : reward.premiumOnly
              ? 'border-gold/50 hover:shadow-gold/20'
              : 'border-border hover:shadow-primary/10'
        )}
      >
        <div className="relative">
          <RewardImage reward={reward} locked={locked} soldOut={!inStock} />
          {locked && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[14px] bg-admin/30 backdrop-blur-[2px]">
              <span className="flex size-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
                <Lock className="size-5 text-admin" />
              </span>
            </span>
          )}
          {!inStock && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="-rotate-12 rounded-lg bg-destructive px-4 py-1.5 font-heading text-sm font-bold tracking-wider text-white uppercase shadow-lg">
                Tugagan
              </span>
            </span>
          )}
          {reward.premiumOnly && (
            <span className="lb-shine absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-gold to-[#F59E0B] px-2.5 py-1 text-xs font-bold text-admin shadow-md shadow-gold/30">
              <Crown className="size-3.5" /> Premium
            </span>
          )}
          {isStudent && canAfford && (
            <span
              className="lb-pop absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white shadow-md"
              style={delay(enterMs + 300)}
            >
              <Check className="size-3.5" /> Olsa bo&apos;ladi
            </span>
          )}
        </div>

        <h2 className="line-clamp-2 text-base font-bold sm:text-[17px]">{reward.title}</h2>
        {reward.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{reward.description}</p>
        )}
        <span
          className={cn(
            'text-sm',
            !inStock
              ? 'font-semibold text-destructive'
              : lowStock
                ? 'font-semibold text-[#B45309] dark:text-gold'
                : 'text-muted-foreground'
          )}
        >
          {reward.stock === null
            ? 'Cheksiz'
            : !inStock
              ? 'Tugagan'
              : lowStock
                ? `🔥 Faqat ${reward.stock} ta qoldi`
                : `Qoldi: ${reward.stock} ta`}
        </span>

        {showProgress && (
          <div className="flex flex-col gap-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="lb-bar h-full rounded-full bg-linear-to-r from-primary/70 to-primary"
                style={{
                  width: `${Math.max(Math.min(diamonds / reward.cost, 1) * 100, 4)}%`,
                  ...delay(enterMs + 300),
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Yana {formatNumber(Math.ceil(missing))} olmos kerak
            </span>
          </div>
        )}

        {!isStudent ? (
          <span className="mt-auto flex items-center gap-1.5 font-heading text-lg font-semibold text-gold-foreground">
            <DiamondIcon className="size-5" /> {formatNumber(reward.cost)}
          </span>
        ) : locked ? (
          <Button
            variant="outline"
            className="mt-auto h-11 w-full border-gold/60 text-[15px] hover:bg-gold-soft"
            render={<Link href="/premium" />}
          >
            <Crown className="size-4 text-gold" /> Premium oling
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  className={cn('mt-auto h-11 w-full text-[15px]', canAfford && 'lb-shine')}
                  variant={canAfford ? 'default' : 'secondary'}
                  disabled={!canAfford}
                />
              }
            >
              <DiamondIcon className="size-4.5" /> {formatNumber(reward.cost)}
              <span className="hidden sm:inline"> · Almashtirish</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mukofotga almashtirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{reward.title}&quot; uchun {formatNumber(reward.cost)} ta olmos yechiladi.
                  Balansingizda {formatNumber(diamonds - reward.cost)} ta qoladi. So&apos;rov admin
                  tasdiqlagach mukofot maktabda topshiriladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRedeem(reward)}>Tasdiqlash</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </article>
    </div>
  );
}

function StudentRewardsPageContent() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'student';
  const isPremium = user?.tarif === 'premium';
  const diamonds = user?.diamonds ?? 0;
  // Katalog bitta sahifada (limit 50) — shuning uchun qidiruvda sahifani qaytarish shart emas
  const [search, setSearch] = useUrlSearch();
  const { data, isLoading, isError, refetch } = useRewards({
    page: 1,
    limit: 50,
    search: search || undefined,
  });
  const { data: redemptions } = useMyRedemptions(1, 50);
  const redeem = useRedeemReward();
  const [filter, setFilter] = useState<Filter>('all');
  const [redeemed, setRedeemed] = useState<Reward | null>(null);

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
  const available = all.filter(isAvailable);
  const affordableCount = available.filter((r) => r.cost <= diamonds).length;
  // Eng yaqin maqsad: olmosi hali yetmaydigan eng arzon mukofot
  const nextReward = available.filter((r) => r.cost > diamonds).sort((a, b) => a.cost - b.cost)[0];

  function handleRedeem(reward: Reward) {
    redeem.mutate(reward._id, { onSuccess: () => setRedeemed(reward) });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Mukofotlar"
        description={isStudent ? undefined : "O'quvchilar uchun sovg'alar katalogi"}
        actions={
          isStudent && (
            <Button variant="outline" render={<Link href="/student/rewards/redemptions" />}>
              <Inbox className="size-4" /> So&apos;rovlarim
              {openRequests > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] leading-5 font-bold text-primary-foreground">
                  {openRequests}
                </span>
              )}
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-5">
          {isStudent && <div className="h-56 animate-pulse rounded-3xl bg-muted" />}
          <div className="grid gap-[18px] sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-[20px] bg-muted" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-5">
          {isStudent && (
            <RewardsHero
              diamonds={diamonds}
              nextReward={nextReward}
              affordableCount={affordableCount}
            />
          )}

          {all.length === 0 && !search ? (
            <EmptyState icon={Gift} title="Hozircha mukofotlar mavjud emas" />
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="font-heading text-lg font-bold">Sovg&apos;alar katalogi</h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  <DebouncedSearch
                    initial={search}
                    onSearch={setSearch}
                    delay={400}
                    placeholder="Sovg'a nomi bo'yicha qidirish..."
                    label="Sovg'a qidirish"
                    className="w-full sm:w-72"
                    inputClassName="h-11 rounded-xl"
                  />
                </div>
              </div>

              {all.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Hech narsa topilmadi"
                  description={`"${search}" bo'yicha sovg'a topilmadi. Boshqa so'z bilan qidirib ko'ring.`}
                  action={
                    <Button variant="outline" onClick={() => setSearch('')}>
                      Qidiruvni tozalash
                    </Button>
                  }
                />
              ) : items.length === 0 ? (
                <EmptyState
                  icon={Gift}
                  title={
                    filter === 'affordable'
                      ? "Hozircha olmosingiz yetadigan mukofot yo'q"
                      : "Premium mukofotlar yo'q"
                  }
                />
              ) : (
                // key: filtr almashganda kartalar qaytadan animatsiya bilan chiqadi
                <div
                  key={`${filter}:${search}`}
                  className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:gap-[18px]"
                >
                  {items.map((reward, index) => (
                    <RewardCard
                      key={reward._id}
                      reward={reward}
                      index={index}
                      isStudent={isStudent}
                      isPremium={isPremium}
                      diamonds={diamonds}
                      onRedeem={handleRedeem}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <RedeemSuccessDialog reward={redeemed} onClose={() => setRedeemed(null)} />
    </div>
  );
}

export default function StudentRewardsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
      <StudentRewardsPageContent />
    </Suspense>
  );
}
