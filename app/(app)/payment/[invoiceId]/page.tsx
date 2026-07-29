"use client"

import { use, useEffect, useRef } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePaymentStatus } from "@/hooks/use-payment"
import { refreshCurrentUser } from "@/hooks/use-auth"
import { useAuthStore } from "@/store/auth-store"
import { formatPrice } from "@/lib/format"
import { ROLE_HOME } from "@/lib/roles"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ invoiceId: string }>
}

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, label: "To'lov muvaffaqiyatli", className: "bg-success/15 text-success" },
  draft: { icon: Clock, label: "To'lov kutilmoqda", className: "bg-muted text-muted-foreground" },
  progress: { icon: Clock, label: "To'lov amalga oshirilmoqda", className: "bg-muted text-muted-foreground" },
  billing: { icon: Clock, label: "To'lov amalga oshirilmoqda", className: "bg-muted text-muted-foreground" },
  hold: { icon: Clock, label: "To'lov tekshirilmoqda", className: "bg-muted text-muted-foreground" },
  error: { icon: XCircle, label: "To'lov amalga oshmadi", className: "bg-destructive/10 text-destructive" },
  revert: { icon: XCircle, label: "To'lov qaytarildi", className: "bg-destructive/10 text-destructive" },
}

const PURPOSE_LABELS = {
  wallet: "Hamyon to'ldirish",
  course: "Kurs sotib olish",
  premium: "Premium a'zolik",
  donation: "Homiylik",
}

export default function PaymentStatusPage({ params }: PageProps) {
  const { invoiceId } = use(params)
  const user = useAuthStore((s) => s.user)
  const { data: invoice, isLoading } = usePaymentStatus(invoiceId, true)
  const refreshed = useRef(false)

  useEffect(() => {
    if (invoice?.status === "success" && !refreshed.current) {
      refreshed.current = true
      refreshCurrentUser()
    }
  }, [invoice?.status])

  if (isLoading || !invoice) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-20 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">To&apos;lov holati tekshirilmoqda...</p>
      </div>
    )
  }

  const config = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft
  const Icon = config.icon

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
          <span className={cn("flex size-16 items-center justify-center rounded-2xl", config.className)}>
            <Icon className="size-8" />
          </span>
          <h1 className="font-heading text-xl font-semibold">{config.label}</h1>
          <p className="text-sm text-muted-foreground">{PURPOSE_LABELS[invoice.purpose]}</p>
          <p className="text-2xl font-semibold">{formatPrice(invoice.amount)}</p>
          <p className="text-xs text-muted-foreground">Invoys: {invoice.invoiceId}</p>
          {invoice.purpose === "donation" && invoice.status === "success" && (
            <p className="text-sm text-muted-foreground">
              Homiyligingiz uchun rahmat! Sizning yordamingiz platformani rivojlantirishda muhim.
            </p>
          )}
          <Button className="mt-4" render={<Link href={user ? ROLE_HOME[user.role] : "/"} />}>
            Bosh sahifaga qaytish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
