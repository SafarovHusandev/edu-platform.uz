import {
  Atom,
  BookOpen,
  Calculator,
  Compass,
  FlaskConical,
  Globe2,
  Lightbulb,
  Music,
  Palette,
  PawPrint,
  Rocket,
  Sparkles,
  Sprout,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { LIVE_LIMITS, countMarkdownImages, newQuestion, validateQuestions } from '@/lib/live-quiz';
import type { LiveQuizQuestion } from '@/types/live-quiz';
import type {
  BoardLessonDraft,
  BoardLessonExercise,
  BoardLessonSlide,
  LessonThemeKey,
  SlideLayout,
} from '@/types/board-lesson';

export const LESSON_LIMITS = {
  titleMax: 120,
  descriptionMax: 500,
  subjectMax: 60,
  slideTitleMax: 120,
  slideBodyMax: LIVE_LIMITS.textMax,
  slidesMax: 50,
  exercisesMax: 50,
} as const;

// Doska fonlari: oq matn bilan yuqori kontrast (to'q to'yingan ranglar)
export const LESSON_THEMES: Record<
  LessonThemeKey,
  { label: string; gradient: string; accent: string; blob1: string; blob2: string; swatch: string }
> = {
  ocean: {
    label: 'Okean',
    gradient: 'bg-gradient-to-br from-[#0B3B8C] via-[#1559C9] to-[#0A7CA8]',
    accent: '#5FD4FF',
    blob1: '#3BA9FF',
    blob2: '#00E0C6',
    swatch: 'bg-[#1559C9]',
  },
  sunset: {
    label: 'Shafaq',
    gradient: 'bg-gradient-to-br from-[#9C1F4A] via-[#C8382F] to-[#C25A10]',
    accent: '#FFD166',
    blob1: '#FF8A5B',
    blob2: '#FFC145',
    swatch: 'bg-[#C8382F]',
  },
  forest: {
    label: "O'rmon",
    gradient: 'bg-gradient-to-br from-[#0E5C3A] via-[#16794A] to-[#0F6E6E]',
    accent: '#B6F36A',
    blob1: '#4ADE80',
    blob2: '#2DD4BF',
    swatch: 'bg-[#16794A]',
  },
  galaxy: {
    label: 'Koinot',
    gradient: 'bg-gradient-to-br from-[#1E1250] via-[#3B1E8C] to-[#5B1B8F]',
    accent: '#C4B5FD',
    blob1: '#8B5CF6',
    blob2: '#EC4899',
    swatch: 'bg-[#3B1E8C]',
  },
  candy: {
    label: 'Qandolat',
    gradient: 'bg-gradient-to-br from-[#8E1A6B] via-[#B02486] to-[#6D28D9]',
    accent: '#FBCFE8',
    blob1: '#F472B6',
    blob2: '#A78BFA',
    swatch: 'bg-[#B02486]',
  },
  sun: {
    label: 'Quyosh',
    gradient: 'bg-gradient-to-br from-[#8A3B00] via-[#B45309] to-[#A16207]',
    accent: '#FDE047',
    blob1: '#FBBF24',
    blob2: '#FB923C',
    swatch: 'bg-[#B45309]',
  },
};

export const LESSON_THEME_KEYS = Object.keys(LESSON_THEMES) as LessonThemeKey[];

export function lessonTheme(key?: LessonThemeKey | null) {
  return LESSON_THEMES[key && key in LESSON_THEMES ? key : 'ocean'];
}

export const LESSON_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  lightbulb: { label: "G'oya", icon: Lightbulb },
  book: { label: 'Kitob', icon: BookOpen },
  star: { label: 'Yulduz', icon: Star },
  rocket: { label: 'Raketa', icon: Rocket },
  atom: { label: 'Atom', icon: Atom },
  flask: { label: 'Tajriba', icon: FlaskConical },
  calculator: { label: 'Matematika', icon: Calculator },
  compass: { label: 'Geometriya', icon: Compass },
  globe: { label: 'Geografiya', icon: Globe2 },
  sprout: { label: 'Tabiat', icon: Sprout },
  paw: { label: 'Hayvonlar', icon: PawPrint },
  music: { label: 'Musiqa', icon: Music },
  palette: { label: "San'at", icon: Palette },
  trophy: { label: 'Kubok', icon: Trophy },
  sparkles: { label: 'Sehr', icon: Sparkles },
};

