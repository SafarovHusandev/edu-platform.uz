'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, BookOpen, HeartHandshake, Home, Library, Menu, Trophy, X } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Bosh sahifa', href: '/', icon: Home },
  { label: 'Kurslar', href: '/courses', icon: BookOpen },
  { label: 'Kutubxona', href: '/books', icon: Library },
  { label: 'Reyting', href: '/leaderboard', icon: Trophy },
  { label: 'Sertifikat tekshirish', href: '/certificates/verify', icon: Award },
  { label: 'Homiylik', href: '/donate', icon: HeartHandshake },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {/* <link.icon className="size-4" /> */}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" render={<Link href="/login" />}>
                Kirish
              </Button>
              <Button className="shadow-sm" render={<Link href="/register" />}>
                Ro&apos;yxatdan o&apos;tish
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menyu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              const isDonate = link.href === '/donate';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[16px]! font-medium transition-colors',
                    active
                      ? isDonate
                        ? 'bg-gold/15 text-gold-foreground'
                        : 'bg-primary/10 text-primary'
                      : isDonate
                        ? 'text-gold-foreground/80 hover:bg-gold/10 hover:text-gold-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <link.icon className="size-4.5" />
                  {link.label}
                </Link>
              );
            })}
            {!user && (
              <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" className="flex-1" render={<Link href="/login" />}>
                  Kirish
                </Button>
                <Button className="flex-1" render={<Link href="/register" />}>
                  Ro&apos;yxatdan o&apos;tish
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
