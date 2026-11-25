'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, Users } from 'lucide-react';
import {
  TgAvatar,
  TgChips,
  TgEmpty,
  TgError,
  TgHeader,
  TgPage,
  TgPill,
  TgSegment,
  TgSkeletonList,
  gradeLabel,
} from '@/components/tg/tg-ui';
import { useAdminStats } from '@/hooks/use-stats';
import { useUsers, useVerifyUser } from '@/hooks/use-users';
import { formatTashkentDateTime } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { haptic } from '@/lib/telegram-webapp';
import type { Role } from '@/types';

type Tab = 'pending' | 'all' | 'blocked';
type RoleFilter = 'all' | Role;

const PAGE_SIZE = 20;

export default function TgAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: initialTab } = use(searchParams);
  const [tab, setTab] = useState<Tab>(
    initialTab === 'pending' || initialTab === 'blocked' ? initialTab : 'all'
  );
  const [role, setRole] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const stats = useAdminStats();
  const verify = useVerifyUser();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const users = useUsers({
    page: 1,
    limit,
    search: debounced || undefined,
    isVerified: tab === 'pending' ? false : undefined,
    isBlocked: tab === 'blocked' ? true : undefined,
    role: role === 'all' ? undefined : role,
  });
  const items = users.data?.items ?? [];
  const pendingCount = stats.data?.pendingUsers ?? 0;

  return (
    <TgPage>
      <TgHeader title="Foydalanuvchilar" />

      <TgSegment
        value={tab}
        onChange={(v) => {
          setTab(v);
          setLimit(PAGE_SIZE);
        }}
        options={[
          { value: 'pending', label: pendingCount > 0 ? `Kutilmoqda · ${pendingCount}` : 'Kutilmoqda' },
          { value: 'all', label: 'Barchasi' },
          { value: 'blocked', label: 'Bloklangan' },
        ]}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon..."
          aria-label="Qidirish"
          className="h-11 w-full rounded-xl border border-input bg-card pr-3 pl-10 text-[15px] outline-none focus:border-primary"
        />
        {users.isFetching && !users.isLoading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <TgChips
        value={role}
        onChange={(v) => {
          setRole(v);
          setLimit(PAGE_SIZE);
        }}
        options={[
          { value: 'all', label: 'Barcha rollar' },
          { value: 'student', label: "O'quvchi" },
          { value: 'teacher', label: "O'qituvchi" },
          { value: 'admin', label: 'Admin' },
        ]}
      />

      {users.isLoading ? (
        <TgSkeletonList count={6} height={62} />
      ) : users.isError ? (
        <TgError onRetry={() => users.refetch()} />
      ) : items.length === 0 ? (
        <TgEmpty
          icon={Users}
          title={tab === 'pending' ? 'Tasdiqlash navbati bo\'sh' : 'Foydalanuvchi topilmadi'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((u) => (
            <div key={u._id} className="flex items-center gap-3 border-t border-border px-3.5 py-2.5 first:border-t-0">
              <Link href={`/tg/admin/users/${u._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <TgAvatar name={u.name} src={u.avatar} size={38} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{u.name}</span>
                    {u.tarif === 'premium' && <TgPill tone="warning">PRO</TgPill>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[
                      ROLE_LABELS[u.role],
                      gradeLabel(u.grade),
                      tab === 'pending' && u.createdAt ? formatTashkentDateTime(u.createdAt) : `+${u.phone}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </Link>
              {!u.isVerified ? (
                <button
                  type="button"
                  disabled={verify.isPending}
                  onClick={() => verify.mutate(u._id, { onSuccess: () => haptic('success') })}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-primary px-3 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
                >
                  {verify.isPending && verify.variables === u._id && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  Tasdiqlash
                </button>
              ) : u.isBlocked ? (
                <TgPill tone="danger">Bloklangan</TgPill>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {(users.data?.total ?? 0) > items.length && (
        <button
          type="button"
          disabled={users.isFetching}
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="h-11 rounded-xl border border-border bg-card text-sm font-semibold disabled:opacity-50"
        >
          Yana yuklash ({items.length} / {users.data?.total})
        </button>
      )}
    </TgPage>
  );
}
