'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { NAV_ITEMS, COMMON_NAV_ITEMS, ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/types';
import { cn } from '@/lib/utils';

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
  const items = NAV_ITEMS[role] ?? [];

  function isActive(href: string) {
    return href === `/${role}` ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {ROLE_LABELS[role]} paneli
      </p>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-md font-medium text-muted-foreground transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              active && 'bg-sidebar-primary/10 text-sidebar-primary'
            )}
          >
            <item.icon className="size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight
              className={cn(
                'size-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-sidebar-accent-foreground',
                active && 'text-sidebar-primary'
              )}
            />
          </Link>
        );
      })}
      <p className="mt-4 px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Umumiy
      </p>
      {COMMON_NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-md font-medium text-muted-foreground transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              active && 'bg-sidebar-primary/10 text-sidebar-primary'
            )}
          >
            <item.icon className="size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight
              className={cn(
                'size-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-sidebar-accent-foreground',
                active && 'text-sidebar-primary'
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
