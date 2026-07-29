"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import { refreshCurrentUser } from "@/hooks/use-auth"
import type { Enrollment, Lesson } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const res = await api.get<{ lessons: Lesson[] }>(
        `/courses/${courseId}/lessons`,
        undefined,
        { skipAuth: true }
      )
      return res.lessons
    },
    enabled: !!courseId,
  })
}

export function useLesson(id: string | undefined) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const res = await api.get<{ lesson: Lesson }>(`/lessons/${id}`)
      return res.lesson
    },
    enabled: !!id,
  })
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      title: string
      description?: string
      content?: string
      order: number
    }) => {
      const res = await api.post<{ lesson: Lesson }>(`/courses/${courseId}/lessons`, payload)
      return res.lesson
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      toast.success("Dars qo'shildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Dars qo'shishda xatolik")),
  })
}

export function useUpdateLesson(courseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string
      title?: string
      description?: string
      content?: string
      order?: number
    }) => {
      const res = await api.patch<{ lesson: Lesson }>(`/lessons/${id}`, payload)
      return res.lesson
    },
    onSuccess: (_data, variables) => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] })
        queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      }
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.id] })
      toast.success("Dars yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Darsni yangilashda xatolik")),
  })
}

export function useDeleteLesson(courseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] })
        queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      }
      toast.success("Dars o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Darsni o'chirishda xatolik")),
  })
}

export function useUploadMaterial(courseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append("material", file)
      const res = await api.post<{ lesson: Lesson }>(`/lessons/${id}/material`, formData)
      return res.lesson
    },
    onSuccess: (_data, variables) => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] })
        queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      }
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.id] })
      toast.success("Material yuklandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Material yuklashda xatolik")),
  })
}

export function useCompleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ enrollment: Enrollment; alreadyCompleted: boolean }>(
        `/lessons/${id}/complete`
      )
      return res
    },
    onSuccess: async ({ alreadyCompleted }) => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] })
      if (!alreadyCompleted) {
        await refreshCurrentUser()
        toast.success("Tabriklaymiz! Diamant qo'lga kiritdingiz")
      } else {
        toast.success("Dars yakunlandi")
      }
    },
    onError: (error) => toast.error(errorMessage(error, "Darsni yakunlashda xatolik")),
  })
}
