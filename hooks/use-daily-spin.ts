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

export interface DailySpinResult {
  diamondsWon: number
  streakCount: number
  spinsUsedToday: number
  spinsRemainingToday: number
  maxSpinsToday: number
}

// Faqat student rolidagi foydalanuvchilar uchun: kuniga standart tarifda 1,
// premiumda 3 martagacha aylantirish mumkin.
export function useDailySpinStatus() {
  return useQuery({
    queryKey: ["daily-spin-status"],
    queryFn: () => api.get<DailySpinStatus>("/daily-spin/status"),
  })
}

export function useDailySpin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<DailySpinResult>("/daily-spin/spin"),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["daily-spin-status"] })
      await refreshCurrentUser()
    },
    onError: (error) => toast.error(errorMessage(error, "Aylantirishda xatolik")),
  })
}
