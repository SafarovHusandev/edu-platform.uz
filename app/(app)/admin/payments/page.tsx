'use client';

import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { PaymentRow } from '@/components/payments/payment-row';
import { useAllPayments, useCheckPaymentStatus } from '@/hooks/use-payment';
import { PAYMENT_PURPOSE_LABELS } from '@/lib/payment-status';
import type { PaymentPurpose, PaymentStatus } from '@/types';

const PAGE_SIZE = 15;
const ALL = 'all';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: 'Kutilmoqda',
  progress: 'Amalga oshirilmoqda',
  billing: 'Amalga oshirilmoqda',
  hold: 'Tekshirilmoqda',
  success: 'Muvaffaqiyatli',
  error: 'Amalga oshmadi',
  revert: 'Qaytarildi',
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [purpose, setPurpose] = useState<PaymentPurpose | typeof ALL>(ALL);
  const [status, setStatus] = useState<PaymentStatus | typeof ALL>(ALL);
  const [userId, setUserId] = useState('');
  const { data, isLoading, isError, refetch } = useAllPayments({
    page,
    limit: PAGE_SIZE,
    purpose: purpose === ALL ? undefined : purpose,
    status: status === ALL ? undefined : status,
    userId: userId.trim() || undefined,
  });
  const checkStatus = useCheckPaymentStatus();
  const [checkingId, setCheckingId] = useState<string | null>(null);

  function handleCheckStatus(invoiceId: string) {
    setCheckingId(invoiceId);
    checkStatus.mutate(invoiceId, { onSettled: () => setCheckingId(null) });
  }

  return (
    <div>
      <PageHeader
        title="To'lovlar"
        description="Barcha foydalanuvchilarning to'lovlari — tiqilib qolganlarni holat bo'yicha filtrlab toping"
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Input
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          placeholder="Foydalanuvchi ID bo'yicha filtrlash"
          className="h-10 w-64 rounded-md"
        />

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
          <SelectTrigger className="h-10 w-48 rounded-md">
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
            ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        >
          <SelectTrigger className="h-10 w-56 rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha holatlar</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonList count={5} itemClassName="h-24" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Receipt} title="To'lovlar topilmadi" />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((payment) => (
              <PaymentRow
                key={payment.invoiceId}
                payment={payment}
                showUser
                onCheckStatus={handleCheckStatus}
                checking={checkingId === payment.invoiceId && checkStatus.isPending}
              />
            ))}
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
    </div>
  );
}
