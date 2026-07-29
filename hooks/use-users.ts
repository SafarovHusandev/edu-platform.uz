"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import { setTokenCookie } from "@/lib/cookies"
import { useAuthStore } from "@/store/auth-store"
import type { Paginated, User } from "@/types"

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
    mutationFn: async (payload: { oldPassword: string; newPassword: string }) => {
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
