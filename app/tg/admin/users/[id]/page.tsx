'use client';

import { use, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatPhone } from '@/components/tg/tg-profile';
import { TgMainButton } from '@/components/tg/tg-main-button';
import {
  TgAvatar,
  TgError,
  TgPage,
  TgPill,
  TgSkeletonList,
  TgWebHint,
  gradeLabel,
} from '@/components/tg/tg-ui';
import { useToggleUserBlock, useUser, useVerifyUser } from '@/hooks/use-users';
import { formatDate, formatNumber, formatPrice, formatTashkentDateTime } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { haptic } from '@/lib/telegram-webapp';
import { useAuthStore } from '@/store/auth-store';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-semibold">{children}</span>
    </div>
  );
}

export default function TgAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const me = useAuthStore((s) => s.user);
  const user = useUser(id);
  const verify = useVerifyUser();
  const toggleBlock = useToggleUserBlock();
  const [confirmBlock, setConfirmBlock] = useState(false);

  if (user.isLoading) {
    return (
      <TgPage>
        <TgSkeletonList count={3} height={90} />
      </TgPage>
    );
  }
  if (user.isError || !user.data) {
    return (
      <TgPage>
        <TgError onRetry={() => user.refetch()} />
      </TgPage>
    );
  }

  const u = user.data;
  const isSelf = u._id === me?._id;
  // Admin superadmin'ni bloklay olmaydi — backend ham rad etadi
  const canBlock = !isSelf && !(u.role === 'superadmin' && me?.role !== 'superadmin');

  return (
    <TgPage>
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <TgAvatar name={u.name} src={u.avatar} size={72} />
        <div className="text-lg font-bold wrap-break-word">{u.name}</div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <TgPill tone="primary">{ROLE_LABELS[u.role]}</TgPill>
          {u.tarif === 'premium' && <TgPill tone="warning">Premium</TgPill>}
          {!u.isVerified && <TgPill tone="warning">Tasdiqlanmagan</TgPill>}
          {u.isBlocked && <TgPill tone="danger">Bloklangan</TgPill>}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Row label="Telefon">
          <a href={`tel:+${u.phone}`} className="text-primary">
            {formatPhone(u.phone)}
          </a>
        </Row>
        {gradeLabel(u.grade) && <Row label="Sinf">{gradeLabel(u.grade)}</Row>}
        <Row label="Telegram">
          {u.telegramUsername ? `@${u.telegramUsername}` : u.telegramId ? 'Ulangan' : '—'}
        </Row>
        {u.role === 'student' && <Row label="Olmos">◆ {formatNumber(u.diamonds ?? 0)}</Row>}
        {(u.balance ?? 0) > 0 && <Row label="Balans">{formatPrice(u.balance ?? 0)}</Row>}
        {u.tarif === 'premium' && u.premiumExpiresAt && (
          <Row label="Premium muddati">{formatDate(u.premiumExpiresAt)} gacha</Row>
        )}
        {u.createdAt && <Row label="Ro'yxatdan o'tgan">{formatTashkentDateTime(u.createdAt)}</Row>}
        <Row label="Oxirgi kirish">{u.lastLogin ? formatTashkentDateTime(u.lastLogin) : '—'}</Row>
      </div>

      {u.isVerified && canBlock && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5">
          {confirmBlock ? (
            <>
              <span className="text-sm">
                {u.isBlocked
                  ? `${u.name} blokdan chiqarilsinmi?`
                  : `${u.name} bloklansinmi? U tizimga kira olmaydi.`}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmBlock(false)}
                  className="h-11 rounded-xl border border-border text-sm font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={toggleBlock.isPending}
                  onClick={() =>
                    toggleBlock.mutate(
                      { id: u._id, isBlocked: !u.isBlocked },
                      {
                        onSuccess: () => {
                          haptic('success');
                          setConfirmBlock(false);
                        },
                      }
                    )
                  }
                  className={
                    u.isBlocked
                      ? 'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-success text-sm font-bold text-success-foreground'
                      : 'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-destructive text-sm font-bold text-white'
                  }
                >
                  {toggleBlock.isPending && <Loader2 className="size-4 animate-spin" />}
                  {u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmBlock(true)}
              className={
                u.isBlocked
                  ? 'h-11 rounded-xl border border-success/40 text-sm font-semibold text-success'
                  : 'h-11 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive'
              }
            >
              {u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
            </button>
          )}
        </div>
      )}

      <TgWebHint href={`/admin/users/${u._id}`}>
        Faoliyat tarixi, rol/tarifni tahrirlash va parolni tiklash —
      </TgWebHint>

      <TgMainButton
        hidden={u.isVerified}
        text="Tasdiqlash"
        loading={verify.isPending}
        onClick={() => verify.mutate(u._id, { onSuccess: () => haptic('success') })}
      />
    </TgPage>
  );
}
