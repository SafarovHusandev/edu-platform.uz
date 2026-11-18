// Super-ustoz asboblari (tasodifiy o'quvchi, guruhlarga bo'lish) uchun umumiy
// yordamchilar: sinf ro'yxati, aralashtirish va doska ovozlari.

export interface RosterStudent {
  id: string;
  name: string;
  // Faqat sinf ro'yxatidan kelganda (nisbiy yo'l yoki null)
  avatar?: string | null;
}

export const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => i + 1);
export const GRADE_LETTERS = ['A', 'B', 'V', 'C', 'D', 'E', 'F'];

// Oxirgi tanlangan manba — keyingi safar shu yerdan davom etadi
export type RosterSource =
  | { mode: 'class'; grade: number; letter: string }
  | { mode: 'manual'; text: string };

const STORAGE_KEY = 'st-roster-source';

export function readRosterSource(): RosterSource | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RosterSource;
    if (parsed?.mode === 'class' || parsed?.mode === 'manual') return parsed;
  } catch {}
  return null;
}

export function saveRosterSource(source: RosterSource) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(source));
  } catch {}
}

// Har qatorda bitta ism; "1. Ali", "2) Vali" kabi raqamlar olib tashlanadi
export function parseNames(text: string): RosterStudent[] {
  const seen = new Map<string, number>();
  return text
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*\d+\s*[.)-]?\s*/, '').trim())
    .filter(Boolean)
    .map((name) => {
      const n = (seen.get(name) ?? 0) + 1;
      seen.set(name, n);
      return { id: `m:${name}:${n}`, name };
    });
}

function randomInt(max: number) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function pickRandom<T>(items: T[]): T {
  return items[randomInt(items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Ovoz (WebAudio, fayl yuklamasdan) ----

let audioCtx: AudioContext | null = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  try {
    audioCtx ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch {
    return null;
  }
}

export function playTone(freq: number, durationMs = 120, volume = 0.15, delayMs = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

export const sounds = {
  tick: () => playTone(880, 40, 0.06),
  win: () => {
    playTone(523, 140, 0.18);
    playTone(659, 140, 0.18, 120);
    playTone(784, 260, 0.2, 240);
  },
  alarm: () => {
    for (let i = 0; i < 3; i++) {
      playTone(988, 220, 0.25, i * 450);
      playTone(784, 220, 0.25, i * 450 + 220);
    }
  },
  beep: () => playTone(660, 90, 0.12),
  wrong: () => {
    playTone(311, 160, 0.16);
    playTone(233, 260, 0.16, 150);
  },
  whoosh: () => playTone(520, 70, 0.05),
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, 180, 0.2, i * 140));
    playTone(1047, 600, 0.22, 4 * 140);
    playTone(784, 600, 0.14, 4 * 140);
  },
};
