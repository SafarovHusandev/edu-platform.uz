'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { tgHome } from '@/components/tg/tg-shell';
import { getTelegramInitData } from '@/lib/telegram-webapp';
import { useAuthStore } from '@/store/auth-store';

// Bot havolasidagi startapp parametri (t.me/<bot>/<app>?startapp=grading) bo'yicha
// to'g'ridan-to'g'ri kerakli bo'limni ochish
const START_PARAM_ROUTES: Record<string, Record<'teacher' | 'admin', string | null>> = {
  grading: { teacher: '/tg/teacher/grading', admin: null },
  shares: { teacher: '/tg/teacher/shares', admin: null },
  quizzes: { teacher: '/tg/teacher/quizzes', admin: null },
  users: { teacher: null, admin: '/tg/admin/users?tab=pending' },
  requests: { teacher: null, admin: '/tg/admin/requests' },
  payments: { teacher: null, admin: '/tg/admin/payments' },
};

export default function TgIndexPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (!role) return;
    const home = tgHome(role);
    if (home === '/tg') return;
    const area = role === 'teacher' ? 'teacher' : 'admin';
    const startParam = new URLSearchParams(getTelegramInitData()).get('start_param') ?? '';
    router.replace(START_PARAM_ROUTES[startParam]?.[area] ?? home);
  }, [role, router]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Loader2 className="size-7 animate-spin text-primary" />
    </div>
  );
}
