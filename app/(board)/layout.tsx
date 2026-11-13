'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { SUPER_TEACHER_ROLES } from '@/components/super-teacher/modules';

// Doska rejimi sahifalari: o'qituvchi paneli (sidebar/header) YO'Q.
// Har bir sahifa o'zini <BoardLayout> ga o'raydi (chiqish manzili sahifaga bog'liq).
// Rol tekshiruvi proxy.ts da ham bor — bu yerda client holati uchun.
export default function BoardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const allowed = !!user && SUPER_TEACHER_ROLES.includes(user.role);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) router.replace('/login');
    else if (!allowed) router.replace('/dashboard');
  }, [isHydrated, user, allowed, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#141B3D]">
        <div className="size-10 animate-spin rounded-full border-4 border-white/80 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
