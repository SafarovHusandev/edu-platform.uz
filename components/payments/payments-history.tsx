'use client';

import { useState } from 'react';
import { Loader2, Receipt, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { StatusPill, type StatusPillTone } from '@/components/dashboard/dashboard-ui';
import { useAllPayments, useCheckPaymentStatus, useMyPayments } from '@/hooks/use-payment';
import { PAYMENT_PURPOSE_LABELS } from '@/lib/payment-status';
import { formatPrice, planKeyToLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentPurpose, PaymentRecord, PaymentStatus } from '@/types';

const ALL = 'all';
const PAGE_SIZE = 15;

const STATUS_PILL: Record<PaymentStatus, { label: string; tone: StatusPillTone }> = {
  draft: { label: 'Kutilmoqda', tone: 'warning' },
  progress: { label: 'Jarayonda', tone: 'warning' },
  billing: { label: 'Jarayonda', tone: 'warning' },
  hold: { label: 'Tekshirilmoqda', tone: 'warning' },
  success: { label: "To'landi", tone: 'success' },
  error: { label: 'Bekor qilindi', tone: 'danger' },
  revert: { label: 'Qaytarildi', tone: 'neutral' },
};

const STATUS_FILTERS: { value: PaymentStatus; label: string }[] = [
  { value: 'success', label: "To'langan" },
  { value: 'draft', label: 'Kutilmoqda' },
  { value: 'progress', label: 'Jarayonda' },
  { value: 'hold', label: 'Tekshirilmoqda' },
  { value: 'error', label: 'Bekor qilingan' },
  { value: 'revert', label: 'Qaytarilgan' },
];

function paymentTitle(payment: PaymentRecord) {
  if (payment.purpose === 'premium' && payment.plan)
    return `Premium · ${planKeyToLabel(payment.plan)}`;
  if (payment.purpose === 'course')
    return payment.course && typeof payment.course === 'object' && payment.course.title
      ? `Kurs: ${payment.course.title}`
      : 'Kurs';
  if (payment.purpose === 'wallet') return "Balans to'ldirish";
  return PAYMENT_PURPOSE_LABELS[payment.purpose];
}

// Backend paymentMethod qaytaradi; eski yozuvlar uchun karta raqamidan taxmin
function paymentMethod(payment: PaymentRecord) {
  if (payment.paymentMethod === 'balance') return 'Balans';
  if (payment.cardPan) return `Karta ${payment.cardPan}`;
  if (payment.paymentMethod === 'card') return 'Multicard';
  if (payment.status === 'success' && payment.purpose !== 'wallet') return 'Balans';
  return 'Multicard';
}

// <input type="date"> qiymatini Toshkent kun chegarasiga aylantiradi
function dayBoundary(value: string, end: boolean) {
  return value ? `${value}T${end ? '23:59:59.999' : '00:00:00.000'}+05:00` : undefined;
}

function shortDateTime(value: string) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PaymentsHistory({
  scope = 'my',
  title,
}: {
  // 'all' — admin: barcha foydalanuvchilar to'lovlari (to'lovchi ustuni bilan)
  scope?: 'my' | 'all';
  title?: string;
}) {
  const [page, setPage] = useState(1);
  const [purpose, setPurpose] = useState<PaymentPurpose | typeof ALL>(ALL);
  const [status, setStatus] = useState<PaymentStatus | typeof ALL>(ALL);
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filters = {
    page,
    limit: PAGE_SIZE,
    purpose: purpose === ALL ? undefined : purpose,
    status: status === ALL ? undefined : status,
  };
  const myPayments = useMyPayments(filters, { enabled: scope === 'my' });
  const allPayments = useAllPayments(
    {
      ...filters,
      userId: userId.trim() || undefined,
      from: dayBoundary(from, false),
      to: dayBoundary(to, true),
    },
    { enabled: scope === 'all' }
  );
  const { data, isLoading, isError, refetch } = scope === 'all' ? allPayments : myPayments;
  const checkStatus = useCheckPaymentStatus();
  const showUser = scope === 'all';

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {title && <h2 className="text-lg font-bold">{title}</h2>}
        <div className="flex flex-wrap gap-2">
          {showUser && (
            <Input
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              placeholder="Foydalanuvchi ID"
              aria-label="Foydalanuvchi ID bo'yicha filtr"
              className="w-full sm:w-56"
            />
          )}
          {showUser && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                aria-label="Boshlanish sanasi"
                className="w-40"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                aria-label="Tugash sanasi"
                className="w-40"
              />
            </div>
          )}
          <Select
            value={purpose}
            onValueChange={(v) => {
              setPurpose((v as PaymentPurpose | typeof ALL) ?? ALL);
              setPage(1);
            }}
            items={[
              { value: ALL, label: 'Barcha maqsadlar' },
              ...Object.entries(PAYMENT_PURPOSE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          >
            <SelectTrigger className="w-48" aria-label="Maqsad">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha maqsadlar</SelectItem>
              {Object.entries(PAYMENT_PURPOSE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus((v as PaymentStatus | typeof ALL) ?? ALL);
              setPage(1);
            }}
            items={[
              { value: ALL, label: 'Barcha holatlar' },
              ...STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label })),
            ]}
          >
            <SelectTrigger className="w-44" aria-label="Holat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha holatlar</SelectItem>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Receipt} title="To'lovlar topilmadi" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
                  {showUser && <th className="px-5 py-3.5 font-semibold">To&apos;lovchi</th>}
                  <th className={cn('py-3.5 font-semibold', showUser ? 'px-3' : 'px-5')}>Maqsad</th>
                  <th className="px-3 py-3.5 font-semibold">Usul</th>
                  <th className="px-3 py-3.5 font-semibold">Sana</th>
                  <th className="px-3 py-3.5 text-right font-semibold">Summa</th>
                  <th className="px-5 py-3.5 font-semibold">Holat</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((payment) => {
                  const pill = STATUS_PILL[payment.status] ?? STATUS_PILL.draft;
                  const incoming = payment.purpose === 'wallet';
                  const checking =
                    checkStatus.isPending && checkStatus.variables === payment.invoiceId;
                  return (
                    <tr key={payment.invoiceId} className="border-t border-muted">
                      {showUser && (
                        <td className="px-5 py-3">
                          <div className="font-semibold">{payment.user?.name ?? '—'}</div>
                          {payment.user?.phone && (
                            <div className="text-xs text-muted-foreground">
                              +{payment.user.phone}
                            </div>
                          )}
                        </td>
                      )}
                      <td className={cn('py-3 font-semibold', showUser ? 'px-3' : 'px-5')}>
                        {paymentTitle(payment)}
                      </td>
                      <td className="px-3 py-3">{paymentMethod(payment)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {shortDateTime(payment.paymentTime ?? payment.createdAt)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-3 text-right font-bold whitespace-nowrap tabular-nums',
                          incoming && payment.status === 'success' && 'text-success'
                        )}
                      >
                        {incoming ? '+' : '−'}
                        {formatPrice(payment.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5">
                          <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                          {payment.status !== 'success' && payment.status !== 'error' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Holatni tekshirish"
                              title="Holatni tekshirish"
                              disabled={checking}
                              onClick={() => checkStatus.mutate(payment.invoiceId)}
                            >
                              {checking ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <RefreshCw className="size-4" />
                              )}
                            </Button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="to'lov"
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
