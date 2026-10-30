'use client';

import { useUnreadNotificationsCount } from '@/hooks/use-notifications';
import { usePendingReviewsCount, useQuizShares } from '@/hooks/use-quizzes';
import { useAdminStats } from '@/hooks/use-stats';
import type { NavBadgeKey } from '@/lib/roles';
import type { Role } from '@/types';

// Menyu bandlaridagi son belgilari. Har bir rol faqat o'ziga kerak bo'lgan
// so'rovlarni yuboradi (qolganlari enabled: false).
export function useNavBadges(role: Role): Record<NavBadgeKey, number> {
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin' || role === 'superadmin';

  const { data: unread } = useUnreadNotificationsCount();
  const { data: incomingShares } = useQuizShares('incoming', 'pending', { enabled: isTeacher });
  const { data: pendingReviews } = usePendingReviewsCount({ enabled: isTeacher });
  const { data: adminStats } = useAdminStats({ enabled: isAdmin });

  return {
    notifications: unread ?? 0,
    incomingShares: incomingShares?.length ?? 0,
    pendingReviews: pendingReviews ?? 0,
    pendingUsers: adminStats?.pendingUsers ?? 0,
    pendingRedemptions: adminStats?.pendingRedemptions ?? 0,
  };
}
