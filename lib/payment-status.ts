import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react"

import type { PaymentPurpose, PaymentStatus } from "@/types"

interface PaymentStatusConfig {
  icon: LucideIcon
  label: string
  className: string
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> = {
  success: {
    icon: CheckCircle2,
    label: "To'lov muvaffaqiyatli",
    className: "bg-success/15 text-success",
  },
  draft: {
    icon: Clock,
    label: "To'lov kutilmoqda",
    className: "bg-muted text-muted-foreground",
  },
  progress: {
    icon: Clock,
    label: "To'lov amalga oshirilmoqda",
    className: "bg-muted text-muted-foreground",
  },
  billing: {
    icon: Clock,
    label: "To'lov amalga oshirilmoqda",
    className: "bg-muted text-muted-foreground",
  },
  hold: {
    icon: Clock,
    label: "To'lov tekshirilmoqda",
    className: "bg-muted text-muted-foreground",
  },
  error: {
    icon: XCircle,
    label: "To'lov amalga oshmadi",
    className: "bg-destructive/10 text-destructive",
  },
  revert: {
    icon: XCircle,
    label: "To'lov qaytarildi",
    className: "bg-destructive/10 text-destructive",
  },
}

export const PAYMENT_PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  wallet: "Hamyon to'ldirish",
  course: "Kurs sotib olish",
  premium: "Premium a'zolik",
  donation: "Homiylik",
}

export function getPaymentStatusConfig(status: PaymentStatus): PaymentStatusConfig {
  return PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.draft
}
