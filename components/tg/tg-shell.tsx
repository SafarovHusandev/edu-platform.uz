'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  Gift,
  Home,
  Loader2,
  LogIn,
  PenLine,
  Send,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useTelegramWebAppLogin } from '@/hooks/use-auth';
import { usePendingReviewsCount } from '@/hooks/use-quizzes';
import { useAdminStats } from '@/hooks/use-stats';
import { TELEGRAM_BOT_USERNAME } from '@/lib/config';
import { getTokenCookie } from '@/lib/cookies';
import {
  getTelegramInitData,
  getTelegramWebApp,
  haptic,
  openTelegramLink,
  setTelegramChromeColor,
  supportsNativeButtons,
} from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { TG_MINI_FLAG } from '@/components/tg/tg-web-back-button';
import type { Role } from '@/types';

const subscribeNoop = () => () => {};

type TgArea = 'teacher' | 'admin';

interface TgNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'grading' | 'pendingUsers' | 'pendingRedemptions';
}

export const TG_NAV: Record<TgArea, TgNavItem[]> = {
  teacher: [
    { href: '/tg/teacher', label: 'Asosiy', icon: Home },
    { href: '/tg/teacher/quizzes', label: 'Testlar', icon: ClipboardList },
    { href: '/tg/teacher/grading', label: 'Baholash', icon: PenLine, badge: 'grading' },
    { href: '/tg/teacher/courses', label: 'Kurslar', icon: BookOpen },
    { href: '/tg/teacher/profile', label: 'Profil', icon: UserRound },
  ],
  admin: [
    { href: '/tg/admin', label: 'Asosiy', icon: Home },
    { href: '/tg/admin/users', label: 'Foydalanuvchi', icon: Users, badge: 'pendingUsers' },
    { href: '/tg/admin/requests', label: "So'rovlar", icon: Gift, badge: 'pendingRedemptions' },
    { href: '/tg/admin/payments', label: "To'lovlar", icon: CreditCard },
    { href: '/tg/admin/profile', label: 'Profil', icon: UserRound },
  ],
};

function areaOf(role: Role | undefined): TgArea | null {
  if (role === 'teacher') return 'teacher';
  if (role === 'admin' || role === 'superadmin') return 'admin';
  return null;
}

export function tgHome(role: Role | undefined) {
  const area = areaOf(role);
  return area ? `/tg/${area}` : '/tg';
}

// Telegram sarlavhasi/foni bilan ilova fonini moslash (globals.css --background)
const CHROME_COLORS = { light: '#F5F6FA', dark: '#10131B' } as const;

function useTelegramTheme() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp?.initData) return;
    const apply = () => {
      const scheme = webApp.colorScheme === 'dark' ? 'dark' : 'light';
      setTheme(scheme);
      setTelegramChromeColor(CHROME_COLORS[scheme]);
    };
    apply();
    webApp.onEvent?.('themeChanged', apply);
    return () => webApp.offEvent?.('themeChanged', apply);
  }, [setTheme]);
}

// Tab ildizlarida "Yopish" (Telegram'ning o'zi ko'rsatadi), ichki sahifalarda — BackButton
function useTelegramBackButton(isRoot: boolean, fallbackHref: string) {
  const router = useRouter();
  const native = useSyncExternalStore(subscribeNoop, supportsNativeButtons, () => false);

  useEffect(() => {
    if (!native) return;
    const back = getTelegramWebApp()?.BackButton;
    if (!back) return;
    if (isRoot) {
      back.hide();
      return;
    }
    const handler = () => {
      haptic('light');
      if (window.history.length > 1) router.back();
      else router.replace(fallbackHref);
    };
    back.onClick(handler);
    back.show();
    return () => {
      back.offClick(handler);
      back.hide();
    };
  }, [native, isRoot, fallbackHref, router]);

  return native;
}

function BottomNav({ area }: { area: TgArea }) {
  const pathname = usePathname();
  const pendingReviews = usePendingReviewsCount({ enabled: area === 'teacher' });
  const adminStats = useAdminStats({ enabled: area === 'admin' });
  const badges = {
    grading: pendingReviews.data ?? 0,
    pendingUsers: adminStats.data?.pendingUsers ?? 0,
    pendingRedemptions: adminStats.data?.pendingRedemptions ?? 0,
  };

  return (
    <>
      <div aria-hidden className="h-[76px]" />
      <nav
        aria-label="Pastki menyu"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]"
      >
        {TG_NAV[area].map((item) => {
          const active = pathname === item.href;
          const count = item.badge ? badges[item.badge] : 0;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => !active && haptic('selection')}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 py-1.5 text-[11px]',
                active ? 'font-bold text-primary' : 'font-semibold text-muted-foreground'
              )}
            >
              <span className="relative block">
                <Icon className="size-[22px]" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <Logo />
      {children}
    </div>
  );
}

