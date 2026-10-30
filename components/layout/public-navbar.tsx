'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import { useAuthStore } from '@/store/auth-store';
import { ROLE_HOME } from '@/lib/roles';
import { cn } from '@/lib/utils';

// Ochiq sahifalar sarlavhasi (edu-platform-dizayn: PHeader)
const LINKS = [
  { label: 'Kurslar', href: '/courses' },
  { label: 'Kitoblar', href: '/books' },
  { label: 'Mukofotlar', href: '/rewards' },
  { label: 'Premium', href: '/premium' },
  { label: 'Sertifikat tekshirish', href: '/certificates/verify' },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-300 items-center gap-6 px-4 py-3.5 sm:px-6">
        <BrandMark className="[&>span:last-child]:text-lg" />

        <nav aria-label="Asosiy" className="hidden flex-1 flex-wrap gap-1.5 text-[15px] lg:flex">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-[10px] px-3 py-2 font-semibold whitespace-nowrap transition-colors',
                  active
                    ? 'bg-primary-soft text-primary'
                    : 'text-secondary-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          {user ? (
            <>
              <Button
                size="lg"
                className="hidden sm:flex"
                render={<Link href={ROLE_HOME[user.role]} />}
              >
                <LayoutDashboard className="size-4" /> Boshqaruv paneli
              </Button>
              <UserMenu />
            </>
          ) : (
            <div className="hidden gap-2.5 sm:flex">
              <Button size="lg" variant="outline" render={<Link href="/login" />}>
                Kirish
              </Button>
              <Button size="lg" render={<Link href="/register" />}>
                Ro&apos;yxatdan o&apos;tish
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menyu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-card px-4 py-3 lg:hidden">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-xl px-3 py-2.5 font-semibold',
                  active ? 'bg-primary-soft text-primary' : 'hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/donate"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2.5 font-semibold text-gold-foreground hover:bg-gold-soft"
          >
            Homiylik
          </Link>
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            {user ? (
              <Button
                className="flex-1"
                render={<Link href={ROLE_HOME[user.role]} onClick={() => setOpen(false)} />}
              >
                <LayoutDashboard className="size-4" /> Boshqaruv paneli
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" render={<Link href="/login" />}>
                  Kirish
                </Button>
                <Button className="flex-1" render={<Link href="/register" />}>
                  Ro&apos;yxatdan o&apos;tish
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
