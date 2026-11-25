'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import type { Paginated } from '@/types';
import type {
  BoardLesson,
  BoardLessonDraft,
  BoardLessonGenerateRequest,
  BoardLessonPayload,
  BoardLessonSummary,
} from '@/types/board-lesson';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Bu amalga ruxsat yo'q";
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useBoardLessons(filters: {
  search?: string;
  page?: number;
  limit?: number;
  grade?: number;
  all?: boolean;
}) {
  return useQuery({
    queryKey: ['board-lessons', filters],
    queryFn: () =>
      api.get<Paginated<BoardLessonSummary>>('/board-lessons', {
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
        grade: filters.grade,
        all: filters.all ? 'true' : undefined,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useBoardLesson(id: string | undefined, options: { editing?: boolean } = {}) {
  return useQuery({
    queryKey: ['board-lesson', id],
    queryFn: async () => (await api.get<{ lesson: BoardLesson }>(`/board-lessons/${id}`)).lesson,
    enabled: !!id,
    // Muharrir ochiq turganda fon rejimida qayta yuklanib, tahrirni bosib ketmasin
    refetchOnWindowFocus: !options.editing,
  });
}

// Xato toast'i chaqiruvchida (422 da kartalar belgilanadi)
export function useSaveBoardLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: BoardLessonPayload & { id?: string }) => {
      const res = id
        ? await api.patch<{ lesson: BoardLesson }>(`/board-lessons/${id}`, payload)
        : await api.post<{ lesson: BoardLesson }>('/board-lessons', payload);
      return res.lesson;
    },
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ['board-lessons'] });
      queryClient.setQueryData(['board-lesson', lesson._id], lesson);
    },
  });
}

export function useDeleteBoardLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/board-lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-lessons'] });
      toast.success("Dars o'chirildi");
    },
    onError: (error) => toast.error(errorMessage(error, "O'chirishda xatolik")),
  });
}

export function useDuplicateBoardLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ lesson: BoardLesson }>(`/board-lessons/${id}/duplicate`)).lesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-lessons'] });
      toast.success('Nusxa yaratildi');
    },
    onError: (error) => toast.error(errorMessage(error, "Nusxalab bo'lmadi")),
  });
}

// AI (Gemini) dars qoralamasini tuzadi — natija muharrirga tushadi, BAZAGA SAQLANMAYDI,
// shuning uchun query cache'ga ham yozilmaydi. Gemini band bo'lsa server o'zi qayta
// urinadi, shuning uchun javob 2 daqiqagacha kelishi mumkin.
export const GENERATE_TIMEOUT_MS = 130_000;

export async function generateBoardLessonDraft(
  body: BoardLessonGenerateRequest,
  options: { signal?: AbortSignal } = {}
) {
  const res = await api.post<{ draft: BoardLessonDraft }>('/board-lessons/generate', body, {
    signal: options.signal,
    timeout: GENERATE_TIMEOUT_MS,
  });
  return res.draft;
}

export function useGenerateBoardLesson() {
  return useMutation({
    mutationFn: ({ body, signal }: { body: BoardLessonGenerateRequest; signal?: AbortSignal }) =>
      generateBoardLessonDraft(body, { signal }),
  });
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export interface AiErrorInfo {
  message: string;
  // 502/503/504 va tarmoq xatosi — "Qayta urinish" tugmasi
  retryable: boolean;
  // 422: { topic: "...", grade: "..." }
  fields: Record<string, string>;
}

function aiFieldErrors(raw: unknown) {
  const fields: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (const item of raw as { field?: string; path?: string; param?: string; message?: string; msg?: string }[]) {
      const field = item.field ?? item.path ?? item.param;
      const message = item.message ?? item.msg;
      if (field && message && !fields[field]) fields[field] = message;
    }
  } else if (raw && typeof raw === 'object') {
    for (const [field, msg] of Object.entries(raw as Record<string, string[] | string>)) {
      const message = Array.isArray(msg) ? msg[0] : msg;
      if (message) fields[field] = message;
    }
  }
  return fields;
}

// Server `message` yubormagan holatlar uchun zaxira matnlar
const AI_FALLBACK_MESSAGES: Record<number, string> = {
  0: 'AI javob bermadi. Qayta urinib ko\'ring',
  403: "Bu amalga ruxsat yo'q",
  422: "Ma'lumotlarni tekshiring",
  429: 'AI kvotasi vaqtincha tugadi',
  502: "AI javobini o'qib bo'lmadi",
  503: 'AI xizmati vaqtincha ishlamayapti',
  504: 'AI javob bermadi',
};

// Xato matni serverdan (`{ success, statusCode, message }`) olinadi
export function aiErrorInfo(error: unknown): AiErrorInfo {
  if (error instanceof ApiError) {
    const message =
      error.message.trim() || AI_FALLBACK_MESSAGES[error.status] || 'AI darsni tuza olmadi';
    if (error.status === 429) {
      // Endi faqat AI provayder (Gemini) kvotasi tugaganda keladi
      const minutes = error.retryAfter ? Math.max(1, Math.ceil(error.retryAfter / 60)) : null;
      return {
        message: minutes ? `${message}. ${minutes} daqiqadan so'ng urinib ko'ring` : message,
        retryable: false,
        fields: {},
      };
    }
    if (error.status === 403) return { message, retryable: false, fields: {} };
    if (error.status === 422)
      return { message, retryable: false, fields: aiFieldErrors(error.errors) };
    return { message, retryable: true, fields: {} };
  }
  return { message: "AI darsni tuza olmadi. Internetni tekshiring", retryable: true, fields: {} };
}

export async function uploadBoardLessonImage(file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ image: string }>('/board-lessons/upload-image', form);
  return res.image;
}
