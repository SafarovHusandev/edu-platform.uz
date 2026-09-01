'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Crown, Gift, Lock, PackageCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
import { useRewards, useRedeemReward } from '@/hooks/use-rewards';
import { useAuthStore } from '@/store/auth-store';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function StudentRewardsPage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'student';
  const { data, isLoading, isError, refetch } = useRewards({ page: 1, limit: 24 });
  const redeem = useRedeemReward();
  const diamonds = user?.diamonds ?? 0;
  const isPremium = user?.tarif === 'premium';

  return (
    <div>
      <PageHeader
        title="Mukofotlar"
        description={
          isStudent
            ? "Olmoslaringizni sovg'alarga almashtiring"
            : "O'quvchilar uchun sovg'alar katalogi"
        }
        actions={
          isStudent ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-2 text-sm font-semibold text-gold-foreground shadow-sm">
                <Image src="/diamond.png" alt="" width={32} height={32} className="size-4.5" />
                {formatNumber(diamonds)}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md"
                render={<Link href="/student/rewards/redemptions" />}
              >
                <PackageCheck className="size-4" /> Mening yutuqlarim
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={6} itemClassName="h-64 rounded-md" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Gift} title="Hozircha mukofotlar mavjud emas" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ">
          {data.items.map((reward) => {
            const image = resolveAssetUrl(reward.image);
            const inStock = reward.stock === null || reward.stock > 0;
            const isLocked = !!reward.premiumOnly && !isPremium;
            const canAfford = diamonds >= reward.cost && inStock && !isLocked;
            return (
              <Card
                key={reward._id}
                className="gap-0 overflow-hidden rounded-md py-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="group relative aspect-video w-full overflow-hidden bg-muted">
                  {image ? (
                    <Image
                      src={image}
                      alt={reward.title}
                      fill
                      unoptimized
                      className={cn(
                        'object-cover transition-transform duration-300',
                        isLocked ? '' : 'group-hover:scale-105'
                      )}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-linear-to-br from-gold/20 to-primary/10">
                      <Gift className="size-9 text-gold" />
                    </div>
                  )}

                  {reward.premiumOnly && (
                    <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground shadow-sm">
                      <Crown className="size-3.5" /> Faqat Premium
                    </span>
                  )}
                </div>
                <CardContent className="flex flex-col gap-2.5 p-4">
                  <h3 className="line-clamp-1 text-base font-semibold">{reward.title}</h3>
                  {reward.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {reward.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-sm font-semibold text-gold-foreground">
                      <Image src="/diamond.png" alt="" width={32} height={32} className="size-4" />
                      {formatNumber(reward.cost)}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        reward.stock === 0 ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {reward.stock === null
                        ? 'Cheksiz'
                        : reward.stock > 0
                          ? `${reward.stock} dona qoldi`
                          : 'Tugagan'}
                    </span>
                  </div>
                  {isStudent && isLocked ? (
                    <Button
                      className="mt-1 w-full rounded-md"
                      variant="outline"
                      render={<Link href="/premium" />}
                    >
                      <Lock className="size-4" /> Premium oling
                    </Button>
                  ) : (
                    isStudent && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              className="mt-1 w-full rounded-md cursor-pointer"
                              disabled={!canAfford}
                            />
                          }
                        >
                          Almashtirish
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mukofotga almashtirasizmi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{reward.title}&quot; uchun {formatNumber(reward.cost)} ta olmos
                              yechiladi. Bu amalni bekor qilib bo&apos;lmaydi.
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
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
