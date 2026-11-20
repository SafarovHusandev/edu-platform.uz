'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, LayoutDashboard, Menu, X } from 'lucide-react';
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

// Jonli o'yin: kompyuter xonasida PIN bilan kirish uchun (/live ochiq sahifa).
// Oddiy havolalardan ajralib turishi uchun alohida — ramkali tugma, "jonli" nuqtasi bilan.
function LiveGameLink({
  compact = false,
  className,
  onClick,
}: {
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/live"
      onClick={onClick}
      aria-label={compact ? "Jonli o'yinga kirish" : undefined}
      className={cn(
        'group inline-flex items-center gap-2 rounded-xl border-[1.5px] border-primary/40 bg-primary-soft font-semibold whitespace-nowrap text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground',
        compact ? 'size-10 justify-center' : 'h-10 px-3',
        className
      )}
    >
      <span className="relative"></span>
      {!compact && "Jonli o'yin"}
    </Link>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-300 items-center gap-6 px-4 py-3.5 sm:px-6">
        <BrandMark className="[&>span:last-child]:text-lg" />

        <nav aria-label="Asosiy" className="hidden min-w-0 flex-1 gap-1 text-[15px] lg:flex">
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
          <LiveGameLink className="hidden xl:inline-flex" />
          <LiveGameLink compact className="xl:hidden" />
          <ThemeToggle />
          {user ? (
            <>
              <Button
                size="lg"
                className="hidden sm:flex"
                aria-label="Boshqaruv paneli"
                render={<Link href={ROLE_HOME[user.role]} />}
              >
                <LayoutDashboard className="size-4" />
                <span className="hidden xl:inline">Boshqaruv paneli</span>
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
          <LiveGameLink className="mt-1 justify-center" onClick={() => setOpen(false)} />

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
