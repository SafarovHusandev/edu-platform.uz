'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { TgAvatar, TgHeader, TgLinkRow, TgPage } from '@/components/tg/tg-ui';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';
import { useUpdateProfile } from '@/hooks/use-users';
import { formatDate } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { haptic } from '@/lib/telegram-webapp';
import { useAuthStore } from '@/store/auth-store';

export function formatPhone(phone?: string | null) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  const m = d.match(/^(998)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : `+${d}`;
}

export interface TgProfileLink {
  href: string;
  label: string;
  trailing?: React.ReactNode;
}

export function TgProfile({ links, showTarif }: { links: TgProfileLink[]; showTarif?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadNotificationsCount();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');

  if (!user) return null;
  const premium = user.tarif === 'premium';
  const nameChanged = name.trim().length >= 3 && name.trim() !== user.name;

  return (
    <TgPage>
      <TgHeader title="Profil" />
      <div className="flex items-center gap-3.5">
        <TgAvatar name={user.name} src={user.avatar} size={56} />
        <div className="min-w-0">
          <div className="truncate text-lg font-bold">{user.name}</div>
          <div className="truncate text-[13px] text-muted-foreground">
            {formatPhone(user.phone)} · {ROLE_LABELS[user.role]}
          </div>
        </div>
      </div>

      {showTarif && (
        <section
          className={
            premium
              ? 'flex flex-col gap-1 rounded-[18px] bg-gold-soft px-4 py-3.5'
              : 'flex flex-col gap-1 rounded-[18px] border border-border bg-card px-4 py-3.5'
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">Tarif: {premium ? 'Premium' : 'Standart'}</span>
            {premium && user.premiumExpiresAt && (
              <span className="text-[13px] text-gold-foreground">
                {formatDate(user.premiumExpiresAt)} gacha
              </span>
            )}
          </div>
          <span className="text-[13px] text-muted-foreground">
            {premium
              ? "Testlaringizda o'quvchilarga kengaytirilgan urinish limiti."
              : "Standart tarifda testlaringizda o'quvchilarga 1 ta urinish beriladi."}
          </span>
          {!premium && (
            <Link href="/premium" className="mt-1 text-sm font-semibold text-primary">
              Premium haqida →
            </Link>
          )}
        </section>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tg-name" className="text-sm font-semibold">
          Ism familiya
        </label>
        <div className="flex gap-2">
          <input
            id="tg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={!nameChanged || updateProfile.isPending}
            onClick={() =>
              updateProfile.mutate(
                { name: name.trim() },
                { onSuccess: () => haptic('success') }
              )
            }
            className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
            Saqlash
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-success-soft px-4 py-3 text-[13px] text-secondary-foreground">
        <strong className="text-success">Telegram orqali kirgansiz.</strong> Bildirishnomalar shu botga
        keladi.
      </section>

      <nav aria-label="Bo'limlar" className="overflow-hidden rounded-2xl border border-border bg-card">
        <TgLinkRow
          href="/tg/notifications"
          trailing={(unread.data ?? 0) > 0 ? `${unread.data} yangi` : undefined}
        >
          Bildirishnomalar
        </TgLinkRow>
        {links.map((link) => (
          <TgLinkRow key={link.href} href={link.href} trailing={link.trailing}>
            {link.label}
          </TgLinkRow>
        ))}
        <TgLinkRow href="/profile">Parolni o&apos;zgartirish</TgLinkRow>
      </nav>

      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-muted-foreground"
      >
        To&apos;liq web versiyani ochish <ExternalLink className="size-3.5" />
      </Link>
    </TgPage>
  );
}
