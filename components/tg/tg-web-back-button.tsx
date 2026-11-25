'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getTelegramWebApp, supportsNativeButtons } from '@/lib/telegram-webapp';

export const TG_MINI_FLAG = 'epu-tg-mini';

// Mini ilovadan (/tg) web sahifaga o'tilganda (dars tahriri, kurs yaratish va h.k.)
// Telegram ichida brauzer "orqaga" tugmasi yo'q — native BackButton bilan qaytaramiz.
export function TgWebBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith('/tg') || !supportsNativeButtons()) return;
    let fromMiniApp = false;
    try {
      fromMiniApp = sessionStorage.getItem(TG_MINI_FLAG) === '1';
    } catch {
      // jim
    }
    if (!fromMiniApp) return;
    const back = getTelegramWebApp()?.BackButton;
    if (!back) return;
    const handler = () => {
      if (window.history.length > 1) router.back();
      else router.replace('/tg');
    };
    back.onClick(handler);
    back.show();
    return () => {
      back.offClick(handler);
      back.hide();
    };
  }, [pathname, router]);

  return null;
}
