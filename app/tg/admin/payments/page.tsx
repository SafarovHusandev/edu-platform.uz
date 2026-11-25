'use client';

import { useState } from 'react';
import { CreditCard, Loader2, RefreshCw } from 'lucide-react';
import {
  TgChips,
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
} from '@/components/tg/tg-ui';
import { PAYMENT_PILL, paymentLabel } from '@/components/tg/tg-admin-utils';
import { useAllPayments, useCheckPaymentStatus } from '@/hooks/use-payment';
import { formatPrice, formatTashkentDateTime } from '@/lib/format';
import { isTerminalPaymentStatus } from '@/lib/payment-status';
import type { PaymentPurpose } from '@/types';

type StatusFilter = 'default' | 'success' | 'pending' | 'error,revert';
type PurposeFilter = 'all' | PaymentPurpose;

const PAGE_SIZE = 20;

export default function TgAdminPaymentsPage() {
  const [status, setStatus] = useState<StatusFilter>('default');
  const [purpose, setPurpose] = useState<PurposeFilter>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const check = useCheckPaymentStatus();

  const payments = useAllPayments({
    page: 1,
    limit,
    status:
      status === 'default'
        ? undefined
        : status === 'pending'
          ? 'draft,progress,billing,hold'
          : status,
    purpose: purpose === 'all' ? undefined : purpose,
  });
  const items = payments.data?.items ?? [];

  return (
    <TgPage>
      <TgHeader title="To'lovlar" />
      <TgChips
        value={status}
        onChange={(v) => {
          setStatus(v);
          setLimit(PAGE_SIZE);
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
          setLimit(PAGE_SIZE);
        }}
        options={[
          { value: 'all', label: 'Barcha turlar' },
          { value: 'premium', label: 'Premium' },
          { value: 'course', label: 'Kurs' },
          { value: 'wallet', label: 'Hamyon' },
          { value: 'donation', label: 'Homiylik' },
        ]}
      />

      {payments.isLoading ? (
        <TgSkeletonList count={6} height={64} />
      ) : payments.isError ? (
        <TgError onRetry={() => payments.refetch()} />
      ) : items.length === 0 ? (
        <TgEmpty icon={CreditCard} title="To'lovlar topilmadi" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((p) => {
            const pill = PAYMENT_PILL[p.status];
            const canCheck = !isTerminalPaymentStatus(p.status) && p.paymentMethod !== 'balance';
            const checking = check.isPending && check.variables === p.invoiceId;
            return (
              <div key={p.invoiceId} className="flex items-center gap-3 border-t border-border px-3.5 py-3 first:border-t-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.user?.name ?? '—'}</span>
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
          })}
        </div>
      )}

      {(payments.data?.total ?? 0) > items.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="h-11 rounded-xl border border-border bg-card text-sm font-semibold"
        >
          Yana yuklash
        </button>
      )}

      <TgWebHint href="/admin/payments">Sana bo&apos;yicha filtr va eksport —</TgWebHint>
    </TgPage>
  );
}
