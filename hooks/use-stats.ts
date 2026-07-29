"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { TeacherStats } from "@/types"

export function useTeacherStats() {
  return useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => {
      const res = await api.get<{ stats: TeacherStats }>("/stats/teacher")
      return res.stats
    },
  })
}
