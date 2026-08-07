"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { BookCategory, Paginated } from "@/types"

export function useBookCategories() {
  return useQuery({
    queryKey: ["book-categories"],
    queryFn: async () => {
      const res = await api.get<BookCategory[] | Paginated<BookCategory>>(
        "/book-categories",
        { limit: 100 },
        { skipAuth: true }
      )
      return Array.isArray(res) ? res : res.items
    },
  })
}

export function useBookCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["book-category", id],
    queryFn: async () => {
      const res = await api.get<{ category: BookCategory }>(`/book-categories/${id}`, undefined, {
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

export function useCreateBookCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; icon?: string }) => {
      const res = await api.post<{ category: BookCategory }>("/book-categories", payload)
      return res.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-categories"] })
      toast.success("Kategoriya yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kategoriya yaratishda xatolik")),
  })
}

export function useUpdateBookCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string
      name?: string
      description?: string
      icon?: string
    }) => {
      const res = await api.patch<{ category: BookCategory }>(`/book-categories/${id}`, payload)
      return res.category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-categories"] })
      toast.success("Kategoriya yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kategoriyani yangilashda xatolik")),
  })
}

export function useDeleteBookCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/book-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-categories"] })
      toast.success("Kategoriya o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kategoriyani o'chirishda xatolik")),
  })
}
