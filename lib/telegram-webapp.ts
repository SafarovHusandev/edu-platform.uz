// Telegram Mini App (WebApp) bilan ishlash uchun yordamchilar.
// Rasmiy skript (telegram-web-app.js) root layout'da yuklanadi, lekin u
// hydration'ni kutib turmaydi — shu sabab initData'ni zaxira manbalardan ham
// o'qiymiz: URL hash'idagi "tgWebAppData" va skript sahifalar orasida o'tganda
// saqlaydigan sessionStorage yozuvi.

interface TelegramBottomButton {
  isVisible: boolean;
  setText: (text: string) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
  setParams?: (params: { color?: string; text_color?: string }) => void;
}

interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TelegramHaptic {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

interface TelegramWebApp {
  initData: string;
  version?: string;
  platform?: string;
  colorScheme?: 'light' | 'dark';
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  MainButton?: TelegramBottomButton;
  BackButton?: TelegramBackButton;
  HapticFeedback?: TelegramHaptic;
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

function supports(version: string) {
  const webApp = getTelegramWebApp();
  if (!webApp?.initData) return false;
  try {
    return !!webApp.isVersionAtLeast?.(version);
  } catch {
    return false;
  }
}

// BackButton/HapticFeedback/setHeaderColor 6.1+ dan; eski klientlarda chaqiruv xato beradi.
// Sahifa oddiy brauzerda ochilganda (initData yo'q) ham false.
export function supportsNativeButtons() {
  return supports('6.1');
}

export function haptic(kind: 'success' | 'error' | 'warning' | 'light' | 'selection') {
  if (!supportsNativeButtons()) return;
  const h = getTelegramWebApp()?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === 'light') h.impactOccurred('light');
    else if (kind === 'selection') h.selectionChanged();
    else h.notificationOccurred(kind);
  } catch {
    // eski klient — jim
  }
}

// Telegram sarlavhasi va fonini ilova foniga moslaydi (#rrggbb kerak)
export function setTelegramChromeColor(color: string) {
  if (!supports('6.1')) return;
  const webApp = getTelegramWebApp();
  try {
    webApp?.setHeaderColor?.(color);
    webApp?.setBackgroundColor?.(color);
    if (supports('7.10')) webApp?.setBottomBarColor?.(color);
  } catch {
    // jim
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
