"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { Paginated, TeacherRanking, TeacherStats } from "@/types"

export interface AdminStats {
  students: number
  teachers: number
  pendingUsers: number
  pendingRedemptions: number
  activePremium: number
  // Joriy Toshkent kalendar oyi, tiyinda
  paymentsThisMonth: { total: number; count: number }
}

export interface StudentStats {
  completedLessons: number
  certificatesCount: number
  rank: number | null
  activeQuizzesCount: number
}

export type TopTeachersResult = Paginated<TeacherRanking> & {
  me?: { rank: number; activityScore: number } | null
}

// Backend javobi `{ stats: {...} }` (teacher kabi) yoki to'g'ridan-to'g'ri obyekt bo'lishi mumkin
function unwrapStats<T extends object>(res: T | { stats: T }): T {
  return "stats" in res && res.stats && typeof res.stats === "object" ? (res.stats as T) : (res as T)
}

export function useTeacherStats() {
  return useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => {
      const res = await api.get<{ stats: TeacherStats }>("/stats/teacher")
      return res.stats
    },
  })
}

// Ochiq — istalgan login qilgan foydalanuvchi (student/teacher/admin) ko'ra oladi,
// o'quvchilar reytingi bilan bir xil ochiqlik darajasida.
export function useTopTeachers(page = 1, limit = 10, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["top-teachers", page, limit],
    queryFn: () => api.get<TopTeachersResult>("/stats/top-teachers", { page, limit }),
    placeholderData: (prev) => prev,
    enabled: options.enabled,
  })
}

export function useAdminStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => unwrapStats(await api.get<AdminStats | { stats: AdminStats }>("/stats/admin")),
    enabled: options.enabled ?? true,
  })
}

export function useStudentStats() {
  return useQuery({
    queryKey: ["student-stats"],
    queryFn: async () =>
      unwrapStats(await api.get<StudentStats | { stats: StudentStats }>("/stats/student")),
  })
}
