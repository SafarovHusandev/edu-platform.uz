'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import type { AttemptStatus, Paginated, Redemption } from '@/types';

// Admin: bitta foydalanuvchining tarixi — GET /users/:id/<kind>.
// Shakllar "Admin: foydalanuvchi tarixi — backend spec" hujjatiga mos.

type Ref = { _id: string; title?: string } | null;
type Actor = { _id: string; name: string; role?: string } | null;

export interface UserAttemptItem {
  _id: string;
  quiz: Ref;
  attemptNumber?: number;
  status: AttemptStatus;
  scorePercent?: number | null;
  earnedPoints?: number | null;
  totalPoints?: number | null;
  passed?: boolean;
  diamondsEarned?: number | null;
  startedAt?: string;
  submittedAt?: string | null;
  durationSeconds?: number | null;
}

export interface UserEnrollmentItem {
  _id: string;
  course: Ref;
  progress?: number;
  completedLessonsCount?: number;
  totalLessons?: number;
  status?: 'active' | 'completed' | (string & {});
  createdAt?: string;
  completedAt?: string | null;
}

export type DiamondSource =
  'quiz' | 'spin' | 'live_quiz' | 'reward' | 'reward_refund' | 'attempt_revoked' | 'admin_adjust';

export interface DiamondHistoryItem {
  _id: string;
  amount: number;
  type: 'earn' | 'spend';
  source: DiamondSource | (string & {});
  ref?: { kind: string; _id: string; title?: string } | null;
  balanceAfter?: number | null;
  note?: string | null;
  actor?: Actor;
  createdAt: string;
}

export interface DiamondHistoryResult extends Paginated<DiamondHistoryItem> {
  summary?: { totalEarned: number; totalSpent: number; balance: number };
}

export interface UserSpinItem {
  _id: string;
  diamondsWon: number;
  question?: { _id: string; text: string } | null;
  answeredCorrectly?: boolean | null;
  status?: 'answered' | 'expired' | (string & {});
  createdAt: string;
}

export interface UserCertificateItem {
  _id: string;
  certificateNumber: string;
  course: Ref;
  issuedAt: string;
}

export type UserActivityType =
  | 'login'
  | 'register'
  | 'verified'
  | 'blocked'
  | 'unblocked'
  | 'role_changed'
  | 'tarif_changed'
  | 'grade_changed'
  | 'password_reset'
  | 'avatar_removed'
  | 'profile_updated';

export interface UserActivityItem {
  _id: string;
  type: UserActivityType | (string & {});
  actor?: Actor;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

interface UserHistoryKinds {
  attempts: Paginated<UserAttemptItem>;
  enrollments: Paginated<UserEnrollmentItem>;
  'diamond-history': DiamondHistoryResult;
  'spin-history': Paginated<UserSpinItem>;
  certificates: Paginated<UserCertificateItem>;
  activity: Paginated<UserActivityItem>;
}

export type UserHistoryKind = keyof UserHistoryKinds;

export const HISTORY_PAGE_SIZE = 20;

// 404 — endpoint hali backend'da yo'q (foydalanuvchi o'zi mavjudligi sahifada tekshirilgan)
export function isEndpointMissing(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

export function useUserHistory<K extends UserHistoryKind>(
  userId: string,
  kind: K,
  params: { page: number; limit?: number } & Record<string, string | number | undefined>
) {
  return useQuery({
    queryKey: ['user-history', userId, kind, params],
    queryFn: () =>
      api.get<UserHistoryKinds[K]>(`/users/${userId}/${kind}`, {
        limit: HISTORY_PAGE_SIZE,
        ...params,
      }),
    placeholderData: (prev) => prev,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && [403, 404, 422].includes(error.status)) && failureCount < 3,
  });
}

// Sovg'a so'rovlari: backend `userId` filtrini qo'llab-quvvatlamaguncha telefon
// bo'yicha `search` zaxira sifatida ham yuboriladi (spec: /rewards/redemptions?userId=)
export function useUserRedemptions(userId: string, phone: string, page: number) {
  return useQuery({
    queryKey: ['all-redemptions', { userId, phone, page }],
    queryFn: () =>
      api.get<Paginated<Redemption>>('/rewards/redemptions', {
        userId,
        search: phone,
        page,
        limit: HISTORY_PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });
}
