"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Course, CourseStats, Lesson, Paginated } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export interface CourseFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
}

// Backend /courses va /courses/:id "authenticate.optional" bilan himoyalangan:
// token yuborilsa, javobda so'rovchining o'z qoralama (draft) kurslari ham
// keladi (yoki admin bo'lsa — barcha kurslar). Shu uchun bu yerda skipAuth
// ishlatilmaydi — token mavjud bo'lsa avtomatik qo'shiladi, bo'lmasa jim o'tkazib
// yuboriladi (mehmon foydalanuvchi uchun ham xatosiz ishlayveradi).
export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: () => api.get<Paginated<Course>>("/courses", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

export interface CourseDetail {
  course: Course
  lessons: Lesson[]
  hasAccess: boolean
}

// Backend bitta so'rovda kurs + uning darslari + hasAccess flagini birga qaytaradi,
// shuning uchun bu yerda alohida darslar so'rovi kerak emas (qarang: teacher/courses/[id]).
export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => api.get<CourseDetail>(`/courses/${id}`),
    enabled: !!id,
  })
}

export function useCourseStats(id: string | undefined) {
  return useQuery({
    queryKey: ["course-stats", id],
    queryFn: async () => {
      const res = await api.get<{ stats: CourseStats }>(`/courses/${id}/stats`)
      return res.stats
    },
    enabled: !!id,
  })
}

export interface CoursePayload {
  title: string
  description: string
  category: string
  price: number
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CoursePayload) => {
      const res = await api.post<{ course: Course }>("/courses", payload)
      return res.course
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("Kurs yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kurs yaratishda xatolik")),
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<CoursePayload> & { id: string; isPublished?: boolean }) => {
      const res = await api.patch<{ course: Course }>(`/courses/${id}`, payload)
      return res.course
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["course", variables.id] })
      toast.success("Kurs yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kursni yangilashda xatolik")),
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("Kurs o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kursni o'chirishda xatolik")),
  })
}

export function useUploadThumbnail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append("thumbnail", file)
      const res = await api.post<{ course: Course }>(`/courses/${id}/thumbnail`, formData)
      return res.course
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("Rasm yuklandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Rasm yuklashda xatolik")),
  })
}
