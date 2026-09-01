"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type {
  Invoice,
  Paginated,
  PaymentPurpose,
  PaymentRecord,
  PaymentStatus,
  PremiumPlanKey,
  PremiumPlans,
} from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export interface CreatePaymentPayload {
  purpose: "wallet" | "course" | "premium" | "donation"
  amount?: number
  courseId?: string
  plan?: PremiumPlanKey
  promoCode?: string
  returnUrl: string
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => api.post<Invoice>("/payment/create", payload),
    onError: (error) => toast.error(errorMessage(error, "To'lovni yaratishda xatolik")),
  })
}

// Public — token shart emas. Narxlarni frontendda qattiq kodlab qo'ymaslik
// uchun shu endpoint orqali dinamik olinadi (backend keyin o'zgartirishi mumkin).
export function usePremiumPlans() {
  return useQuery({
    queryKey: ["premium-plans"],
    queryFn: async () => {
      const res = await api.get<{ plans: PremiumPlans }>("/payment/premium-plans", undefined, {
        skipAuth: true,
      })
      return res.plans
    },
    staleTime: 5 * 60 * 1000,
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

export interface PaymentHistoryFilters {
  page?: number
  limit?: number
  purpose?: PaymentPurpose
  status?: PaymentStatus
}

// O'zining to'lovlar tarixi — istalgan rol (student/teacher/admin/superadmin)
// chaqirishi mumkin, rol bo'yicha cheklov yo'q.
export function useMyPayments(filters: PaymentHistoryFilters = {}) {
  return useQuery({
    queryKey: ["payments-my", filters],
    queryFn: () => api.get<Paginated<PaymentRecord>>("/payment/my", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

export interface AdminPaymentFilters extends PaymentHistoryFilters {
  userId?: string
}

// Barcha foydalanuvchilarning to'lovlari — faqat admin/superadmin.
export function useAllPayments(filters: AdminPaymentFilters = {}) {
  return useQuery({
    queryKey: ["payments-all", filters],
    queryFn: () => api.get<Paginated<PaymentRecord>>("/payment", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

// "Holatni tekshirish" tugmasi uchun — bitta to'lovni darhol qayta tekshiradi
// (Multicard callback yo'qolgan hollarda foydali) va ro'yxatlarni yangilaydi.
export function useCheckPaymentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await api.get<{ payment: Invoice }>(`/payment/status/${invoiceId}`)
      return res.payment
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["payments-my"] })
      queryClient.invalidateQueries({ queryKey: ["payments-all"] })
      if (payment.status === "success") {
        toast.success("To'lov muvaffaqiyatli tasdiqlandi")
      } else {
        toast.info("Holat hozircha o'zgarmadi")
      }
    },
    onError: (error) => toast.error(errorMessage(error, "Holatni tekshirishda xatolik")),
  })
}