export const SLIDE_LAYOUTS: { value: SlideLayout; label: string }[] = [
  { value: 'text', label: 'Matn' },
  { value: 'split', label: 'Matn + rasm' },
  { value: 'image', label: 'Katta rasm' },
];

export const PRAISES = ['Barakalla!', 'Zo’r!', 'Ajoyib!', 'Qoyil!', 'Super!', 'Juda yaxshi!', 'Daho!'];
export const RETRY_HINTS = ["Yana bir urinib ko'ring!", "Deyarli! Yana o'ylab ko'ring", 'Hechqisi yo’q, yana!'];

export function newSlide(): BoardLessonSlide {
  return { title: '', body: '', image: null, layout: 'text', icon: 'lightbulb', theme: null };
}

// Mashqlar muharrirda jonli viktorina savol kartasi bilan tahrirlanadi
export function exerciseToQuestion(e: BoardLessonExercise): LiveQuizQuestion {
  return { ...newQuestion(), text: e.text, image: e.image ?? null, options: [...e.options], correctIndex: e.correctIndex };
}

export function questionToExercise(q: LiveQuizQuestion): BoardLessonExercise {
  return {
    text: q.text,
    image: q.image || null,
    options: q.options.map((o) => o.trim()),
    correctIndex: q.correctIndex,
  };
}

export function sanitizeSlide(s: BoardLessonSlide): BoardLessonSlide {
  return {
    title: s.title.trim(),
    body: s.body,
    image: s.image || null,
    layout: s.layout,
    icon: s.icon || null,
    theme: s.theme || null,
  };
}

// Backend markdown'da faqat ![](/uploads/board-lessons/...) rasmlarini qabul qiladi:
// base64, tashqi havola va HTML <img> rad etiladi
const MD_IMAGE_SRC_RE = /!\[[^\]]*\]\(\s*<?([^)\s>]*)/g;

export function markdownImageProblems(text: string) {
  const problems: string[] = [];
  if (/<img\b/i.test(text)) problems.push('HTML <img> ishlatmang — rasmni muharrir tugmasi bilan qo’shing');
  for (const match of text.matchAll(MD_IMAGE_SRC_RE)) {
    const src = match[1] ?? '';
    if (src.startsWith('data:')) {
      problems.push("Matnga qo'yilgan rasm yuklanmagan (base64) — rasmni qayta qo'shing");
      break;
    }
    if (!src.startsWith('/uploads/')) {
      problems.push('Tashqi havoladagi rasm qabul qilinmaydi — rasmni yuklab qo’shing');
      break;
    }
  }
  return problems;
}

export function validateExercises(questions: LiveQuizQuestion[]) {
  const errors = validateQuestions(questions);
  questions.forEach((q, i) => {
    const extra = markdownImageProblems(q.text);
    if (extra.length) errors[i] = [...(errors[i] ?? []), ...extra];
  });
  return errors;
}

export function validateSlides(slides: BoardLessonSlide[]) {
  const errors: Record<number, string[]> = {};
  slides.forEach((s, i) => {
    const list: string[] = [];
    if (!s.title.trim() && !s.body.trim() && !s.image) list.push("Slayd bo'sh — sarlavha, matn yoki rasm qo'shing");
    if (s.body.length > LESSON_LIMITS.slideBodyMax) list.push('Matn 2000 belgidan oshmasin');
    if (countMarkdownImages(s.body) > LIVE_LIMITS.imagesPerText)
      list.push("Matnda ko'pi bilan 3 ta rasm bo'lishi mumkin");
    if (s.layout !== 'text' && !s.image) list.push('Bu ko’rinish uchun rasm yuklang');
    list.push(...markdownImageProblems(s.body));
    if (list.length) errors[i] = list;
  });
  return errors;
}

