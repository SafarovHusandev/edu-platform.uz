'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
  TgAvatar,
  TgCallout,
  TgCard,
  TgError,
  TgPage,
  TgPill,
  TgSectionTitle,
  TgSkeletonList,
  TgStat,
  TgStatGrid,
  gradeLabel,
} from '@/components/tg/tg-ui';
import { PAYMENT_PILL, paymentLabel } from '@/components/tg/tg-admin-utils';
import { useAllPayments } from '@/hooks/use-payment';
import { useAdminStats } from '@/hooks/use-stats';
import { useUsers, useVerifyUser } from '@/hooks/use-users';
import { formatNumber, formatPrice, formatTashkentDateTime } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { haptic } from '@/lib/telegram-webapp';
import { useAuthStore } from '@/store/auth-store';

export default function TgAdminHomePage() {
  const user = useAuthStore((s) => s.user);
  const stats = useAdminStats();
  const pendingUsers = useUsers({ page: 1, limit: 3, isVerified: false });
  const payments = useAllPayments({ page: 1, limit: 4 });
  const verify = useVerifyUser();
  const s = stats.data;

  return (
    <TgPage>
      <div className="flex items-center gap-3">
        <TgAvatar name={user?.name} src={user?.avatar} className="bg-primary text-primary-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-muted-foreground">
            {user?.role ? ROLE_LABELS[user.role] : 'Admin'}
          </div>
          <div className="truncate text-[17px] font-bold">{user?.name}</div>
        </div>
      </div>

      <h1 className="font-heading text-lg font-semibold">Platforma ko&apos;rsatkichlari</h1>

      {stats.isError && (
        <TgError title="Ko'rsatkichlarni yuklab bo'lmadi" onRetry={() => stats.refetch()} />
      )}

      <TgStatGrid>
        <TgStat accent label="O'quvchilar" value={formatNumber(s?.students ?? 0)} loading={stats.isLoading} />
        <TgStat label="O'qituvchilar" value={formatNumber(s?.teachers ?? 0)} loading={stats.isLoading} />
        <TgStat label="Faol Premium" value={formatNumber(s?.activePremium ?? 0)} loading={stats.isLoading} />
      </TgStatGrid>
      <TgStat
        label="To'lovlar · bu oy"
        value={formatPrice(s?.paymentsThisMonth.total ?? 0).replace('Bepul', "0 so'm")}
        hint={s ? `${s.paymentsThisMonth.count} ta muvaffaqiyatli to'lov` : undefined}
        loading={stats.isLoading}
        href="/tg/admin/payments"
      />

      {(s?.pendingUsers ?? 0) > 0 && (
        <TgCallout
          href="/tg/admin/users?tab=pending"
          badge={s!.pendingUsers > 99 ? '99+' : s!.pendingUsers}
          title="Tasdiqlash kutmoqda"
          description="Yangi ro'yxatdan o'tgan foydalanuvchilar"
        />
      )}
      {(s?.pendingRedemptions ?? 0) > 0 && (
        <TgCallout
          tone="primary"
          href="/tg/admin/requests"
          badge={s!.pendingRedemptions > 99 ? '99+' : s!.pendingRedemptions}
          title="Mukofot so'rovlari"
          description="O'quvchilar sovg'a so'ramoqda"
        />
      )}

      <TgSectionTitle href="/tg/admin/users?tab=pending">Tasdiqlash navbati</TgSectionTitle>
      {pendingUsers.isLoading ? (
        <TgSkeletonList count={2} height={60} />
      ) : pendingUsers.isError ? (
        <TgError onRetry={() => pendingUsers.refetch()} />
      ) : (pendingUsers.data?.items.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          Navbat bo&apos;sh 🎉
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {pendingUsers.data?.items.map((u) => (
            <div key={u._id} className="flex items-center gap-3 border-t border-border px-3.5 py-3 first:border-t-0">
              <Link href={`/tg/admin/users/${u._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <TgAvatar name={u.name} src={u.avatar} size={38} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{u.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[ROLE_LABELS[u.role], gradeLabel(u.grade), u.createdAt && formatTashkentDateTime(u.createdAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                disabled={verify.isPending}
                onClick={() =>
                  verify.mutate(u._id, {
                    onSuccess: () => haptic('success'),
                    onError: () => haptic('error'),
                  })
                }
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-primary px-3 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
              >
                {verify.isPending && verify.variables === u._id && <Loader2 className="size-3.5 animate-spin" />}
                Tasdiqlash
              </button>
            </div>
          ))}
        </div>
      )}

      <TgSectionTitle href="/tg/admin/payments">So&apos;nggi to&apos;lovlar</TgSectionTitle>
      {payments.isLoading ? (
        <TgSkeletonList count={3} height={56} />
      ) : payments.isError ? (
        <TgError onRetry={() => payments.refetch()} />
      ) : (payments.data?.items.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          Hali to&apos;lovlar yo&apos;q
        </p>
      ) : (
        payments.data?.items.map((p) => {
          const pill = PAYMENT_PILL[p.status];
          return (
            <TgCard key={p.invoiceId} className="flex-row items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {p.user?.name ?? '—'} · {paymentLabel(p)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatPrice(p.amount)} · {formatTashkentDateTime(p.paymentTime ?? p.createdAt)}
                </span>
              </span>
              <TgPill tone={pill.tone}>{pill.label}</TgPill>
            </TgCard>
          );
        })
      )}
    </TgPage>
  );
}
