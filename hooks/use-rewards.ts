"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import { refreshCurrentUser } from "@/hooks/use-auth"
import type { Paginated, Redemption, RedemptionStatus, Reward } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useRewards(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["rewards", filters],
    queryFn: () => api.get<Paginated<Reward>>("/rewards", { ...filters }, { skipAuth: true }),
    placeholderData: (prev) => prev,
  })
}

export function useReward(id: string | undefined) {
  return useQuery({
    queryKey: ["reward", id],
    queryFn: async () => {
      const res = await api.get<{ reward: Reward }>(`/rewards/${id}`, undefined, {
        skipAuth: true,
      })
      return res.reward
    },
    enabled: !!id,
  })
}

export interface RewardPayload {
  title: string
  description?: string
  cost: number
  stock: number | null
}

export function useCreateReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RewardPayload) => {
      const res = await api.post<{ reward: Reward }>("/rewards", payload)
      return res.reward
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] })
      toast.success("Mukofot yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Mukofot yaratishda xatolik")),
  })
}

export function useUpdateReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RewardPayload> & { id: string }) => {
      const res = await api.patch<{ reward: Reward }>(`/rewards/${id}`, payload)
      return res.reward
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] })
      queryClient.invalidateQueries({ queryKey: ["reward", variables.id] })
      toast.success("Mukofot yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Mukofotni yangilashda xatolik")),
  })
}

export function useDeleteReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rewards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] })
      toast.success("Mukofot o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Mukofotni o'chirishda xatolik")),
  })
}

export function useUploadRewardImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append("image", file)
      const res = await api.post<{ reward: Reward }>(`/rewards/${id}/image`, formData)
      return res.reward
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] })
      queryClient.invalidateQueries({ queryKey: ["reward", variables.id] })
      toast.success("Rasm yuklandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Rasm yuklashda xatolik")),
  })
}

export function useRedeemReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ redemption: Redemption }>(`/rewards/${id}/redeem`)
      return res.redemption
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["my-redemptions"] })
      await refreshCurrentUser()
      toast.success("Mukofotga muvaffaqiyatli almashtirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Mukofotga almashtirishda xatolik")),
  })
}

export function useMyRedemptions(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["my-redemptions", page, limit],
    queryFn: () => api.get<Paginated<Redemption>>("/rewards/redemptions/my", { page, limit }),
  })
}

export function useAllRedemptions(filters: { status?: RedemptionStatus; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["all-redemptions", filters],
    queryFn: () => api.get<Paginated<Redemption>>("/rewards/redemptions", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

export function useUpdateRedemptionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string
      status: RedemptionStatus
      adminNote?: string
    }) => {
      const res = await api.patch<{ redemption: Redemption }>(
        `/rewards/redemptions/${id}`,
        { status, adminNote }
      )
      return res.redemption
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-redemptions"] })
      toast.success("Holat yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Holatni yangilashda xatolik")),
  })
}
