"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api-client"
import type { Book, Paginated } from "@/types"

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export interface BookFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  grade?: number
}

// Backend /books va /books/:id "authenticate.optional" bilan himoyalangan — kurslardagi
// bilan bir xil qoida (token bo'lsa o'z qoralamalari ham keladi, admin bo'lsa hammasi),
// shuning uchun bu yerda ham skipAuth ishlatilmaydi.
export function useBooks(filters: BookFilters = {}) {
  return useQuery({
    queryKey: ["books", filters],
    queryFn: () => api.get<Paginated<Book>>("/books", { ...filters }),
    placeholderData: (prev) => prev,
  })
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const res = await api.get<{ book: Book }>(`/books/${id}`)
      return res.book
    },
    enabled: !!id,
  })
}

export interface BookPayload {
  title: string
  author: string
  description?: string
  category: string
  grade?: number
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: BookPayload) => {
      const res = await api.post<{ book: Book }>("/books", payload)
      return res.book
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] })
      toast.success("Kitob yaratildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kitob yaratishda xatolik")),
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<BookPayload, "grade">> & {
      id: string
      grade?: number | null
      isPublished?: boolean
    }) => {
      const res = await api.patch<{ book: Book }>(`/books/${id}`, payload)
      return res.book
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["books"] })
      queryClient.invalidateQueries({ queryKey: ["book", variables.id] })
      toast.success("Kitob yangilandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kitobni yangilashda xatolik")),
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] })
      toast.success("Kitob o'chirildi")
    },
    onError: (error) => toast.error(errorMessage(error, "Kitobni o'chirishda xatolik")),
  })
}

export function useUploadBookCover() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append("cover", file)
      const res = await api.post<{ book: Book }>(`/books/${id}/cover`, formData)
      return res.book
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["book", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["books"] })
      toast.success("Muqova yuklandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Muqova yuklashda xatolik")),
  })
}

export function useUploadBookFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append("file", file)
      const res = await api.post<{ book: Book }>(`/books/${id}/file`, formData)
      return res.book
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["book", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["books"] })
      toast.success("Kitob fayli yuklandi")
    },
    onError: (error) => toast.error(errorMessage(error, "Faylni yuklashda xatolik")),
  })
}
