'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import type { Paginated } from '@/types';
import type {
  LiveImportResult,
  LiveJoinInfo,
  LiveQuiz,
  LiveQuizPayload,
  LiveQuizSummary,
  LiveSessionCreated,
  LiveSessionResult,
  LiveSessionSummary,
} from '@/types/live-quiz';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Bu amalga ruxsat yo'q";
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useLiveQuizzes(filters: {
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}) {
  return useQuery({
    queryKey: ['live-quizzes', filters],
    queryFn: () =>
      api.get<Paginated<LiveQuizSummary>>('/live-quizzes', {
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
        all: filters.all ? 'true' : undefined,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useLiveQuiz(id: string | undefined) {
  return useQuery({
    queryKey: ['live-quiz', id],
    queryFn: async () => (await api.get<{ quiz: LiveQuiz }>(`/live-quizzes/${id}`)).quiz,
    enabled: !!id,
    // Muharrir ochiq turganda fon rejimida qayta yuklanib, tahrirni bosib ketmasin
    refetchOnWindowFocus: false,
  });
}

// Xato toast'i chaqiruvchida (422 da kartalar belgilanadi)
export function useSaveLiveQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: LiveQuizPayload & { id?: string }) => {
      const res = id
        ? await api.patch<{ quiz: LiveQuiz }>(`/live-quizzes/${id}`, payload)
        : await api.post<{ quiz: LiveQuiz }>('/live-quizzes', payload);
      return res.quiz;
    },
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ['live-quizzes'] });
      queryClient.setQueryData(['live-quiz', quiz._id], quiz);
    },
  });
}

export function useDeleteLiveQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/live-quizzes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-quizzes'] });
      toast.success("Viktorina o'chirildi");
    },
    onError: (error) => toast.error(errorMessage(error, "O'chirishda xatolik")),
  });
}

export async function uploadLiveQuizImage(file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ image: string }>('/live-quizzes/upload-image', form);
  return res.image;
}

export function useImportLiveQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, title }: { quizId: string; title?: string }) =>
      api.post<LiveImportResult>(`/live-quizzes/import/${quizId}`, title ? { title } : {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-quizzes'] }),
  });
}

export function useStartLiveSession() {
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ session: LiveSessionCreated }>(`/live-quizzes/${id}/sessions`)).session,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        toast.error("Avval savol qo'shing");
        return;
      }
      toast.error(errorMessage(error, "O'yinni boshlab bo'lmadi"));
    },
  });
}

// Ishtirokchi uchun, token yuborilmaydi
export async function fetchLiveJoinInfo(pin: string) {
  return (
    await api.get<{ session: LiveJoinInfo }>(`/live-quizzes/join/${pin}`, undefined, {
      skipAuth: true,
    })
  ).session;
}

export function useLiveQuizSessions(id: string | undefined, page: number, limit = 10) {
  return useQuery({
    queryKey: ['live-quiz-sessions', id, page, limit],
    queryFn: () =>
      api.get<Paginated<LiveSessionSummary>>(`/live-quizzes/${id}/results`, { page, limit }),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

export function useLiveSessionResult(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['live-session-result', sessionId],
    queryFn: async () =>
      (await api.get<{ session: LiveSessionResult }>(`/live-quizzes/results/${sessionId}`))
        .session,
    enabled: !!sessionId,
  });
}
