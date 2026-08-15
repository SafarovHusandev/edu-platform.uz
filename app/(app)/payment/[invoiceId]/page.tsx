"use client"

import { use, useEffect, useRef } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { usePaymentStatus } from "@/hooks/use-payment"
import { refreshCurrentUser } from "@/hooks/use-auth"
import { useAuthStore } from "@/store/auth-store"
import { formatPrice } from "@/lib/format"
import { ROLE_HOME } from "@/lib/roles"
import { getPaymentStatusConfig, PAYMENT_PURPOSE_LABELS } from "@/lib/payment-status"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ invoiceId: string }>
}

export default function PaymentStatusPage({ params }: PageProps) {
  const { invoiceId } = use(params)
  const user = useAuthStore((s) => s.user)
  const { data: invoice, isLoading, isError, refetch } = usePaymentStatus(invoiceId, true)
  const refreshed = useRef(false)

  useEffect(() => {
    if (invoice?.status === "success" && !refreshed.current) {
      refreshed.current = true
      refreshCurrentUser()
    }
  }, [invoice?.status])

  if (isError) {
    return <ErrorState title="To'lov holatini tekshirib bo'lmadi" onRetry={() => refetch()} />
  }

  if (isLoading || !invoice) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-20 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">To&apos;lov holati tekshirilmoqda...</p>
      </div>
    )
  }

  const config = getPaymentStatusConfig(invoice.status)
  const Icon = config.icon

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-4 text-center">
          <span className={cn("flex size-16 items-center justify-center rounded-2xl", config.className)}>
            <Icon className="size-8" />
          </span>
          <h1 className="font-heading text-xl font-semibold">{config.label}</h1>
          <p className="text-sm text-muted-foreground">{PAYMENT_PURPOSE_LABELS[invoice.purpose]}</p>
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
