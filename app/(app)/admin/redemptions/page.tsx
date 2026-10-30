'use client';

import { useState } from 'react';
import { Check, Gift, Loader2, PackageCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { FilterPills } from '@/components/ui/filter-pills';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import {
  useAllRedemptions,
  useApproveRedemption,
  useRejectRedemption,
  useDeliverRedemption,
} from '@/hooks/use-rewards';
import { formatNumber, formatTashkentDateTime } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { Redemption, RedemptionActor, User } from '@/types';

const PAGE_SIZE = 15;

type Stage = 'pending' | 'approved' | 'archive';
type ArchiveStatus = 'all' | 'delivered' | 'rejected';

function actorName(actor: RedemptionActor | string | null | undefined) {
  return actor && typeof actor === 'object' ? actor.name : null;
}

function statusLine(redemption: Redemption) {
  switch (redemption.status) {
    case 'pending':
      return 'Olmos yechildi · kutilmoqda';
    case 'approved':
      return `Tasdiqlandi${actorName(redemption.approvedBy) ? ` · ${actorName(redemption.approvedBy)}` : ''} · topshirish kutilmoqda`;
    case 'delivered':
      return `Topshirildi${actorName(redemption.deliveredBy) ? ` · ${actorName(redemption.deliveredBy)}` : ''}${redemption.deliveredAt ? ` · ${formatTashkentDateTime(redemption.deliveredAt)}` : ''}${redemption.deliveryNote ? ` · «${redemption.deliveryNote}»` : ''}`;
    case 'rejected':
      return `Rad etildi${actorName(redemption.rejectedBy) ? ` · ${actorName(redemption.rejectedBy)}` : ''}${redemption.rejectReason ? ` · «${redemption.rejectReason}»` : ''} · olmos qaytarildi`;
  }
}

export default function AdminRedemptionsPage() {
  const [stage, setStage] = useState<Stage>('pending');
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus>('all');
  const [page, setPage] = useState(1);
  // Arxiv "Barchasi": backend bir nechta holatni vergul bilan qabul qiladi
  const status =
    stage === 'archive'
      ? archiveStatus === 'all'
        ? ('delivered,rejected' as const)
        : archiveStatus
      : stage;

  const { data, isLoading, isError, refetch } = useAllRedemptions({
    status,
    page,
    limit: PAGE_SIZE,
  });
  const { data: pendingCount } = useAllRedemptions({ status: 'pending', page: 1, limit: 1 });
  const { data: approvedCount } = useAllRedemptions({ status: 'approved', page: 1, limit: 1 });
  const { data: deliveredCount } = useAllRedemptions({ status: 'delivered', page: 1, limit: 1 });
  const { data: rejectedCount } = useAllRedemptions({ status: 'rejected', page: 1, limit: 1 });

  const approveRedemption = useApproveRedemption();
  const rejectRedemption = useRejectRedemption();
  const deliverRedemption = useDeliverRedemption();

  const [rejecting, setRejecting] = useState<Redemption | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [delivering, setDelivering] = useState<Redemption | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  const stages: { value: Stage; caption: string; label: string; count: number }[] = [
    {
      value: 'pending',
      caption: '1-bosqich',
      label: 'Kutilmoqda',
      count: pendingCount?.total ?? 0,
    },
    {
      value: 'approved',
      caption: '2-bosqich',
      label: 'Tasdiqlangan',
      count: approvedCount?.total ?? 0,
    },
    {
      value: 'archive',
      caption: 'Arxiv',
      label: 'Tarix',
      count: (deliveredCount?.total ?? 0) + (rejectedCount?.total ?? 0),
    },
  ];

  function handleReject() {
    if (!rejecting) return;
    rejectRedemption.mutate(
      { id: rejecting._id, reason: rejectReason.trim() || undefined },
      { onSuccess: () => setRejecting(null) }
    );
  }

  function handleDeliver() {
    if (!delivering) return;
    deliverRedemption.mutate(
      { id: delivering._id, note: deliveryNote.trim() || undefined },
      { onSuccess: () => setDelivering(null) }
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Mukofot so'rovlari" />

      <div role="tablist" className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {stages.map((item) => {
          const active = stage === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStage(item.value);
                setPage(1);
              }}
              className={cn(
                'rounded-2xl px-3.5 py-3 text-left transition-colors sm:px-4',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card hover:border-primary/40'
              )}
            >
              <span className="block text-xs font-semibold opacity-80 sm:text-[13px]">
                {item.caption}
              </span>
              <span className="mt-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-bold sm:text-[17px]">{item.label}</span>
                <span className="font-heading text-lg font-bold sm:text-[22px]">
                  {formatNumber(item.count)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {stage === 'archive' && (
        <FilterPills
          className="mb-4"
          value={archiveStatus}
          onChange={(v) => {
            setArchiveStatus(v);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Barchasi' },
            { value: 'delivered', label: 'Topshirilgan', count: deliveredCount?.total },
            { value: 'rejected', label: 'Rad etilgan', count: rejectedCount?.total },
          ]}
        />
      )}

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Bu bo'limda so'rovlar yo'q" />
      ) : (
        <>
          <div className="overflow-hidden rounded-[20px] border border-border bg-card">
            {data.items.map((redemption) => {
              const reward = typeof redemption.reward === 'object' ? redemption.reward : null;
              const student =
                typeof redemption.student === 'object' ? (redemption.student as User) : null;
              const rewardImage = resolveAssetUrl(reward?.image);
              const approving =
                approveRedemption.isPending && approveRedemption.variables === redemption._id;
              return (
                <div
                  key={redemption._id}
                  className="flex flex-wrap items-center gap-4 border-b border-muted px-5 py-4 last:border-0"
                >
                  {rewardImage ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({ src: rewardImage, title: reward?.title ?? 'Mukofot' })
                      }
                      aria-label="Rasmni kattalashtirish"
                      className="size-14 shrink-0 cursor-zoom-in overflow-hidden rounded-[14px] bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rewardImage} alt="" className="size-full object-cover" />
                    </button>
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-muted text-muted-foreground">
                      <Gift className="size-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-[1_1_220px]">
                    <div className="flex flex-wrap items-center gap-x-2 font-bold">
                      {reward?.title ?? 'Mukofot'}
                      <span className="flex items-center gap-1 font-heading text-[13px] font-semibold text-gold-foreground">
                        <DiamondIcon className="size-3.5" />
                        {formatNumber(redemption.diamondsSpent)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {[
                        student?.name ?? 'Foydalanuvchi',
                        student?.grade?.number
                          ? `${student.grade.number}-${student.grade.letter ?? ''}`
                          : null,
                        student?.tarif === 'premium' ? 'Premium' : null,
                        formatTashkentDateTime(redemption.createdAt),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div
                      className={cn(
                        'mt-0.5 text-[13px]',
                        redemption.status === 'rejected'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {statusLine(redemption)}
                    </div>
                  </div>

                  {redemption.status === 'pending' || redemption.status === 'approved' ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-destructive/35 text-destructive hover:bg-destructive-soft hover:text-destructive"
                        onClick={() => {
                          setRejecting(redemption);
                          setRejectReason('');
                        }}
                      >
                        <X className="size-4" /> Rad etish
                      </Button>
                      {redemption.status === 'pending' ? (
                        <Button
                          className="bg-success text-success-foreground hover:bg-success/90"
                          disabled={approving}
                          onClick={() => approveRedemption.mutate(redemption._id)}
                        >
                          {approving ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Tasdiqlash
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setDelivering(redemption);
                            setDeliveryNote('');
                          }}
                        >
                          <PackageCheck className="size-4" /> Topshirildi
                        </Button>
                      )}
                    </div>
                  ) : (
                    <StatusPill tone={redemption.status === 'delivered' ? 'success' : 'danger'}>
                      {redemption.status === 'delivered' ? 'Topshirildi' : 'Rad etildi'}
                    </StatusPill>
                  )}
                </div>
              );
            })}
          </div>
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="so'rov"
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>So&apos;rovni rad etish</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {formatNumber(rejecting?.diamondsSpent ?? 0)} olmos o&apos;quvchiga qaytariladi.
          </p>
          <Textarea
            placeholder="Rad etish sababi (o'quvchiga ko'rinadi)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxLength={500}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectRedemption.isPending}
            >
              {rejectRedemption.isPending && <Loader2 className="size-4 animate-spin" />}
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delivering} onOpenChange={(open) => !open && setDelivering(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mukofot topshirildi deb belgilash</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Topshirish haqida izoh (ixtiyoriy)"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            maxLength={500}
          />
          <DialogFooter>
            <Button onClick={handleDeliver} disabled={deliverRedemption.isPending}>
              {deliverRedemption.isPending && <Loader2 className="size-4 animate-spin" />}
              Topshirildi deb belgilash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-lg p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">{previewImage?.title}</DialogTitle>
          {previewImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImage.src}
              alt={previewImage.title}
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
