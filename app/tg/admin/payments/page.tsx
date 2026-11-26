'use client';

import { useState } from 'react';
import { CreditCard, Loader2, RefreshCw } from 'lucide-react';
import {
  TgChips,
  TgEmpty,
  TgError,
  TgHeader,
  TgLoadMore,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
} from '@/components/tg/tg-ui';
import { PAYMENT_PILL, paymentLabel } from '@/components/tg/tg-admin-utils';
import { useAllPayments, useCheckPaymentStatus, type AdminPaymentFilters } from '@/hooks/use-payment';
import { formatPrice, formatTashkentDateTime } from '@/lib/format';
import { isTerminalPaymentStatus } from '@/lib/payment-status';
import type { PaymentPurpose } from '@/types';

type StatusFilter = 'default' | 'success' | 'pending' | 'error,revert';
type PurposeFilter = 'all' | PaymentPurpose;

const PAGE_SIZE = 20;

type PaymentFilters = Pick<AdminPaymentFilters, 'status' | 'purpose'>;

function PaymentsPage({ page, filters }: { page: number; filters: PaymentFilters }) {
  const query = useAllPayments({ page, limit: PAGE_SIZE, ...filters });
  const check = useCheckPaymentStatus();
  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="p-3">
        <TgError onRetry={() => query.refetch()} />
      </div>
    );
  }
  return query.data?.items.map((p) => {
    const pill = PAYMENT_PILL[p.status];
    const canCheck = !isTerminalPaymentStatus(p.status) && p.paymentMethod !== 'balance';
    const checking = check.isPending && check.variables === p.invoiceId;
    return (
      <div
        key={p.invoiceId}
        className="flex items-center gap-3 border-t border-border px-3.5 py-3 first:border-t-0"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{p.user?.name ?? '—'}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {paymentLabel(p)} · {formatTashkentDateTime(p.paymentTime ?? p.createdAt)}
            {p.paymentMethod === 'balance' && ' · balansdan'}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-heading text-sm font-bold tabular-nums">{formatPrice(p.amount)}</span>
          {canCheck ? (
            <button
              type="button"
              disabled={check.isPending}
              aria-label={`${pill.label} — holatni qayta tekshirish`}
              onClick={() => check.mutate(p.invoiceId)}
              className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-bold text-gold-foreground"
            >
              {checking ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              {pill.label}
            </button>
          ) : (
            <TgPill tone={pill.tone}>{pill.label}</TgPill>
          )}
        </span>
      </div>
    );
  });
}

export default function TgAdminPaymentsPage() {
  const [status, setStatus] = useState<StatusFilter>('default');
  const [purpose, setPurpose] = useState<PurposeFilter>('all');
  const [pages, setPages] = useState(1);

  const filters: PaymentFilters = {
    status:
      status === 'default' ? undefined : status === 'pending' ? 'draft,progress,billing,hold' : status,
    purpose: purpose === 'all' ? undefined : purpose,
  };
  const first = useAllPayments({ page: 1, limit: PAGE_SIZE, ...filters });
  const last = useAllPayments({ page: pages, limit: PAGE_SIZE, ...filters });
  const total = first.data?.total ?? 0;
  const totalPages = last.data?.totalPages ?? first.data?.totalPages ?? 1;

  return (
    <TgPage className="gap-3">
      <TgHeader title="To'lovlar" />
      <TgChips
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPages(1);
        }}
        options={[
          { value: 'default', label: 'Barchasi' },
          { value: 'success', label: "To'langan" },
          { value: 'pending', label: 'Jarayonda' },
          { value: 'error,revert', label: 'Bekor / qaytarilgan' },
        ]}
      />
      <TgChips
        value={purpose}
        onChange={(v) => {
          setPurpose(v);
          setPages(1);
        }}
        options={[
          { value: 'all', label: 'Barcha turlar' },
          { value: 'premium', label: 'Premium' },
          { value: 'course', label: 'Kurs' },
          { value: 'wallet', label: 'Hamyon' },
          { value: 'donation', label: 'Homiylik' },
        ]}
      />

      {first.isLoading ? (
        <TgSkeletonList count={6} height={64} />
      ) : first.isError ? (
        <TgError onRetry={() => first.refetch()} />
      ) : total === 0 ? (
        <TgEmpty icon={CreditCard} title="To'lovlar topilmadi" description="Boshqa filtrni tanlab ko'ring" />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {Array.from({ length: pages }, (_, i) => (
              <PaymentsPage key={i + 1} page={i + 1} filters={filters} />
            ))}
          </div>
          {pages < totalPages && last.isSuccess && !last.isPlaceholderData && (
            <TgLoadMore
              onClick={() => setPages((p) => p + 1)}
              shown={Math.min(pages * PAGE_SIZE, total)}
              total={total}
            />
          )}
        </>
      )}

      <TgWebHint href="/admin/payments">Sana bo&apos;yicha filtr va eksport —</TgWebHint>
    </TgPage>
  );
}
