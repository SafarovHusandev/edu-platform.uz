'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Qidiruv matnini URL'da (?search=) saqlaydi — sahifa yangilanganda yoki havola
// ulashilganda qidiruv yo'qolmaydi. `replace` ishlatiladi: har bir yozilgan so'z
// brauzer tarixiga alohida yozuv bo'lib tushmasligi uchun.
// Komponent <Suspense> ichida bo'lishi kerak (useSearchParams talabi).
export function useUrlSearch(onChange?: () => void) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get('search')?.trim() ?? '';

  const setSearch = useCallback(
    (value: string) => {
      const next = value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('search', next);
      else params.delete('search');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      onChange?.();
    },
    [router, pathname, searchParams, onChange]
  );

  return [search, setSearch] as const;
}
