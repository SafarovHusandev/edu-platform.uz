'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { setTokenCookie, setRoleCookie, clearAuthCookies } from '@/lib/cookies';
import { useAuthStore } from '@/store/auth-store';
import type { User, Role, Grade } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  role: Role;
  grade?: Grade;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface TelegramLoginPayload {
  code: string;
}

function persistSession(res: AuthResponse) {
  setTokenCookie(res.token);
  setRoleCookie(res.user.role);
  useAuthStore.getState().setSession(res.user, res.token);
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

// Diamonds/balance/tarif o'zgaradigan amallardan (dars tugatish, mukofot olish,
// to'lov) so'ng auth-store'dagi user'ni serverdan qayta yuklab yangilaydi —
// bo'lmasa UI eski qiymatlarni ko'rsataveradi (keyingi login/reloadgacha).
export async function refreshCurrentUser() {
  try {
    const { user } = await api.get<{ user: User }>('/auth/me');
    useAuthStore.getState().updateUser(user);
  } catch {
    // jim — haqiqiy autentifikatsiya xatosi bo'lsa, keyingi so'rovda 401 orqali ushlanadi
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthResponse>('/auth/login', payload, { skipAuth: true }),
    onSuccess: (data) => {
      persistSession(data);
      toast.success('Xush kelibsiz!');
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Kirishda xatolik yuz berdi'));
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<AuthResponse>('/auth/register', payload, { skipAuth: true }),
    onSuccess: (data) => {
      persistSession(data);
      toast.success("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Ro'yxatdan o'tishda xatolik"));
    },
  });
}

export function useTelegramLogin() {
  return useMutation({
    mutationFn: (payload: TelegramLoginPayload) =>
      api.post<AuthResponse>('/auth/telegram', payload, { skipAuth: true }),
    onSuccess: (data) => {
      persistSession(data);
      toast.success('Xush kelibsiz!');
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Kodni tasdiqlashda xatolik'));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearAuthCookies();
      useAuthStore.getState().clear();
      queryClient.clear();
      router.push('/login');
      toast.success('Tizimdan chiqdingiz');
    },
  });
}
