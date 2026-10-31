"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError, uploadWithProgress } from "@/lib/api-client"
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
      // Token yuborilishi shart: busiz backend yozilgan studentga ham locked:true qaytaradi
      const res = await api.get<{ lessons: Lesson[] }>(`/courses/${courseId}/lessons`)
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
      durationMinutes?: number
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
      durationMinutes?: number | null
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

// Darsning asosiy videosi (POST /lessons/:id/video, multipart "video", max 300MB).
// Qo'shimcha materiallar uchun useUploadMaterial (/material) ishlatiladi.
export const LESSON_VIDEO_MAX_BYTES = 300 * 1024 * 1024
export const LESSON_VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime"

export function useUploadLessonVideo(courseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      file,
      durationMinutes,
      onProgress,
      signal,
    }: {
      id: string
      file: File
      durationMinutes?: number
      onProgress?: (fraction: number) => void
      signal?: AbortSignal
    }) => {
      const formData = new FormData()
      formData.append("video", file)
      if (durationMinutes) formData.append("durationMinutes", String(durationMinutes))
      const res = await uploadWithProgress<{ lesson: Lesson } | Lesson>(
        `/lessons/${id}/video`,
        formData,
        { onProgress, signal }
      )
      return "lesson" in res ? res.lesson : res
    },
    onSuccess: (lesson, variables) => {
      queryClient.setQueryData(["lesson", variables.id], lesson)
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] })
        queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      }
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.id] })
      toast.success("Video yuklandi")
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "ABORTED") return
      toast.error(errorMessage(error, "Video yuklashda xatolik"))
    },
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
    onSuccess: async ({ alreadyCompleted, enrollment }) => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["enrollment"] })
      queryClient.invalidateQueries({ queryKey: ["lesson"] })
      const courseFinished = enrollment?.status === "completed" || enrollment?.isCompleted
      if (alreadyCompleted) {
        toast.success("Dars yakunlandi")
        return
      }
      await refreshCurrentUser()
      if (courseFinished) {
        // Barcha darslar tugadi — backend sertifikatni avtomatik yaratadi
        queryClient.invalidateQueries({ queryKey: ["my-certificates"] })
        toast.success("Kurs tugatildi! Sertifikatingiz tayyorlanmoqda", {
          description: "Tayyor bo'lgach bildirishnoma keladi",
          action: { label: "Sertifikatlar", onClick: () => window.location.assign("/student/certificates") },
          duration: 8000,
        })
      } else {
        toast.success("Dars tugatildi! Olmos qo'lga kiritdingiz")
      }
    },
    onError: (error) => toast.error(errorMessage(error, "Darsni yakunlashda xatolik")),
  })
}

// Kursdagi BARCHA darslar yangi tartibda yuboriladi
export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lessonIds: string[]) =>
      api.patch(`/courses/${courseId}/lessons/reorder`, { lessonIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
    onError: (error) => toast.error(errorMessage(error, "Tartibni saqlashda xatolik")),
  })
}
