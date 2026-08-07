import type { Attempt } from "@/types"

// Backenddagi QUIZ_MAX_REWARD (config/gamification.js) bilan bir xil:
// diamond = (scorePercent / 100) * 10, faqat 1-urinishda (attemptNumber === 1)
// beriladi — o'tган-o'tmaganidan qat'i nazar (masalan 40% ko'rsatib o'tolmasa
// ham 4 diamond beriladi).
export const QUIZ_MAX_REWARD = 10

export function calculateQuizDiamonds(attempt: Attempt) {
  if (attempt.attemptNumber !== 1) return 0
  return Math.round(((attempt.scorePercent ?? 0) / 100) * QUIZ_MAX_REWARD * 100) / 100
}
