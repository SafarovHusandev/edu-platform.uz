'use client';

import { useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import {
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgPill,
  TgSegment,
  TgSkeletonList,
  gradeLabel,
  type TgTone,
} from '@/components/tg/tg-ui';
import {
  useAllRedemptions,
  useApproveRedemption,
  useDeliverRedemption,
  useRejectRedemption,
} from '@/hooks/use-rewards';
import { resolveAssetUrl } from '@/lib/config';
import { formatNumber, formatTashkentDateTime } from '@/lib/format';
import { haptic } from '@/lib/telegram-webapp';
import type { Redemption, RedemptionActor, Reward, User } from '@/types';

type Stage = 'pending' | 'approved' | 'archive';

const PAGE_SIZE = 20;

const ARCHIVE_PILL: Record<'delivered' | 'rejected', { label: string; tone: TgTone }> = {
  delivered: { label: 'Topshirildi', tone: 'success' },
  rejected: { label: 'Rad etildi', tone: 'danger' },
};

function actorName(actor: RedemptionActor | string | null | undefined) {
  return actor && typeof actor === 'object' ? actor.name : null;
}

// Bir vaqtda bitta kartochkada amal (rad etish sababi / topshirish izohi) ochiq bo'ladi
type Pending = { id: string; kind: 'reject' | 'deliver' } | null;

function RequestCard({
  redemption,
  active,
  setActive,
}: {
  redemption: Redemption;
  active: Pending;
  setActive: (p: Pending) => void;
}) {
  const approve = useApproveRedemption();
  const reject = useRejectRedemption();
  const deliver = useDeliverRedemption();
  const [note, setNote] = useState('');

  const student = typeof redemption.student === 'object' ? (redemption.student as User) : null;
  const reward = typeof redemption.reward === 'object' ? (redemption.reward as Reward) : null;
  const image = resolveAssetUrl(reward?.image);
  const mode = active?.id === redemption._id ? active.kind : null;
  const busy = approve.isPending || reject.isPending || deliver.isPending;

  const failed = () => haptic('error');

  function done() {
    haptic('success');
    setActive(null);
    setNote('');
  }

  const archived = redemption.status === 'delivered' || redemption.status === 'rejected';

  return (
    <article className="flex flex-col gap-2.5 rounded-[18px] border border-border bg-card p-3.5">
      <div className="flex gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gold-soft text-gold-foreground">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            <Gift className="size-6" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 font-bold wrap-break-word">{reward?.title ?? 'Mukofot'}</span>
            <span className="shrink-0 font-heading text-sm font-bold text-gold-foreground">
              ◆ {formatNumber(redemption.diamondsSpent)}
            </span>
          </span>
          <span className="block text-[13px] text-muted-foreground">
            {[
              student?.name,
              gradeLabel(student?.grade),
              student?.tarif === 'premium' ? 'Premium' : null,
              formatTashkentDateTime(redemption.createdAt),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {redemption.status === 'approved' && (
            <span className="block text-xs text-muted-foreground">
              Tasdiqladi: {actorName(redemption.approvedBy) ?? '—'}
            </span>
          )}
          {archived && (
            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <TgPill tone={ARCHIVE_PILL[redemption.status as 'delivered' | 'rejected'].tone}>
                {ARCHIVE_PILL[redemption.status as 'delivered' | 'rejected'].label}
              </TgPill>
              {redemption.status === 'rejected'
                ? [actorName(redemption.rejectedBy), redemption.rejectReason && `«${redemption.rejectReason}»`]
                    .filter(Boolean)
                    .join(' · ')
                : [actorName(redemption.deliveredBy), redemption.deliveryNote].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
      </div>

      {!archived &&
        (mode ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === 'reject' ? 'Rad etish sababi (ixtiyoriy)' : 'Topshirish izohi (ixtiyoriy)'}
              className="h-11 rounded-xl border border-input bg-background px-3 text-[15px] outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="h-11 rounded-xl border border-border text-sm font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  mode === 'reject'
                    ? reject.mutate({ id: redemption._id, reason: note.trim() || undefined }, { onSuccess: done, onError: failed })
                    : deliver.mutate(
                        { id: redemption._id, note: note.trim() || undefined },
                        { onSuccess: done, onError: failed }
                      )
                }
                className={
                  mode === 'reject'
                    ? 'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-destructive text-sm font-bold text-background disabled:opacity-50'
                    : 'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-success text-sm font-bold text-success-foreground disabled:opacity-50'
                }
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                {mode === 'reject' ? 'Rad etish' : 'Topshirildi'}
              </button>
            </div>
            {mode === 'reject' && (
              <span className="text-xs text-muted-foreground">Olmos o&apos;quvchiga avtomatik qaytariladi.</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActive({ id: redemption._id, kind: 'reject' })}
              className="h-11 rounded-xl border border-destructive/35 text-sm font-semibold text-destructive"
            >
              Rad etish
            </button>
            {redemption.status === 'pending' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => approve.mutate(redemption._id, { onSuccess: done, onError: failed })}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {approve.isPending && <Loader2 className="size-4 animate-spin" />}
                Tasdiqlash
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActive({ id: redemption._id, kind: 'deliver' })}
                className="h-11 rounded-xl bg-success text-sm font-bold text-success-foreground"
              >
                Topshirildi
              </button>
            )}
          </div>
        ))}
    </article>
  );
}

type StatusParam = 'pending' | 'approved' | 'delivered,rejected';

function RequestsPage({
  page,
  status,
  active,
  setActive,
}: {
  page: number;
  status: StatusParam;
  active: Pending;
  setActive: (p: Pending) => void;
}) {
  const query = useAllRedemptions({ status, page, limit: PAGE_SIZE });
  if (query.isLoading) return <TgSkeletonList count={2} height={130} />;
  if (query.isError) return <TgError onRetry={() => query.refetch()} />;
  return query.data?.items.map((r) => (
    <RequestCard key={r._id} redemption={r} active={active} setActive={setActive} />
  ));
}

export default function TgAdminRequestsPage() {
  const [stage, setStage] = useState<Stage>('pending');
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState<Pending>(null);
  const status: StatusParam = stage === 'archive' ? 'delivered,rejected' : stage;
  const first = useAllRedemptions({ status, page: 1, limit: PAGE_SIZE });
  const last = useAllRedemptions({ status, page: pages, limit: PAGE_SIZE });
  const pendingCount = useAllRedemptions({ status: 'pending', page: 1, limit: 1 });
  const approvedCount = useAllRedemptions({ status: 'approved', page: 1, limit: 1 });
  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;

  const count = (n?: number) => (n ? ` · ${n}` : '');

  return (
    <TgPage className="gap-3">
      <TgHeader title="Mukofot so'rovlari" />
      <TgSegment
        value={stage}
        onChange={(v) => {
          setStage(v);
          setPages(1);
          setActive(null);
        }}
        options={[
          { value: 'pending', label: `Kutilmoqda${count(pendingCount.data?.total)}` },
          { value: 'approved', label: `Tasdiqlandi${count(approvedCount.data?.total)}` },
          { value: 'archive', label: 'Arxiv' },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        {stage === 'pending'
          ? "1-bosqich: so'rovni tasdiqlang yoki rad eting."
          : stage === 'approved'
            ? "2-bosqich: sovg'a qo'lga berilgach «Topshirildi» deb belgilang."
            : "Topshirilgan va rad etilgan so'rovlar tarixi."}
      </p>

      {first.isLoading ? (
        <TgSkeletonList count={3} height={130} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty
          icon={Gift}
          title={
            stage === 'pending'
              ? "Yangi so'rovlar yo'q"
              : stage === 'approved'
                ? "Topshirishni kutayotgan sovg'a yo'q"
                : "Arxiv bo'sh"
          }
          description={
            stage === 'pending' ? "O'quvchi olmosga sovg'a so'raganda shu yerda paydo bo'ladi" : undefined
          }
        />
      ) : (
        <>
          {Array.from({ length: pages }, (_, i) => (
            <RequestsPage
              key={i + 1}
              page={i + 1}
              status={status}
              active={active}
              setActive={setActive}
            />
          ))}
          {pages < totalPages && last.isSuccess && !last.isPlaceholderData && (
            <TgLoadMore
              onClick={() => setPages((p) => p + 1)}
              shown={Math.min(pages * PAGE_SIZE, total)}
              total={total}
            />
          )}
        </>
      )}
    </TgPage>
  );
}
