'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavBadges } from '@/components/layout/use-nav-badges';
import { MOBILE_NAV, isNavItemActive } from '@/lib/roles';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

// O'quvchi va o'qituvchi uchun mobil pastki menyu (lg dan kichik ekranlarda)
export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const badges = useNavBadges(role);
  const items = MOBILE_NAV[role];
  if (!items) return null;

  return (
    <nav
      aria-label="Pastki menyu"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur-md lg:hidden"
    >
      {items.map((item) => {
        const active = isNavItemActive(item, pathname);
        const count = item.badge ? badges[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 py-1.5 text-[11px]',
              active ? 'font-bold text-primary' : 'font-semibold text-muted-foreground'
            )}
          >
            <span className="relative">
              <item.icon className="size-5.5" />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
