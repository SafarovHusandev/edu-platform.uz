// Telegram Mini App (WebApp) bilan ishlash uchun yordamchilar.
// Rasmiy skript (telegram-web-app.js) root layout'da yuklanadi, lekin u
// hydration'ni kutib turmaydi — shu sabab initData'ni zaxira manbalardan ham
// o'qiymiz: URL hash'idagi "tgWebAppData" va skript sahifalar orasida o'tganda
// saqlaydigan sessionStorage yozuvi.

interface TelegramWebApp {
  initData: string;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  openTelegramLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const SESSION_KEY = '__telegram__initParams';

function initDataFromParams(raw: string) {
  return new URLSearchParams(raw).get('tgWebAppData') ?? '';
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return undefined;
  return window.Telegram?.WebApp;
}

// Mini App ichida ochilmagan bo'lsa bo'sh satr qaytaradi.
export function getTelegramInitData() {
  if (typeof window === 'undefined') return '';

  const fromScript = window.Telegram?.WebApp?.initData;
  if (fromScript) return fromScript;

  const fromHash = initDataFromParams(window.location.hash.slice(1));
  if (fromHash) return fromHash;

  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as {
      tgWebAppData?: string;
    } | null;
    return stored?.tgWebAppData ?? '';
  } catch {
    return '';
  }
}

export function openTelegramLink(url: string) {
  const webApp = getTelegramWebApp();
  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url);
    return;
  }
  window.open(url, '_blank');
}
