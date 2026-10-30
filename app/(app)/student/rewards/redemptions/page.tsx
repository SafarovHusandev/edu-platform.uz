'use client';

import { useState } from 'react';
import { Gift, PackageCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { useMyRedemptions } from '@/hooks/use-rewards';
import { formatNumber } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { Redemption, RedemptionActor, RedemptionStatus } from '@/types';

const STATUS_PILL: Record<RedemptionStatus, { label: string; tone: StatusPillTone }> = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  approved: { label: 'Tasdiqlandi', tone: 'primary' },
  delivered: { label: 'Topshirildi', tone: 'success' },
  rejected: { label: 'Rad etildi', tone: 'danger' },
};

type Filter = 'all' | 'open' | 'delivered' | 'rejected';

function shortDateTime(value: string) {
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm} ${hh}:${mi}`;
}

function actorName(actor: RedemptionActor | string | null | undefined) {
  return actor && typeof actor === 'object' ? actor.name.split(' ')[0] : null;
}

interface Step {
  label: string;
  meta: string;
  state: 'done' | 'rejected' | 'todo';
}

function steps(redemption: Redemption): Step[] {
  const sent: Step = {
    label: 'Yuborildi',
    meta: shortDateTime(redemption.createdAt),
    state: 'done',
  };
  const stamp = (at?: string | null, by?: RedemptionActor | string | null) =>
    [at ? shortDateTime(at).split(' ')[0] : null, actorName(by)].filter(Boolean).join(' · ') || '—';

  if (redemption.status === 'rejected') {
    return [
      sent,
      {
        label: 'Rad etildi',
        meta: stamp(redemption.rejectedAt, redemption.rejectedBy),
        state: 'rejected',
      },
      { label: '—', meta: '', state: 'todo' },
    ];
  }
  const approved = redemption.status === 'approved' || redemption.status === 'delivered';
  const delivered = redemption.status === 'delivered';
  return [
    sent,
    {
      label: approved ? 'Tasdiqlandi' : 'Tasdiqlash',
      meta: approved ? stamp(redemption.approvedAt, redemption.approvedBy) : '—',
      state: approved ? 'done' : 'todo',
    },
    {
      label: delivered ? 'Yetkazildi' : 'Yetkazish',
      meta: delivered
        ? stamp(redemption.deliveredAt, redemption.deliveredBy)
        : approved
          ? 'kutilmoqda'
          : '—',
      state: delivered ? 'done' : 'todo',
    },
  ];
}

function statusNote(redemption: Redemption) {
  switch (redemption.status) {
    case 'pending':
      return redemption.adminNote || "Olmos yechildi, admin ko'rib chiqmoqda";
    case 'approved':
      return redemption.adminNote || 'Admin topshirgach yakunlanadi';
    case 'delivered':
      return redemption.deliveryNote || 'Mukofot sizga topshirildi';
    case 'rejected':
      return `Sabab: «${redemption.rejectReason || redemption.adminNote || "ko'rsatilmagan"}» · ${formatNumber(redemption.diamondsSpent)} olmos qaytarildi`;
  }
}

export default function MyRedemptionsPage() {
  const { data, isLoading, isError, refetch } = useMyRedemptions(1, 50);
  const [filter, setFilter] = useState<Filter>('all');

  const all = data?.items ?? [];
  const items = all.filter((r) => {
    if (filter === 'open') return r.status === 'pending' || r.status === 'approved';
    if (filter === 'delivered') return r.status === 'delivered';
    if (filter === 'rejected') return r.status === 'rejected';
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Mukofot so'rovlarim"
        breadcrumbs={[{ label: 'Mukofotlar', href: '/student/rewards' }, { label: "So'rovlarim" }]}
      />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[20px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : all.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Hali mukofotga almashtirmagansiz" />
      ) : (
        <div className="flex flex-col gap-4">
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Barchasi' },
              {
                value: 'open',
                label: 'Jarayonda',
                count: all.filter((r) => r.status === 'pending' || r.status === 'approved').length,
              },
              { value: 'delivered', label: 'Topshirilgan' },
              { value: 'rejected', label: 'Rad etilgan' },
            ]}
          />

          {items.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Bu bo'limda so'rovlar yo'q" />
          ) : (
            items.map((redemption) => {
              const reward = typeof redemption.reward === 'object' ? redemption.reward : null;
              const image = resolveAssetUrl(reward?.image);
              const pill = STATUS_PILL[redemption.status];
              return (
                <article
                  key={redemption._id}
                  className="flex flex-wrap items-center gap-4 rounded-[20px] border border-border bg-card px-5 py-[18px] sm:gap-[18px]"
                >
                  <span className="flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-muted">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="size-full object-cover" />
                    ) : (
                      <Gift className="size-6 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-[1_1_200px]">
                    <div className="flex flex-wrap items-center gap-x-2 text-base font-bold">
                      {reward?.title ?? 'Mukofot'}
                      <span className="flex items-center gap-1 font-heading text-[13px] text-gold-foreground">
                        <DiamondIcon className="size-3.5" />{' '}
                        {formatNumber(redemption.diamondsSpent)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{statusNote(redemption)}</p>
                  </div>
                  <div className="grid flex-[1_1_320px] grid-cols-3 gap-2">
                    {steps(redemption).map((step, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div
                          className={cn(
                            'h-1.5 rounded-full',
                            step.state === 'done'
                              ? 'bg-success'
                              : step.state === 'rejected'
                                ? 'bg-destructive'
                                : 'bg-border'
                          )}
                        />
                        <span className="text-xs font-bold">{step.label}</span>
                        <span className="text-xs text-muted-foreground">{step.meta}</span>
                      </div>
                    ))}
                  </div>
                  <StatusPill tone={pill.tone} className="px-3 py-1.5 text-[13px]">
                    {pill.label}
                  </StatusPill>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
