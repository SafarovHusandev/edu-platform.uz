"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Paginated, Review } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useCourseReviews(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      const res = await api.get<Paginated<Review>>(
        `/courses/${courseId}/reviews`,
        undefined,
        { skipAuth: true }
      )
      return res.items
    },
    enabled: !!courseId,
  })
}

export function useCreateReview(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { rating: number; comment: string }) => {
      const res = await api.post<{ review: Review }>(`/courses/${courseId}/reviews`, payload)
      return res.review
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      toast.success("Sharh qo'shildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Sharh qoldirishda xatolik")),
  })
}

export function useUpdateReview(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; rating: number; comment: string }) => {
      const res = await api.patch<{ review: Review }>(`/reviews/${id}`, payload)
      return res.review
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] })
      toast.success("Sharh yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Sharhni yangilashda xatolik")),
  })
}

export function useDeleteReview(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] })
      toast.success("Sharh o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Sharhni o'chirishda xatolik")),
  })
}
