"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Attempt, AttemptAnswer, Paginated, Question, Quiz } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useQuizzes(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["quizzes", filters],
    queryFn: async () => {
      const result = await api.get<Paginated<Quiz> | { quizzes: Quiz[] }>(
        "/quizzes",
        { ...filters },
        { skipAuth: true }
      )
      if ("items" in result) return result
      const items = result.quizzes ?? []
      return {
        items,
        total: items.length,
        page: filters.page ?? 1,
        limit: filters.limit ?? items.length,
        totalPages: 1,
      } satisfies Paginated<Quiz>
    },
    placeholderData: (prev) => prev,
  })
}

export function useQuiz(id: string | undefined) {
  return useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const res = await api.get<{ quiz: Quiz; questions: Question[] }>(
        `/quizzes/${id}`,
        undefined,
        { skipAuth: true }
      )
      return { ...res.quiz, questions: res.questions }
    },
    enabled: !!id,
  })
}

export function useQuizWithAnswers(id: string | undefined) {
  return useQuery({
    queryKey: ["quiz-answers", id],
    queryFn: async () => {
      const res = await api.get<{ quiz: Quiz; questions: Question[] }>(`/quizzes/${id}/answers`)
      return { ...res.quiz, questions: res.questions }
    },
    enabled: !!id,
  })
}

export interface QuizPayload {
  title: string
  description?: string
  targetType: "standalone" | "course" | "lesson"
  targetId?: string
  passingScore: number
  maxAttempts: number
  timeLimit: number
  availableFrom?: string | null
  availableUntil?: string | null
  grade: number
  isActive?: boolean
}

export function useCreateQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: QuizPayload) => {
      const res = await api.post<{ quiz: Quiz }>("/quizzes", payload)
      return res.quiz
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Test yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Test yaratishda xatolik")),
  })
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<QuizPayload> & { id: string }) => {
      const res = await api.patch<{ quiz: Quiz }>(`/quizzes/${id}`, payload)
      return res.quiz
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      queryClient.invalidateQueries({ queryKey: ["quiz", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["quiz-answers", variables.id] })
      toast.success("Test yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Testni yangilashda xatolik")),
  })
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quizzes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Test o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Testni o'chirishda xatolik")),
  })
}

export interface QuestionPayload {
  text: string
  type: "multiple_choice" | "true_false" | "open_ended"
  options?: { label: string; text: string }[]
  correctAnswer?: number | boolean
  sampleAnswer?: string
  points: number
}

export function useAddQuestion(quizId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: QuestionPayload) => {
      const res = await api.post<{ question: Question }>(`/quizzes/${quizId}/questions`, payload)
      return res.question
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-answers", quizId] })
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId] })
      toast.success("Savol qo'shildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Savol qo'shishda xatolik")),
  })
}

export function useUpdateQuestion(quizId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<QuestionPayload> & { id: string }) => {
      const res = await api.patch<{ question: Question }>(`/quizzes/questions/${id}`, payload)
      return res.question
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-answers", quizId] })
      toast.success("Savol yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Savolni yangilashda xatolik")),
  })
}

export function useDeleteQuestion(quizId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quizzes/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-answers", quizId] })
      toast.success("Savol o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Savolni o'chirishda xatolik")),
  })
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: async (quizId: string) => {
      const res = await api.post<{ attempt: Attempt }>(`/quizzes/${quizId}/start`)
      return res.attempt
    },
    onError: (error) => toast.error(errorMessage(error, "Testni boshlashda xatolik")),
  })
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ attemptId, answers }: { attemptId: string; answers: AttemptAnswer[] }) => {
      const res = await api.post<{ attempt: Attempt }>(
        `/quizzes/attempts/${attemptId}/submit`,
        { answers }
      )
      return res.attempt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attempts"] })
      toast.success("Test yakunlandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Testni yuborishda xatolik")),
  })
}

export interface MyAttemptsResult {
  attempts: Attempt[]
  attemptsUsed: number
  attemptsRemaining: number
  maxAttempts: number
}

export function useMyAttempts(quizId: string | undefined) {
  return useQuery({
    queryKey: ["my-attempts", quizId],
    queryFn: async () => {
      const res = await api.get<MyAttemptsResult | Attempt[]>(`/quizzes/${quizId}/my-attempts`)
      if (Array.isArray(res)) {
        return { attempts: res, attemptsUsed: res.length, attemptsRemaining: 0, maxAttempts: 0 }
      }
      return res
    },
    enabled: !!quizId,
  })
}

export function useQuizResults(quizId: string | undefined) {
  return useQuery({
    queryKey: ["quiz-results", quizId],
    queryFn: async () => {
      const res = await api.get<Attempt[] | { attempts: Attempt[] }>(
        `/quizzes/${quizId}/results`
      )
      return Array.isArray(res) ? res : res.attempts
    },
    enabled: !!quizId,
  })
}

export function useReviewOpenEnded(quizId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      attemptId,
      reviewedAnswers,
    }: {
      attemptId: string
      reviewedAnswers: { questionId: string; pointsEarned: number; isCorrect: boolean; feedback?: string }[]
    }) => {
      const res = await api.patch<{ attempt: Attempt }>(
        `/quizzes/attempts/${attemptId}/review`,
        { reviewedAnswers }
      )
      return res.attempt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-results", quizId] })
      toast.success("Baholandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Baholashda xatolik")),
  })
}
