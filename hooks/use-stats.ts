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
    queryFn: () => api.get<AdminStats>("/stats/admin"),
    enabled: options.enabled ?? true,
  })
}

export function useStudentStats() {
  return useQuery({
    queryKey: ["student-stats"],
    queryFn: () => api.get<StudentStats>("/stats/student"),
  })
}
