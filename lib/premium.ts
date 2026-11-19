import type { User } from '@/types';

// Premium hozir amalda bo'lsa true. Backend `tarif`ni muddat o'tishi bilan darhol
// "standart"ga qaytarmasligi mumkin, shuning uchun premiumExpiresAt ham tekshiriladi:
// muddati o'tgan premium "Standart" hisoblanadi (backend `tarif` filtri bilan bir xil).
export function isPremiumActive(user: Pick<User, 'tarif' | 'premiumExpiresAt'>) {
  if (user.tarif !== 'premium') return false;
  if (!user.premiumExpiresAt) return true;
  return new Date(user.premiumExpiresAt).getTime() > Date.now();
}
