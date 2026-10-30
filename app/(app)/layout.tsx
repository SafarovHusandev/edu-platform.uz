'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { AppTopbar } from '@/components/layout/app-topbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MOBILE_NAV } from '@/lib/roles';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/login');
    }
  }, [isHydrated, user, router]);

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasBottomNav = !!MOBILE_NAV[user.role];

  return (
    <div className="flex h-svh bg-background">
      <aside
        className={cn(
          'hidden w-64 shrink-0 border-r lg:block',
          user.role === 'admin' || user.role === 'superadmin'
            ? 'border-admin bg-admin'
            : 'border-sidebar-border bg-sidebar'
        )}
      >
        <SidebarNav role={user.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar role={user.role} />
        <main
          className={cn(
            'scrollbar-blue flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7',
            hasBottomNav && 'pb-24 lg:pb-7'
          )}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav role={user.role} />
    </div>
  );
}
