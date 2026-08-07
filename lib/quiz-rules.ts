// Backenddagi config/quizRules.js bilan bir xil: quizni faollashtirish
// (isActive: true) uchun kamida shuncha savol bo'lishi shart — uch bosqich:
// 1-4 (boshlang'ich), 5-8 (o'rta), 9-11 (yuqori).
export const ELEMENTARY_MAX_GRADE = 4;
export const MIDDLE_MAX_GRADE = 8;
export const MIN_QUESTIONS_ELEMENTARY = 10; // 1-4-sinflar uchun
export const MIN_QUESTIONS_MIDDLE = 20; // 5-8-sinflar uchun
export const MIN_QUESTIONS_SENIOR = 25; // 9-11-sinflar uchun

export function getMinQuestions(grade: number | undefined) {
  const g = grade ?? 1;
  if (g <= ELEMENTARY_MAX_GRADE) return MIN_QUESTIONS_ELEMENTARY;
  if (g <= MIDDLE_MAX_GRADE) return MIN_QUESTIONS_MIDDLE;
  return MIN_QUESTIONS_SENIOR;
}
