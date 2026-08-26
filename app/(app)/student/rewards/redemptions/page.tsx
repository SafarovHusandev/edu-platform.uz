'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Gift, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { useMyRedemptions } from '@/hooks/use-rewards';
import { formatDate } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { RedemptionStatus } from '@/types';

const STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlandi',
  delivered: 'Topshirildi',
  rejected: 'Rad etildi',
};

const STATUS_STYLES: Record<RedemptionStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  approved: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  delivered: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function MyRedemptionsPage() {
  const { data, isLoading, isError, refetch } = useMyRedemptions(1, 24);

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/student/rewards" />}>Mukofotlar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mening yutuqlarim</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">Mening yutuqlarim</h1>
      <p className="mt-1 text-muted-foreground">Almashtirilgan mukofotlar tarixi</p>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonList count={4} itemClassName="h-20 rounded-md" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={PackageCheck} title="Hali mukofotga almashtirmagansiz" />
        ) : (
          <div className="space-y-3">
            {data.items.map((redemption) => {
              const reward = typeof redemption.reward === 'object' ? redemption.reward : null;
              const image = resolveAssetUrl(reward?.image);
              const note =
                redemption.deliveryNote || redemption.rejectReason || redemption.adminNote;

              return (
                <Card key={redemption._id} className="rounded-md shadow-sm ring-1 ring-border/60">
                  <CardContent className="flex items-center gap-3.5 pt-2">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={reward?.title ?? 'Mukofot'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Gift className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{reward?.title ?? 'Mukofot'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(redemption.createdAt)}
                      </p>
                      {redemption.status === 'delivered' && redemption.deliveredAt && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Topshirilgan: {formatDate(redemption.deliveredAt)}
                        </p>
                      )}
                      {note && (
                        <p
                          className={cn(
                            'mt-1 rounded-md px-2 py-1 text-xs',
                            redemption.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          &quot;{note}&quot;
                        </p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0 gap-1.5 rounded-full px-2.5 py-1',
                        STATUS_STYLES[redemption.status]
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[redemption.status]}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
