// Super-ustoz → "Dars": mavzu slaydlari + doskada mustahkamlash mashqlari

export type LessonThemeKey = 'ocean' | 'sunset' | 'forest' | 'galaxy' | 'candy' | 'sun';

// text — faqat matn; split — matn + rasm yonma-yon; image — katta rasm + qisqa izoh
export type SlideLayout = 'text' | 'split' | 'image';

export interface BoardLessonSlide {
  _id?: string;
  // ≤120 belgi
  title: string;
  // Markdown, ≤2000 belgi, ko'pi bilan 3 ta rasm
  body: string;
  image?: string | null;
  layout: SlideLayout;
  // Bezak belgisi kaliti (LESSON_ICONS), null — belgisiz
  icon?: string | null;
  // null — dars mavzusi rangida
  theme?: LessonThemeKey | null;
}

// Test (variantli) mashq: 2–4 variant, bitta to'g'ri javob
export interface BoardLessonExercise {
  _id?: string;
  text: string;
  image?: string | null;
  options: string[];
  correctIndex: number;
}

export interface BoardLessonSummary {
  _id: string;
  title: string;
  subject?: string | null;
  grade?: number | null;
  theme: LessonThemeKey;
  coverImage?: string | null;
  slideCount: number;
  exerciseCount: number;
  updatedAt: string;
}

export interface BoardLesson extends BoardLessonSummary {
  description?: string | null;
  createdBy?: string | { _id: string; name?: string } | null;
  createdAt?: string;
  slides: BoardLessonSlide[];
  exercises: BoardLessonExercise[];
}

// POST /board-lessons/generate — AI qoralamasi (bazaga saqlanmaydi)
export interface BoardLessonGenerateRequest {
  topic: string;
  grade: number;
  subject?: string;
  slideCount: number;
  exerciseCount: number;
  notes?: string;
}

export interface BoardLessonDraft {
  title: string;
  description?: string | null;
  subject?: string | null;
  grade?: number | null;
  theme?: LessonThemeKey | null;
  slides: Partial<BoardLessonSlide>[];
  exercises: Partial<BoardLessonExercise>[];
}

export interface BoardLessonPayload {
  title: string;
  description?: string;
  subject?: string;
  grade?: number | null;
  theme: LessonThemeKey;
  slides: BoardLessonSlide[];
  exercises: BoardLessonExercise[];
}
