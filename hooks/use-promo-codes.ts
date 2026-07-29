"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Paginated, PromoCode } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function usePromoPreview(params: {
  code?: string
  purpose?: string
  courseId?: string
}) {
  return useQuery({
    queryKey: ["promo-preview", params],
    queryFn: () =>
      api.get<{ discountPercent: number; finalAmount?: number }>(
        "/promo-codes/preview",
        params,
        { skipAuth: true }
      ),
    enabled: !!params.code,
    retry: false,
  })
}

export function usePromoCodes(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["promo-codes", filters],
    queryFn: () => api.get<Paginated<PromoCode>>("/promo-codes", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

export interface PromoCodePayload {
  code: string
  discountPercent: number
  expiresAt: string
  maxUses: number
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PromoCodePayload) => {
      const res = await api.post<{ promoCode: PromoCode }>("/promo-codes", payload)
      return res.promoCode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      toast.success("Promo kod yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Promo kod yaratishda xatolik")),
  })
}

export function useUpdatePromoCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<PromoCodePayload> & { id: string; isActive?: boolean }) => {
      const res = await api.patch<{ promoCode: PromoCode }>(`/promo-codes/${id}`, payload)
      return res.promoCode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      toast.success("Promo kod yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Promo kodni yangilashda xatolik")),
  })
}

export function useDeletePromoCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      toast.success("Promo kod o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Promo kodni o'chirishda xatolik")),
  })
}