// To'g'ri javobgacha urinishlar soni bo'yicha yulduzlar
export function starsForAttempts(wrongAttempts: number, revealed: boolean) {
  if (revealed) return 0;
  return wrongAttempts === 0 ? 3 : wrongAttempts === 1 ? 2 : 1;
}

// AI qoralamasini muharrir qabul qiladigan holatga keltirish: uzunliklar qirqiladi,
// noma'lum belgi/rang tashlanadi, variantlar 2–4 ta, correctIndex chegarada.
// AI rasm yuklamaydi — slaydlar faqat matnli, markdown rasmlari olib tashlanadi.
export function normalizeDraft(draft: BoardLessonDraft) {
  const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const noImages = (text: string) => text.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<img\b[^>]*>/gi, '');
  const themeOk = (t: unknown): t is LessonThemeKey => typeof t === 'string' && t in LESSON_THEMES;

  const slides: BoardLessonSlide[] = (draft.slides ?? [])
    .slice(0, LESSON_LIMITS.slidesMax)
    .map((s) => ({
      title: clip(s.title, LESSON_LIMITS.slideTitleMax),
      body: clip(noImages(String(s.body ?? '')), LESSON_LIMITS.slideBodyMax),
      image: null,
      layout: 'text' as const,
      icon: s.icon && LESSON_ICONS[s.icon] ? s.icon : 'lightbulb',
      theme: themeOk(s.theme) ? s.theme : null,
    }))
    .filter((s) => s.title || s.body);

  const exercises: BoardLessonExercise[] = (draft.exercises ?? [])
    .slice(0, LESSON_LIMITS.exercisesMax)
    .map((e) => {
      const options = (e.options ?? [])
        .map((o) => clip(o, LIVE_LIMITS.optionMax))
        .filter(Boolean)
        .slice(0, LIVE_LIMITS.optionsMax);
      const correct = Number(e.correctIndex);
      return {
        text: clip(noImages(String(e.text ?? '')), LIVE_LIMITS.textMax),
        image: null,
        options,
        correctIndex: Number.isInteger(correct) && correct >= 0 && correct < options.length ? correct : 0,
      };
    })
    .filter((e) => e.text && e.options.length >= LIVE_LIMITS.optionsMin);

  const grade = Number(draft.grade);
  return {
    title: clip(draft.title, LESSON_LIMITS.titleMax),
    description: clip(draft.description, LESSON_LIMITS.descriptionMax),
    subject: clip(draft.subject, LESSON_LIMITS.subjectMax),
    grade: Number.isInteger(grade) && grade >= 1 && grade <= 11 ? grade : null,
    theme: themeOk(draft.theme) ? draft.theme : null,
    slides,
    exercises,
  };
}

// 422 javobi: errors: [{ field: "slides[2].title" | "exercises[0].options" | "title", message }]
export interface ParsedLessonValidation {
  slides: Record<number, string[]>;
  exercises: Record<number, string[]>;
  fields: Record<string, string>;
}

export function parseLessonValidation(error: unknown): ParsedLessonValidation | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const raw = error.errors as unknown;
  const result: ParsedLessonValidation = { slides: {}, exercises: {}, fields: {} };
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
    const match = /^(slides|exercises)\[(\d+)\]/.exec(field);
    if (match) {
      const bucket = match[1] === 'slides' ? result.slides : result.exercises;
      (bucket[Number(match[2])] ??= []).push(message);
    } else {
      result.fields[field || '_'] = message;
    }
  }
  if (!list.length) result.fields._ = error.message;
  return result;
}
