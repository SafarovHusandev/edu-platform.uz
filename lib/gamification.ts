import type { Attempt } from "@/types"

// Backenddagi QUIZ_MAX_REWARD (config/gamification.js) bilan bir xil:
// diamond = (scorePercent / 100) * 10, faqat 1-urinishda (attemptNumber === 1)
// beriladi — o'tган-o'tmaganidan qat'i nazar (masalan 40% ko'rsatib o'tolmasa
// ham 4 diamond beriladi).
export const QUIZ_MAX_REWARD = 10

// Premium student'lar uchun backend diamond miqdorini avtomatik 1.5 barobar
// qilib beradi — bu yerda faqat UI'da ko'rsatiladigan taxminni moslashtiramiz.
export const PREMIUM_DIAMOND_MULTIPLIER = 1.5

export function calculateQuizDiamonds(attempt: Attempt, isPremium = false) {
  if (attempt.attemptNumber !== 1) return 0
  const base = Math.round(((attempt.scorePercent ?? 0) / 100) * QUIZ_MAX_REWARD * 100) / 100
  return isPremium ? Math.round(base * PREMIUM_DIAMOND_MULTIPLIER * 100) / 100 : base
}
