"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import { setTokenCookie } from "@/lib/cookies"
import { useAuthStore } from "@/store/auth-store"
import type { Grade, Paginated, Role, Tarif, User } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useLeaderboard(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["leaderboard", page, limit],
    queryFn: () => api.get<Paginated<User>>("/users/leaderboard", { page, limit }),
  })
}

export function useUsers(filters: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => api.get<Paginated<User>>("/users", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await api.get<{ user: User }>(`/users/${id}`)
      return res.user
    },
    enabled: !!id,
  })
}

export function useToggleUserBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string; isBlocked: boolean }) => {
      const res = await api.patch<{ user: User }>(`/users/${id}/block`, { isBlocked })
      return res.user
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-user", variables.id] })
      toast.success(variables.isBlocked ? "Foydalanuvchi bloklandi" : "Bloki ochildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Amalni bajarishda xatolik")),
  })
}

export interface AdminUpdateUserPayload {
  id: string
  name?: string
  phone?: string
  role?: Role
  tarif?: Tarif
  grade?: Grade
}

// Faqat superadmin uchun: /users/:id/block'dan farqli o'laroq, foydalanuvchining
// istalgan maydonini (rol, tarif, sinf va h.k.) tahrirlaydi.
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: AdminUpdateUserPayload) => {
      const res = await api.patch<{ user: User }>(`/users/${id}`, payload)
      return res.user
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-user", variables.id] })
      toast.success("Foydalanuvchi yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Foydalanuvchini yangilashda xatolik")),
  })
}

// Faqat superadmin uchun: foydalanuvchini butunlay o'chiradi (qaytarib bo'lmaydi).
export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("Foydalanuvchi o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Foydalanuvchini o'chirishda xatolik")),
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (payload: { name?: string }) => {
      const res = await api.patch<{ user: User }>("/users/me", payload)
      return res.user
    },
    onSuccess: (user) => {
      useAuthStore.getState().updateUser(user)
      toast.success("Profil yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Profilni yangilashda xatolik")),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { oldPassword?: string; newPassword: string }) => {
      const res = await api.patch<{ token: string }>("/users/me/password", payload)
      return res.token
    },
    onSuccess: (token) => {
      // Backend boshqa qurilmalardagi tokenlarni yaroqsiz qiladi, lekin joriy
      // sessiya uchun yangi token qaytaradi — shuni saqlamasak foydalanuvchi
      // keyingi so'rovda darhol tizimdan chiqarib yuboriladi.
      setTokenCookie(token)
      toast.success("Parol muvaffaqiyatli o'zgartirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Parolni o'zgartirishda xatolik")),
  })
}

export interface TelegramLinkResult {
  token: string
  deepLink: string | null
  expiresAt: string
}

export function useLinkTelegram() {
  return useMutation({
    mutationFn: () => api.post<TelegramLinkResult>("/users/me/telegram/link"),
    onError: (error) => toast.error(errorMessage(error, "Telegramni ulashda xatolik")),
  })
}

// "Telegramni uzishdan oldin parol o'rnating" xatosini alohida qayta ishlash
// kerak (toast o'rniga parol o'rnatish modali ko'rsatiladi) — shu sabab bu
// hookda o'sha holat uchun toast chiqarilmaydi, chaqiruvchi component hal qiladi.
export function useUnlinkTelegram() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<{ user: User }>("/users/me/telegram")
      return res.user
    },
    onSuccess: (user) => {
      useAuthStore.getState().updateUser(user)
      toast.success("Telegram uzildi")
    },
    onError: (error) => {
      if (error instanceof ApiError && error.message.includes("parol o'rnating")) return
      toast.error(errorMessage(error, "Telegramni uzishda xatolik"))
    },
  })
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("avatar", file)
      const res = await api.post<{ user: User }>("/users/me/avatar", formData)
      return res.user
    },
    onSuccess: (user) => {
      useAuthStore.getState().updateUser(user)
      toast.success("Rasm yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Rasm yuklashda xatolik")),
  })
}
