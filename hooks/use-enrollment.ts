"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Enrollment, Paginated } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useMyEnrollments(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["my-enrollments", page, limit],
    queryFn: () => api.get<Paginated<Enrollment>>("/enrollment/my", { page, limit }),
  })
}

export function useEnrollment(id: string | undefined) {
  return useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const res = await api.get<{ enrollment: Enrollment }>(`/enrollment/${id}`)
      return res.enrollment
    },
    enabled: !!id,
  })
}

export function useEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const res = await api.post<{ requiresPayment: boolean; enrollment?: Enrollment }>(
        "/enrollment",
        { courseId }
      )
      return res.enrollment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] })
      toast.success("Kursga muvaffaqiyatli yozildingiz")
    },
    onError: (error) => toast.error(errorMessage(error, "Kursga yozilishda xatolik")),
  })
}
