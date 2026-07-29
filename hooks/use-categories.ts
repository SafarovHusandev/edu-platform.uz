"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Category, Paginated } from "@/types"

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<Category[] | Paginated<Category>>(
        "/categories",
        { limit: 100 },
        { skipAuth: true }
      )
      return Array.isArray(res) ? res : res.items
    },
  })
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const res = await api.get<{ category: Category }>(`/categories/${id}`, undefined, {
        skipAuth: true,
      })
      return res.category
    },
    enabled: !!id,
  })
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await api.post<{ category: Category }>("/categories", payload)
      return res.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Kategoriya yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kategoriya yaratishda xatolik")),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string }) => {
      const res = await api.patch<{ category: Category }>(`/categories/${id}`, payload)
      return res.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Kategoriya yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kategoriyani yangilashda xatolik")),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Kategoriya o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kategoriyani o'chirishda xatolik")),
  })
}
