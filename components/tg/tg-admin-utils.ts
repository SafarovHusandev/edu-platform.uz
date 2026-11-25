import { PAYMENT_PURPOSE_LABELS } from '@/lib/payment-status';
import { planKeyToLabel } from '@/lib/format';
import type { PaymentRecord, PaymentStatus } from '@/types';
import type { TgTone } from '@/components/tg/tg-ui';

export const PAYMENT_PILL: Record<PaymentStatus, { label: string; tone: TgTone }> = {
  success: { label: "To'landi", tone: 'success' },
  draft: { label: 'Kutilmoqda', tone: 'warning' },
  progress: { label: 'Jarayonda', tone: 'warning' },
  billing: { label: 'Jarayonda', tone: 'warning' },
  hold: { label: 'Tekshirilmoqda', tone: 'warning' },
  error: { label: 'Bekor qilindi', tone: 'danger' },
  revert: { label: 'Qaytarildi', tone: 'neutral' },
  expired: { label: "Muddati o'tgan", tone: 'neutral' },
};

export function paymentLabel(payment: PaymentRecord) {
  if (payment.purpose === 'premium' && payment.plan) return `Premium ${planKeyToLabel(payment.plan)}`;
  if (payment.purpose === 'course' && payment.course && typeof payment.course === 'object') {
    return payment.course.title ?? 'Kurs';
  }
  return PAYMENT_PURPOSE_LABELS[payment.purpose];
}
