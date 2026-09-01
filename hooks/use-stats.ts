"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { Paginated, TeacherRanking, TeacherStats } from "@/types"

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
    queryFn: () => api.get<Paginated<TeacherRanking>>("/stats/top-teachers", { page, limit }),
    placeholderData: (prev) => prev,
    enabled: options.enabled,
  })
}
