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
  initDataUnsafe?: { start_param?: string };
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

// Chuqur havola parametri (t.me/<bot>/<app>?startapp=grading yoki menyu tugmasi
// URL'idagi ?startapp=...). Telegram uni initData ichida, initDataUnsafe'da va
// URL'dagi tgWebAppStartParam sifatida beradi — qaysi biri bo'lsa o'shani olamiz.
export function getTelegramStartParam() {
  if (typeof window === 'undefined') return '';
  const fromUnsafe = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (fromUnsafe) return fromUnsafe;
  const fromInitData = new URLSearchParams(getTelegramInitData()).get('start_param');
  if (fromInitData) return fromInitData;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return (
    search.get('tgWebAppStartParam') ??
    hash.get('tgWebAppStartParam') ??
    search.get('startapp') ??
    ''
  );
}

// Telegram API (MainButton, sarlavha rangi) faqat #rrggbb qabul qiladi, dizayn
// tokenlari esa oklch'da. CSS o'zgaruvchisini joriy mavzu bo'yicha hex'ga
// o'giradi; brauzer oklch'ni bilmasa — zaxira qiymat.
export function cssVarHex(name: `--${string}`, fallback: string) {
  if (typeof document === 'undefined') return fallback;
  try {
    // Eski WebView oklch'ni tushunmasa o'zgaruvchi "yaroqsiz" bo'lib, meros rang qaytadi
    if (!CSS.supports('color', 'oklch(0.5 0.1 270)')) return fallback;
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!ctx || !computed) return fallback;
    ctx.fillStyle = '#000';
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return fallback;
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
