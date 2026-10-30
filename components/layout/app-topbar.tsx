'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Crown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BrandMark } from '@/components/layout/brand-mark';
import { useNavBadges } from '@/components/layout/use-nav-badges';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useAuthStore } from '@/store/auth-store';
import { ROLE_HOME, findActiveNavItem } from '@/lib/roles';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

function StudentStatus() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const isPremium = user.tarif === 'premium';

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link
        href="/student/rewards"
        className="flex h-10 items-center gap-1.5 rounded-xl bg-gold-soft px-3 font-heading text-sm font-bold tabular-nums text-gold-foreground transition-colors hover:bg-gold/25"
        title="Olmos balansi"
      >
        <DiamondIcon className="size-4" /> {formatNumber(user.diamonds ?? 0)}
      </Link>
      <Link
        href="/premium"
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors',
          isPremium
            ? 'bg-gold text-admin hover:bg-gold/90'
            : 'border border-input bg-card text-foreground hover:bg-muted'
        )}
      >
        <Crown className="size-4" /> {isPremium ? 'Premium' : 'Standart'}
      </Link>
    </div>
  );
}

export function AppTopbar({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const badges = useNavBadges(role);
  const activeItem = findActiveNavItem(role, pathname);
  const isAdmin = role === 'admin' || role === 'superadmin';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Menyu" />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn('w-72 border-r-0 p-0', isAdmin ? 'bg-admin' : 'bg-sidebar')}
        >
          <SheetTitle className="sr-only">Menyu</SheetTitle>
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <BrandMark className="lg:hidden" href={ROLE_HOME[role]} label="Edu Platform" />

      <div className="hidden min-w-0 flex-1 items-center gap-2.5 lg:flex">
        {activeItem && (
          <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <activeItem.icon className="size-4.5" />
            </span>
            <span className="truncate text-[15px] font-semibold">{activeItem.label}</span>
          </>
        )}
      </div>
      <div className="flex-1 lg:hidden" />

      {role === 'student' && <StudentStatus />}

      <Button
        variant="ghost"
        size="icon-lg"
        className="relative"
        render={<Link href="/notifications" />}
        aria-label={
          badges.notifications > 0
            ? `Bildirishnomalar, ${badges.notifications} ta yangi`
            : 'Bildirishnomalar'
        }
      >
        <Bell className="size-5" />
        {badges.notifications > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
            {badges.notifications > 9 ? '9+' : badges.notifications}
          </span>
        )}
      </Button>
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
