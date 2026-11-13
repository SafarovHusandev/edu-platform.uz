import { ASSET_URL } from '@/lib/config';
import { ApiError } from '@/lib/api-client';
import type { LiveQuizQuestion, PointsMultiplier } from '@/types/live-quiz';

// Socket.IO namespace — server manzili (REST bilan bir xil host)
export const LIVE_SOCKET_URL = `${ASSET_URL}/live-quiz`;

export const LIVE_LIMITS = {
  titleMax: 120,
  descriptionMax: 500,
  textMax: 2000,
  optionMax: 120,
  optionsMin: 2,
  optionsMax: 4,
  questionsMax: 100,
  imagesPerText: 3,
  imageMaxBytes: 5 * 1024 * 1024,
  nameMax: 24,
} as const;

export const LIVE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const TIME_LIMIT_OPTIONS = [5, 10, 20, 30, 60, 90, 120] as const;

export const POINTS_OPTIONS: { value: PointsMultiplier; label: string }[] = [
  { value: 0, label: 'Ballsiz' },
  { value: 1, label: 'Oddiy' },
  { value: 2, label: 'Ikki barobar' },
];

export const TRUE_FALSE_OPTIONS = ["To'g'ri", "Noto'g'ri"];

// Nisbiy yo'llar (/uploads/...) frontend emas, server domeniga ulanadi
export function toServerUrl(src?: string | null) {
  if (!src) return undefined;
  return src.startsWith('/') ? `${ASSET_URL}${src}` : src;
}

const MD_IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;

export function countMarkdownImages(text: string) {
  return text.match(MD_IMAGE_RE)?.length ?? 0;
}

// Telefon va kartalar uchun qisqa matn: rasm va markdown belgilarisiz
export function plainQuestionText(text: string, max = 80) {
  const plain = text
    .replace(MD_IMAGE_RE, '')
    .replace(/[#>*_`~\-[\]()|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}

// Yuklashdan oldingi tekshiruv. Xato bo'lsa — matn, aks holda null.
export function validateImageFile(file: File) {
  if (!LIVE_IMAGE_TYPES.includes(file.type)) return `"${file.name}": faqat JPG, PNG yoki WEBP`;
  if (file.size > LIVE_LIMITS.imageMaxBytes) return `"${file.name}": 5 MB dan katta`;
  return null;
}

export function newQuestion(): LiveQuizQuestion {
  return {
    text: '',
    image: null,
    options: ['', ''],
    correctIndex: 0,
    timeLimit: 20,
    pointsMultiplier: 1,
  };
}

// Client tomonidagi tekshiruv: savol indeksi -> xatolar
export function validateQuestions(questions: LiveQuizQuestion[]) {
  const errors: Record<number, string[]> = {};
  questions.forEach((q, i) => {
    const list: string[] = [];
    if (!q.text.trim()) list.push('Savol matnini kiriting');
    if (q.text.length > LIVE_LIMITS.textMax) list.push('Matn 2000 belgidan oshmasin');
    if (countMarkdownImages(q.text) > LIVE_LIMITS.imagesPerText)
      list.push("Matnda ko'pi bilan 3 ta rasm bo'lishi mumkin");
    const filled = q.options.filter((o) => o.trim());
    if (filled.length < LIVE_LIMITS.optionsMin) list.push('Kamida 2 ta variant kiriting');
    else if (filled.length !== q.options.length) list.push("Bo'sh variantni to'ldiring yoki o'chiring");
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length || !q.options[q.correctIndex]?.trim())
      list.push("To'g'ri javobni belgilang");
    if (list.length) errors[i] = list;
  });
  return errors;
}

// 422 javobidagi errors: [{ field: "questions[2].options", message }]
export interface ParsedValidation {
  questions: Record<number, string[]>;
  fields: Record<string, string>;
}

export function parseValidationErrors(error: unknown): ParsedValidation | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const raw = error.errors as unknown;
  const result: ParsedValidation = { questions: {}, fields: {} };
  const list: { field?: string; message?: string }[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.entries(raw as Record<string, string[] | string>).map(([field, msg]) => ({
          field,
          message: Array.isArray(msg) ? msg[0] : msg,
        }))
      : [];
  for (const item of list) {
    const field = item.field ?? '';
    const message = item.message ?? error.message;
    const match = /^questions\[(\d+)\]/.exec(field);
    if (match) {
      const index = Number(match[1]);
      (result.questions[index] ??= []).push(message);
    } else {
      result.fields[field || '_'] = message;
    }
  }
  if (!list.length) result.fields._ = error.message;
  return result;
}

export function sanitizeQuestion(q: LiveQuizQuestion): LiveQuizQuestion {
  return {
    text: q.text,
    image: q.image || null,
    options: q.options.map((o) => o.trim()),
    correctIndex: q.correctIndex,
    timeLimit: q.timeLimit,
    pointsMultiplier: q.pointsMultiplier,
  };
}

// Socket xato kodlari -> foydalanuvchiga matn
export const LIVE_ERROR_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "Bunday PIN bilan o'yin topilmadi",
  GAME_STARTED: "O'yin allaqachon boshlangan",
  GAME_FULL: "O'yinda joy qolmadi",
  NAME_REQUIRED: 'Ism kiriting',
  NAME_TOO_LONG: '24 belgidan oshmasin',
  NAME_TAKEN: 'Bu ism band',
  ALREADY_JOINED: "Siz bu o'yinga allaqachon qo'shilgansiz",
  RATE_LIMITED: 'Biroz kuting',
  UNAUTHORIZED: "Bu o'yinni boshqarishga ruxsat yo'q",
  FORBIDDEN: "Bu o'yinni boshqarishga ruxsat yo'q",
  NOT_HOST: "Bu o'yinni boshqarishga ruxsat yo'q",
  NO_PLAYERS: "Hali hech kim qo'shilmagan",
  TIMEOUT: 'Server javob bermadi — internetni tekshiring',
};

// Jim o'tkazib yuboriladigan kodlar: holat serverdan keladi
export const SILENT_CODES = new Set([
  'ALREADY_ANSWERED',
  'QUESTION_CLOSED',
  'INVALID_OPTION',
]);

export function liveErrorMessage(code?: string, fallback?: string) {
  return (code && LIVE_ERROR_MESSAGES[code]) || fallback || "Xatolik yuz berdi, qayta urinib ko'ring";
}

export function playerKeyStorageKey(pin: string) {
  return `live:${pin}`;
}

export function readPlayerKey(pin: string) {
  try {
    return sessionStorage.getItem(playerKeyStorageKey(pin));
  } catch {
    return null;
  }
}

export function writePlayerKey(pin: string, key: string) {
  try {
    sessionStorage.setItem(playerKeyStorageKey(pin), key);
  } catch {
    // sessionStorage yopiq (maxfiy rejim) — qayta kirish ishlamaydi, o'yin davom etadi
  }
}

export function clearPlayerKey(pin: string) {
  try {
    sessionStorage.removeItem(playerKeyStorageKey(pin));
  } catch {
    // e'tiborsiz
  }
}
