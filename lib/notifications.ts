import { ASSET_URL } from '@/lib/config';
import type { Notification, Role } from '@/types';

export interface ResolvedNotificationLink {
  href: string;
  // true — boshqa domenga (masalan sertifikat PDF fayliga) ishora qiladi,
  // yangi tabda ochilishi kerak; false — o'zimizning frontend sahifamiz,
  // Next.js Link orqali ichki navigatsiya qilinadi.
  external: boolean;
}

const ASSET_HOST = (() => {
  try {
    return new URL(ASSET_URL).hostname;
  } catch {
    return null;
  }
})();

// Backend meta.url'da to'liq havola yuboradi (masalan
// "https://edu-platform.uz/student/daily-spin" yoki backend fayl-serveridagi
// sertifikat PDF'i). Fayl-server hostiga ishora qilsa — tashqi hisoblanadi
// (yangi tabda ochiladi), aks holda — bizning frontend yo'limiz, shuning
// uchun faqat pathname+search+hash qismi ichki navigatsiya uchun olinadi.
export function resolveNotificationUrl(url: string | undefined | null): ResolvedNotificationLink | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const external = ASSET_HOST != null && parsed.hostname === ASSET_HOST;
    return {
      href: external ? url : `${parsed.pathname}${parsed.search}${parsed.hash}`,
      external,
    };
  } catch {
    return null;
  }
}

// meta.url hali yo'q eski bildirishnoma yozuvlari uchun zaxira yo'l —
// faqat 'quiz' turi va quizId+attemptId mavjud bo'lganda ishlaydi.
function resolveLegacyQuizLink(
  notification: Notification,
  role: Role | undefined
): ResolvedNotificationLink | null {
  if (notification.type !== 'quiz' || !notification.meta?.quizId || !notification.meta?.attemptId) {
    return null;
  }
  const { quizId, attemptId } = notification.meta;
  if (role === 'student') {
    return { href: `/student/quizzes/${quizId}/attempts/${attemptId}`, external: false };
  }
  if (role === 'teacher') {
    return { href: `/teacher/quizzes/${quizId}/results/${attemptId}`, external: false };
  }
  return null;
}

export function resolveNotificationLink(
  notification: Notification,
  role: Role | undefined
): ResolvedNotificationLink | null {
  return resolveNotificationUrl(notification.meta?.url) ?? resolveLegacyQuizLink(notification, role);
}
