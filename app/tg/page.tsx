'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { tgHome } from '@/components/tg/tg-shell';
import { getTelegramStartParam } from '@/lib/telegram-webapp';
import { useAuthStore } from '@/store/auth-store';

type Area = 'teacher' | 'admin';

// Bot havolasidagi startapp parametri (t.me/<bot>/<app>?startapp=grading) bo'yicha
// to'g'ridan-to'g'ri kerakli bo'limni ochish
const START_PARAM_ROUTES: Record<string, Record<Area, string | null>> = {
  grading: { teacher: '/tg/teacher/grading', admin: null },
  shares: { teacher: '/tg/teacher/shares', admin: null },
  quizzes: { teacher: '/tg/teacher/quizzes', admin: null },
  courses: { teacher: '/tg/teacher/courses', admin: null },
  notifications: { teacher: '/tg/notifications', admin: '/tg/notifications' },
  users: { teacher: null, admin: '/tg/admin/users?tab=pending' },
  requests: { teacher: null, admin: '/tg/admin/requests' },
  payments: { teacher: null, admin: '/tg/admin/payments' },
};

// Aniq obyektga havola: "<bo'lim>_<id>" (startapp faqat [A-Za-z0-9_-] qabul qiladi)
const START_PARAM_PATTERNS: { prefix: string; area: Area; href: (id: string) => string }[] = [
  { prefix: 'grading_', area: 'teacher', href: (id) => `/tg/teacher/grading?quiz=${id}` },
  { prefix: 'results_', area: 'teacher', href: (id) => `/tg/teacher/quizzes/${id}/results` },
  { prefix: 'quiz_', area: 'teacher', href: (id) => `/tg/teacher/quizzes/${id}` },
  { prefix: 'user_', area: 'admin', href: (id) => `/tg/admin/users/${id}` },
];

function resolveStartParam(param: string, area: Area): string | null {
  if (!param) return null;
  const fixed = START_PARAM_ROUTES[param]?.[area];
  if (fixed) return fixed;
  for (const pattern of START_PARAM_PATTERNS) {
    if (pattern.area !== area || !param.startsWith(pattern.prefix)) continue;
    const id = param.slice(pattern.prefix.length);
    if (/^[a-f0-9]{24}$/i.test(id)) return pattern.href(id);
  }
  return null;
}

export default function TgIndexPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (!role) return;
    const home = tgHome(role);
    if (home === '/tg') return;
    const area: Area = role === 'teacher' ? 'teacher' : 'admin';
    router.replace(resolveStartParam(getTelegramStartParam(), area) ?? home);
  }, [role, router]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Loader2 className="size-7 animate-spin text-primary" />
    </div>
  );
}
