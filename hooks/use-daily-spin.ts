"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import { refreshCurrentUser } from "@/hooks/use-auth"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export interface DailySpinStatus {
  streakCount: number
  maxSpinsToday: number
  spinsUsedToday: number
  spinsRemainingToday: number
  canSpin: boolean
}

// Aylantirish olmos bermaydi: o'quvchi sinfiga mos savol qaytadi. Aylanish shu
// zahoti ishlatilgan hisoblanadi, javob esa answerWithinMinutes ichida kutiladi.
export interface DailySpinQuestion {
  question: { question: string; options: string[] }
  answerWithinMinutes: number
}

export interface DailySpinAnswerResult {
  correct: boolean
  diamondsWon: number
  correctIndex: number
  streakCount?: number
}

// Faqat student rolidagi foydalanuvchilar uchun: kuniga standart tarifda 1,
// premiumda 3 martagacha aylantirish mumkin.
export function useDailySpinStatus() {
  return useQuery({
    queryKey: ["daily-spin-status"],
    queryFn: () => api.get<DailySpinStatus>("/daily-spin/status"),
  })
}

export interface DailySpinHistoryItem {
  diamondsWon: number
  createdAt: string
}

export function useDailySpinHistory(limit = 10) {
  return useQuery({
    queryKey: ["daily-spin-history", limit],
    queryFn: async () => {
      const res = await api.get<{ history: DailySpinHistoryItem[] }>("/daily-spin/history", {
        limit,
      })
      return res.history
    },
  })
}

export function useDailySpin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<DailySpinQuestion>("/daily-spin/spin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-spin-status"] })
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["daily-spin-status"] })
      toast.error(errorMessage(error, "Aylantirishda xatolik"))
    },
  })
}

export function useAnswerDailySpin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (selectedIndex: number) =>
      api.post<DailySpinAnswerResult>("/daily-spin/answer", { selectedIndex }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["daily-spin-status"] })
      queryClient.invalidateQueries({ queryKey: ["daily-spin-history"] })
      await refreshCurrentUser()
    },
    // 400: javob muddati o'tgan — holatni serverdan qayta olamiz
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["daily-spin-status"] })
      toast.error(errorMessage(error, "Javobni yuborishda xatolik"))
    },
  })
}
