'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Gift, PackageCheck } from 'lucide-react';
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
import { formatDate, formatNumber } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { RedemptionStatus } from '@/types';

const STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  delivered: 'Topshirilgan',
  rejected: 'Rad etilgan',
};

const STATUS_STYLES: Record<RedemptionStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400',
  approved: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-400',
  delivered: 'bg-success/10 text-success ring-1 ring-success/20',
  rejected: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
};

type StepState = 'done' | 'pending' | 'rejected' | 'none';

function getProgressSteps(status: RedemptionStatus): { label: string; state: StepState }[] {
  if (status === 'rejected') {
    return [
      { label: 'Kutilmoqda', state: 'done' },
      { label: 'Rad etildi', state: 'rejected' },
      { label: '—', state: 'none' },
    ];
  }
  const order: RedemptionStatus[] = ['pending', 'approved', 'delivered'];
  const labels = ['Kutilmoqda', 'Tasdiqlangan', 'Topshirilgan'];
  const currentIdx = order.indexOf(status);
  return labels.map((label, idx) => ({
    label,
    state: idx <= currentIdx ? 'done' : 'pending',
  }));
}

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
              const steps = getProgressSteps(redemption.status);

              let note: string | undefined;
              if (redemption.status === 'pending') {
                note = redemption.adminNote || "Administrator ko'rib chiqmoqda";
              } else if (redemption.status === 'approved') {
                note = redemption.adminNote;
              } else if (redemption.status === 'delivered') {
                note =
                  redemption.deliveryNote ||
                  (redemption.deliveredAt
                    ? `Topshirildi: ${formatDate(redemption.deliveredAt)}`
                    : undefined);
              } else if (redemption.status === 'rejected') {
                note = redemption.rejectReason || redemption.adminNote;
              }

              return (
                <Card key={redemption._id} className="rounded-2xl border-border/70 p-0 shadow-xs">
                  <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                      <p className="truncate text-base font-semibold text-foreground">
                        {reward?.title ?? 'Mukofot'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(redemption.createdAt)} ·{' '}
                        {formatNumber(redemption.diamondsSpent)} olmos
                      </p>
                      {note && (
                        <p
                          className={cn(
                            'mt-1 text-xs',
                            redemption.status === 'rejected'
                              ? 'font-medium text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          {note}
                        </p>
                      )}
                    </div>

                    <div className="hidden w-56 shrink-0 flex-col gap-1.5 sm:flex">
                      <div className="flex gap-1.5">
                        {steps.map((step, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'h-1.5 flex-1 rounded-full',
                              step.state === 'done' && 'bg-success',
                              step.state === 'rejected' && 'bg-destructive',
                              step.state === 'pending' && 'bg-muted',
                              step.state === 'none' && 'bg-transparent'
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex text-[11px]">
                        {steps.map((step, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'flex-1',
                              idx === 0 && 'text-left',
                              idx === 1 && 'text-center',
                              idx === 2 && 'text-right',
                              step.state === 'done' && 'font-medium text-foreground',
                              step.state === 'rejected' && 'font-medium text-destructive',
                              (step.state === 'pending' || step.state === 'none') &&
                                'text-muted-foreground'
                            )}
                          >
                            {step.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1',
                        STATUS_STYLES[redemption.status]
                      )}
                    >
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
