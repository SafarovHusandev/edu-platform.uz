'use client';

import { useEffect } from 'react';

// Saqlanmagan o'zgarishlar bo'lsa: sahifani yopish/yangilashda brauzer
// ogohlantiradi, ichki havolalar (Next <Link>) bosilganda esa tasdiq so'raladi.
// App Router'da route o'zgarish hodisasi yo'q — shuning uchun havola bosilishi
// capture bosqichida ushlanadi (React'ning ildiz tinglovchisidan oldin).
export function useUnsavedChangesWarning(
  when: boolean,
  message = "Saqlanmagan o'zgarishlar bor. Sahifadan chiqasizmi?"
) {
  useEffect(() => {
    if (!when) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [when, message]);
}
