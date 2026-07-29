"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Invoice } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export interface CreatePaymentPayload {
  purpose: "wallet" | "course" | "premium" | "donation"
  amount?: number
  courseId?: string
  promoCode?: string
  returnUrl: string
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => api.post<Invoice>("/payment/create", payload),
    onError: (error) => toast.error(errorMessage(error, "To'lovni yaratishda xatolik")),
  })
}

export function usePaymentStatus(invoiceId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ["payment-status", invoiceId],
    queryFn: async () => {
      const res = await api.get<{ payment: Invoice }>(`/payment/status/${invoiceId}`)
      return res.payment
    },
    enabled: !!invoiceId,
    refetchInterval: (query) => (poll && query.state.data?.status !== "success" ? 3000 : false),
  })
}
