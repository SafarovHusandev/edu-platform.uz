'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-mark';
import { useNavBadges } from '@/components/layout/use-nav-badges';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useLogout } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { NAV_GROUPS, ROLE_LABELS, isNavItemActive } from '@/lib/roles';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

const BRAND_LABEL: Record<Role, string> = {
  student: 'Edu Platform',
  teacher: "O'qituvchi",
  admin: 'Admin',
  superadmin: 'Admin',
};

// O'quvchi menyusining tepasidagi olmos balansi kartasi
function DiamondBalanceCard() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const isPremium = user.tarif === 'premium';

  return (
    <Link
      href="/student/rewards"
      className="mx-1 mb-3 flex flex-col gap-1 rounded-2xl bg-primary p-3.5 text-primary-foreground transition-opacity hover:opacity-95"
    >
      <span className="text-xs text-primary-foreground/75">Olmos balansi</span>
      <span className="flex items-center gap-1.5 font-heading text-xl font-bold tabular-nums">
        <DiamondIcon className="size-5" /> {formatNumber(user.diamonds ?? 0)}
      </span>
      <span className="text-xs text-primary-foreground/75">
        {isPremium
          ? `Premium${user.premiumExpiresAt ? ` · ${formatDate(user.premiumExpiresAt)} gacha` : ''}`
          : 'Standart tarif'}
      </span>
    </Link>
  );
}

function CountBadge({ value, tone }: { value: number; tone: 'danger' | 'gold' }) {
  if (value <= 0) return null;
  return (
    <span
      className={cn(
        'min-w-6 rounded-full px-2 py-px text-center text-xs font-bold tabular-nums',
        tone === 'gold' ? 'bg-gold text-admin' : 'bg-destructive text-white'
      )}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

export function SidebarNav({
  role,
  onNavigate,
  className,
}: {
  role: Role;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const badges = useNavBadges(role);
  const isAdmin = role === 'admin' || role === 'superadmin';

  return (
    <nav
      aria-label={`${ROLE_LABELS[role]} menyusi`}
      className={cn(
        'flex h-full flex-col gap-1 px-3.5 py-5',
        isAdmin ? 'bg-admin text-admin-foreground' : 'bg-sidebar text-sidebar-foreground',
        className
      )}
    >
      <BrandMark
        label={BRAND_LABEL[role]}
        href={`/${role === 'superadmin' ? 'admin' : role}`}
        variant={isAdmin ? 'admin' : 'default'}
        className="px-2.5 pb-4"
      />

      {role === 'student' && <DiamondBalanceCard />}

      <div className="scrollbar-blue -mx-1 flex-1 overflow-y-auto px-1">
        {NAV_GROUPS[role].map((group, groupIndex) => (
          <div key={groupIndex} className={cn('flex flex-col gap-0.5', groupIndex > 0 && 'mt-4')}>
            {group.label && (
              <p
                className={cn(
                  'px-3 pb-1 text-xs font-semibold',
                  isAdmin ? 'text-admin-muted/70' : 'text-muted-foreground'
                )}
              >
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isNavItemActive(item, pathname);
              const count = item.badge ? badges[item.badge] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                    isAdmin
                      ? active
                        ? 'bg-admin-accent font-bold text-admin-foreground'
                        : 'font-medium text-admin-muted hover:bg-admin-accent/60 hover:text-admin-foreground'
                      : active
                        ? 'bg-sidebar-accent font-bold text-sidebar-accent-foreground'
                        : 'font-medium hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="size-4.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <CountBadge
                    value={count}
                    tone={isAdmin && item.badge === 'pendingUsers' ? 'gold' : 'danger'}
                  />
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {isAdmin && user && (
        <div className="mt-3 rounded-xl bg-admin-accent p-3 text-[13px] leading-relaxed text-admin-muted">
          Rol: <strong className="text-gold">{role}</strong>
          <br />
          <span className="text-admin-foreground">{user.name}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => logout.mutate()}
        className={cn(
          'mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors',
          isAdmin
            ? 'text-admin-muted hover:bg-admin-accent hover:text-admin-foreground'
            : 'text-destructive hover:bg-destructive-soft'
        )}
      >
        <LogOut className="size-4.5 shrink-0" />
        Chiqish
      </button>
    </nav>
  );
}
