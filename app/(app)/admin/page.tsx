'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import {
  DashboardGreeting,
  SectionCard,
  SectionLink,
  StatGrid,
  StatTile,
  StatusPill,
  type StatusPillTone,
} from '@/components/dashboard/dashboard-ui';
import { useUsers, useVerifyUser } from '@/hooks/use-users';
import { useAdminStats } from '@/hooks/use-stats';
import { useAllPayments } from '@/hooks/use-payment';
import { ROLE_LABELS } from '@/lib/roles';
import { PAYMENT_PURPOSE_LABELS } from '@/lib/payment-status';
import { formatDateTime, formatNumber, formatPrice, planKeyToLabel } from '@/lib/format';
import type { PaymentRecord, PaymentStatus } from '@/types';

const PAYMENT_STATUS_PILL: Partial<Record<PaymentStatus, { label: string; tone: StatusPillTone }>> =
  {
    success: { label: "To'landi", tone: 'success' },
    error: { label: 'Bekor qilindi', tone: 'danger' },
    revert: { label: 'Qaytarildi', tone: 'neutral' },
  };

function paymentLabel(payment: PaymentRecord) {
  if (payment.purpose === 'premium' && payment.plan)
    return `Premium ${planKeyToLabel(payment.plan)}`;
  if (payment.purpose === 'course' && payment.course && typeof payment.course === 'object')
    return payment.course.title ?? 'Kurs';
  return PAYMENT_PURPOSE_LABELS[payment.purpose];
}

export default function AdminDashboardPage() {
  const stats = useAdminStats();
  const pendingUsers = useUsers({ page: 1, limit: 5, isVerified: false });
  const recentPayments = useAllPayments({ page: 1, limit: 5 });
  const verifyUser = useVerifyUser();
  const s = stats.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <DashboardGreeting title="Platforma ko'rsatkichlari" />

      {stats.isError ? (
        <ErrorState onRetry={() => stats.refetch()} />
      ) : (
        <StatGrid>
          <StatTile
            label="O'quvchilar"
            value={formatNumber(s?.students ?? 0)}
            href="/admin/users"
            loading={stats.isLoading}
          />
          <StatTile
            label="O'qituvchilar"
            value={formatNumber(s?.teachers ?? 0)}
            href="/admin/users"
            loading={stats.isLoading}
          />
          <StatTile
            tone={(s?.pendingUsers ?? 0) > 0 ? 'attention' : 'default'}
            label="Tasdiqlash kutmoqda"
            value={formatNumber(s?.pendingUsers ?? 0)}
            href="/admin/users?tab=unverified"
            loading={stats.isLoading}
          />
          <StatTile
            tone={(s?.pendingRedemptions ?? 0) > 0 ? 'attention' : 'default'}
            label="Mukofot so'rovlari"
            value={formatNumber(s?.pendingRedemptions ?? 0)}
            href="/admin/redemptions"
            loading={stats.isLoading}
          />
          <StatTile
            label="Faol Premium"
            value={formatNumber(s?.activePremium ?? 0)}
            loading={stats.isLoading}
          />
          <StatTile
            label={`To'lovlar · bu oy${s ? ` (${formatNumber(s.paymentsThisMonth.count)} ta)` : ''}`}
            value={
              <span className="text-[22px]">{formatPrice(s?.paymentsThisMonth.total ?? 0)}</span>
            }
            href="/admin/payments"
            loading={stats.isLoading}
          />
        </StatGrid>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <SectionCard
          title="Tasdiqlash navbati"
          action={<SectionLink href="/admin/users">Barchasi</SectionLink>}
          bodyClassName="flex flex-col"
        >
          {pendingUsers.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="my-1.5 h-11 animate-pulse rounded-xl bg-muted" />
            ))
          ) : (pendingUsers.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tasdiqlash kutayotgan foydalanuvchi yo&apos;q
            </p>
          ) : (
            pendingUsers.data!.items.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 border-b border-muted py-3 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{user.name}</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {[
                      ROLE_LABELS[user.role],
                      user.grade?.number ? `${user.grade.number}-${user.grade.letter ?? ''}` : null,
                      user.createdAt ? formatDateTime(user.createdAt) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <Button
                  size="sm"
                  className="h-9 px-3.5"
                  disabled={verifyUser.isPending && verifyUser.variables === user._id}
                  onClick={() => verifyUser.mutate(user._id)}
                >
                  {verifyUser.isPending && verifyUser.variables === user._id && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Tasdiqlash
                </Button>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="So'nggi to'lovlar" bodyClassName="flex flex-col">
          {recentPayments.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="my-1.5 h-9 animate-pulse rounded-xl bg-muted" />
            ))
          ) : (recentPayments.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Hali to&apos;lovlar yo&apos;q</p>
          ) : (
            recentPayments.data!.items.map((payment) => {
              const pill = PAYMENT_STATUS_PILL[payment.status] ?? {
                label: 'Kutilmoqda',
                tone: 'warning' as const,
              };
              return (
                <div
                  key={payment.invoiceId}
                  className="flex items-center justify-between gap-3 border-b border-muted py-3 text-sm last:border-0"
                >
                  <span className="min-w-0 truncate">
                    <strong>{payment.user?.name ?? '—'}</strong> · {paymentLabel(payment)}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden font-semibold tabular-nums sm:inline">
                      {formatPrice(payment.amount)}
                    </span>
                    <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                  </span>
                </div>
              );
            })
          )}
          <Link
            href="/admin/payments"
            className="mt-2 text-sm font-semibold text-primary hover:underline"
          >
            Barcha to&apos;lovlar →
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}
