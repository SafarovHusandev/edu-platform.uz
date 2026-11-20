'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import type { AttemptStatus, Paginated, Redemption, RedemptionStatus } from '@/types';

// Admin: bitta foydalanuvchining tarixi — GET /users/:id/<kind>.
// Hammasida page, limit (default 20), from, to (ISO, createdAt bo'yicha); eng yangisi birinchi.

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
  // Faqat 1-urinishda bo'ladi, keyingilarida null
  diamondsEarned?: number | null;
  startedAt?: string;
  submittedAt?: string | null;
  durationSeconds?: number | null;
}

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface UserEnrollmentItem {
  _id: string;
  course: Ref;
  progress?: number;
  completedLessonsCount?: number;
  totalLessons?: number;
  status?: EnrollmentStatus | (string & {});
  createdAt?: string;
  // Faqat status: "completed" da
  completedAt?: string | null;
}

export type DiamondSource =
  | 'quiz'
  | 'lesson'
  | 'spin'
  | 'live_quiz'
  | 'reward'
  | 'reward_refund'
  | 'attempt_revoked'
  | 'admin_adjust';

export interface DiamondHistoryItem {
  _id: string;
  amount: number;
  type: 'earn' | 'spend';
  source: DiamondSource | (string & {});
  // title — yozuv paytidagi nom; manba o'chirilgan bo'lsa ham keladi
  ref?: {
    kind: 'attempt' | 'lesson' | 'spin' | 'redemption' | 'live_session' | (string & {});
    _id: string;
    title?: string;
  } | null;
  balanceAfter?: number | null;
  note?: string | null;
  actor?: Actor;
  createdAt: string;
}

export interface DiamondHistoryResult extends Paginated<DiamondHistoryItem> {
  // Butun tarix bo'yicha, filtrdan qat'i nazar
  summary?: { totalEarned: number; totalSpent: number; balance: number };
}

export interface UserSpinItem {
  _id: string;
  diamondsWon: number;
  // Eski yozuvlarda null
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
  // null — foydalanuvchining o'zi yoki tizim (masalan premium muddati tugashi)
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

// Filtr qiymati: undefined — parametr umuman yuborilmaydi ("Hammasi")
export type HistoryParams = { page: number } & Record<string, string | number | undefined>;

function noRetryOnClientError(failureCount: number, error: Error) {
  return !(error instanceof ApiError && [403, 404, 422].includes(error.status)) && failureCount < 3;
}

export function useUserHistory<K extends UserHistoryKind>(
  userId: string,
  kind: K,
  params: HistoryParams
) {
  return useQuery({
    queryKey: ['user-history', userId, kind, params],
    queryFn: () =>
      api.get<UserHistoryKinds[K]>(`/users/${userId}/${kind}`, {
        limit: HISTORY_PAGE_SIZE,
        ...params,
      }),
    placeholderData: (prev) => prev,
    retry: noRetryOnClientError,
  });
}

export function useUserRedemptions(
  userId: string,
  params: HistoryParams & { status?: RedemptionStatus }
) {
  return useQuery({
    queryKey: ['all-redemptions', { userId, ...params }],
    queryFn: () =>
      api.get<Paginated<Redemption>>('/rewards/redemptions', {
        userId,
        limit: HISTORY_PAGE_SIZE,
        ...params,
      }),
    placeholderData: (prev) => prev,
    retry: noRetryOnClientError,
  });
}