function NotInTelegram() {
  return (
    <CenterScreen>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Send className="size-7" />
      </span>
      <h1 className="font-heading text-xl font-semibold">Mini ilovani Telegram&apos;da oching</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Bu sahifa o&apos;qituvchi va adminlar uchun Telegram mini ilovasi. Botni oching va pastdagi
        «Ilova» tugmasini bosing yoki saytga login qiling.
      </p>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          onClick={() => openTelegramLink(`https://t.me/${TELEGRAM_BOT_USERNAME}`)}
        >
          <Send className="size-4" /> Botni ochish
        </Button>
        <Button size="lg" variant="outline" className="w-full" render={<Link href="/login?redirect=/tg" />}>
          <LogIn className="size-4" /> Saytga kirish
        </Button>
      </div>
    </CenterScreen>
  );
}

function StudentNotSupported() {
  return (
    <CenterScreen>
      <h1 className="font-heading text-xl font-semibold">Hozircha faqat o&apos;qituvchilar uchun</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Mini ilova hozir o&apos;qituvchi va adminlar uchun ishlaydi. O&apos;quvchi kabineti saytda
        to&apos;liq mavjud.
      </p>
      <Button size="lg" className="w-full max-w-sm" render={<Link href="/dashboard" />}>
        Kabinetni ochish
      </Button>
    </CenterScreen>
  );
}

// Sessiya yo'qolgan (401 dan keyin tozalangan) — initData bilan qayta kirish
function SessionLost({ initData }: { initData: string }) {
  const login = useTelegramWebAppLogin();
  return (
    <CenterScreen>
      <h1 className="font-heading text-xl font-semibold">Sessiya tugadi</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {login.isError
          ? (login.error as Error)?.message || 'Kirib bo\'lmadi. Ilovani yopib, qayta oching.'
          : 'Davom etish uchun Telegram orqali qayta kiring.'}
      </p>
      <Button
        size="lg"
        className="w-full max-w-sm"
        disabled={login.isPending}
        onClick={() => login.mutate(initData)}
      >
        {login.isPending && <Loader2 className="size-4 animate-spin" />}
        Qayta kirish
      </Button>
    </CenterScreen>
  );
}

export function TgShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const initData = useSyncExternalStore(subscribeNoop, getTelegramInitData, () => '');
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const firstRender = useRef(true);

  useTelegramTheme();

  const area = areaOf(user?.role);
  const roots = area ? TG_NAV[area].map((i) => i.href) : [];
  const isRoot = pathname === '/tg' || roots.includes(pathname);
  useTelegramBackButton(isRoot, tgHome(user?.role));

  // Rolga mos bo'lmagan bo'limga tushib qolsa (masalan admin /tg/teacher'ni ochsa) —
  // o'z bosh sahifasiga
  const wrongArea =
    !!area &&
    (pathname.startsWith('/tg/teacher') || pathname.startsWith('/tg/admin')) &&
    !pathname.startsWith(`/tg/${area}`);
  useEffect(() => {
    if (wrongArea) router.replace(`/tg/${area}`);
  }, [wrongArea, area, router]);

  useEffect(() => {
    try {
      sessionStorage.setItem(TG_MINI_FLAG, '1');
    } catch {
      // jim
    }
  }, []);

  useEffect(() => {
    if (!firstRender.current) window.scrollTo(0, 0);
    firstRender.current = false;
  }, [pathname]);

  if (!mounted || !isHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Cookie'da token bor — AuthProvider /auth/me orqali sessiyani tiklayapti
    if (getTokenCookie()) {
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      );
    }
    // initData bor — global TelegramWebAppGate avtomatik kiritadi (o'z ekrani bilan);
    // u tugab ham user bo'lmasa (masalan 401 dan keyin) — qayta kirish tugmasi
    if (initData) return <SessionLost initData={initData} />;
    return <NotInTelegram />;
  }

  if (!area) return <StudentNotSupported />;
  if (wrongArea) return null;

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-background"
      style={isRoot ? ({ '--tg-nav-h': '72px' } as React.CSSProperties) : undefined}
    >
      <main className="flex-1">{children}</main>
      {isRoot && <BottomNav area={area} />}
    </div>
  );
}
