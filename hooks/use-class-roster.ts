'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import type { RosterStudent } from '@/lib/class-roster';
import type { ClassRosterStudent } from '@/types';

// GET /users/class-roster?grade=5&gradeLetter=A — teacher/admin/superadmin.
// Faqat tasdiqlangan, bloklanmagan o'quvchilar; ism bo'yicha tartiblangan, ≤200 ta.
export async function getClassRoster(params: { grade: number; gradeLetter: string }) {
  const res = await api.get<{ students: ClassRosterStudent[] }>('/users/class-roster', params);
  return res?.students ?? [];
}

export function useClassRoster(grade?: number, gradeLetter?: string) {
  return useQuery({
    queryKey: ['class-roster', grade, gradeLetter],
    queryFn: async (): Promise<RosterStudent[]> => {
      const students = await getClassRoster({ grade: grade!, gradeLetter: gradeLetter! });
      return students.map((s) => ({ id: s._id, name: s.name, avatar: s.avatar ?? null }));
    },
    enabled: !!grade && !!gradeLetter,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function classRosterErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Sinf ro'yxatini ko'rishga ruxsat yo'q";
    if (error.status === 422) return "Sinf noto'g'ri tanlangan";
    if (error.message) return error.message;
  }
  return "Sinf ro'yxatini yuklab bo'lmadi";
}
