'use client';

import Link from 'next/link';
import {
  Bell,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';
import { ROLE_HOME, ROLE_LABELS } from '@/lib/roles';
import { resolveAssetUrl } from '@/lib/config';
import { daysUntil, formatNumber, formatPrice, initials } from '@/lib/format';
import { cn } from '@/lib/utils';

function MenuLink({
  href,
  icon: Icon,
  label,
  hint,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  count?: number;
}) {
  return (
    <DropdownMenuItem
      render={<Link href={href} />}
      className="gap-3 rounded-xl px-2 py-2 focus:bg-muted"
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-muted text-secondary-foreground group-focus/dropdown-menu-item:bg-primary-soft group-focus/dropdown-menu-item:text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      {count ? (
        <span className="rounded-full bg-destructive px-1.5 text-[11px] leading-5 font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : (
        <ChevronRight className="size-4 text-muted-foreground/60" />
      )}
    </DropdownMenuItem>
  );
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: unread } = useUnreadNotificationsCount();

  if (!user) return null;

  const isPremium = user.tarif === 'premium';
  const isStudent = user.role === 'student';
  const premiumDays = isPremium && user.premiumExpiresAt ? daysUntil(user.premiumExpiresAt) : null;
  const grade =
    isStudent && user.grade?.number ? `${user.grade.number}${user.grade.letter ?? ''}-sinf` : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Foydalanuvchi menyusi"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar
          className={cn(isPremium && 'ring-2 ring-gold ring-offset-2 ring-offset-background')}
        >
          <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
          <AvatarFallback className="bg-primary-soft font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
          {isPremium && (
            <AvatarBadge className="bg-gold text-gold-foreground">
              <Crown />
            </AvatarBadge>
          )}
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-[18px] border border-border p-2 shadow-xl ring-0"
      >
        {/* Profil kartasi */}
        <div className="flex items-center gap-3 rounded-[14px] bg-primary-soft/60 p-3">
          <Avatar className="size-11">
            <AvatarImage src={resolveAssetUrl(user.avatar)} alt="" />
            <AvatarFallback className="bg-primary font-heading text-sm font-bold text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-foreground">{user.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                {ROLE_LABELS[user.role]}
                {grade && ` · ${grade}`}
              </span>
              {isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-admin">
                  <Crown className="size-3" /> Premium
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          <MenuLink href="/profile" icon={UserIcon} label="Profil" hint="Ism, sinf, Telegram" />
        </div>

        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logout.mutate()}
          className="gap-3 rounded-xl px-2 py-2 font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-destructive-soft">
            <LogOut className="size-4" />
          </span>
          Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
