'use client';

import { useSyncExternalStore } from 'react';

// Bir marta "keyinroq" deb yopilgan muloyim eslatma/upsell bannerlarini
// localStorage orqali kuzatib boradi — qayta-qayta ko'rsatilmasligi uchun.
// useSyncExternalStore orqali — localStorage kabi tashqi manbani effekt ichida
// setState qilish o'rniga to'g'ri usulda o'qish uchun (react-hooks/set-state-in-effect).
const listeners = new Map<string, Set<() => void>>();

function getSnapshot(key: string) {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

function subscribe(key: string, callback: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);
  return () => set.delete(callback);
}

function notify(key: string) {
  listeners.get(key)?.forEach((callback) => callback());
}

export function useDismissedBanner(key: string) {
  const dismissed = useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => getSnapshot(key),
    getServerSnapshot
  );

  function dismiss() {
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // localStorage yo'q/bloklangan bo'lsa — jim
    }
    notify(key);
  }

  return { dismissed, dismiss };
}
