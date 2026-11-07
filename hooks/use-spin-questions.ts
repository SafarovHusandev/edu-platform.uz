"use client"

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Paginated } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

// knowledge — sinfga bog'liq bilim savoli; logic — sinfsiz, barcha o'quvchilarga umumiy
export type SpinQuestionCategory = "knowledge" | "logic"

// Kunlik baraban savollari banki (admin/superadmin)
export interface SpinQuestion {
  _id: string
  // Eski yozuvlarda bo'lmasligi mumkin — ular bilim savoli hisoblanadi
  category?: SpinQuestionCategory
  grade: number | null
  question: string
  options: string[]
  correctIndex: number
}

export type SpinQuestionPayload = Omit<SpinQuestion, "_id">

type SpinQuestionsResponse =
  | Paginated<SpinQuestion>
  | SpinQuestion[]
  | { questions: SpinQuestion[] }

// Sahifalanmagan javobni ham bir xil ko'rinishga keltiramiz
function toPage(res: SpinQuestionsResponse): Paginated<SpinQuestion> {
  if (!Array.isArray(res) && "items" in res) return res
  const items = Array.isArray(res) ? res : (res.questions ?? [])
  return { items, total: items.length, page: 1, limit: items.length, totalPages: 1 }
}

export function useSpinQuestions(
  filters: { category?: SpinQuestionCategory; grade?: number; page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: ["spin-questions", filters],
    queryFn: async () =>
      toPage(await api.get<SpinQuestionsResponse>("/spin-questions", { ...filters })),
    placeholderData: keepPreviousData,
  })
}

export function useCreateSpinQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SpinQuestionPayload) => api.post("/spin-questions", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spin-questions"] })
      toast.success("Savol qo'shildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Savolni qo'shishda xatolik")),
  })
}

// Backendda ommaviy endpoint yo'q: savollar ketma-ket qo'shiladi, birortasi o'tmasa
// qolganlari to'xtamaydi va o'tmaganlari qaytariladi
export function useImportSpinQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (questions: SpinQuestionPayload[]) => {
      let added = 0
      const failed: { question: SpinQuestionPayload; message: string }[] = []
      for (const question of questions) {
        try {
          await api.post("/spin-questions", question)
          added += 1
        } catch (error) {
          failed.push({ question, message: errorMessage(error, "Savolni qo'shib bo'lmadi") })
        }
      }
      return { added, failed }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["spin-questions"] }),
    onError: (error) => toast.error(errorMessage(error, "Savollarni yuklashda xatolik")),
  })
}

export function useUpdateSpinQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: SpinQuestionPayload & { id: string }) =>
      api.patch(`/spin-questions/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spin-questions"] })
      toast.success("Savol yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Savolni yangilashda xatolik")),
  })
}

export function useDeleteSpinQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spin-questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spin-questions"] })
      toast.success("Savol o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Savolni o'chirishda xatolik")),
  })
}
