"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import { useAuthStore } from "@/store/auth-store"
import { useCreatePayment } from "@/hooks/use-payment"
import { formatNumber, formatPrice, toTiyin } from "@/lib/format"

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000]

export default function WalletPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const createPayment = useCreatePayment()
  const [amount, setAmount] = useState(50000)

  function handleTopUp() {
    createPayment.mutate(
      {
        purpose: "wallet",
        amount: toTiyin(amount),
        returnUrl: typeof window !== "undefined" ? `${window.location.origin}/student/wallet` : "",
      },
      {
        onSuccess: (invoice) => {
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl
          } else {
            router.push(`/student/payment/${invoice.invoiceId}`)
          }
        },
      }
    )
  }

  function handlePremium() {
    createPayment.mutate(
      {
        purpose: "premium",
        returnUrl: typeof window !== "undefined" ? `${window.location.origin}/student/wallet` : "",
      },
      {
        onSuccess: (invoice) => {
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl
          } else {
            router.push(`/student/payment/${invoice.invoiceId}`)
          }
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Hamyon"
        description="Balansingizni to'ldiring va Premium imkoniyatlardan foydalaning"
      />

      <Card className="bg-linear-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="flex items-center gap-4 pt-2">
          <span className="flex size-12 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="size-6" />
          </span>
          <div>
            <p className="text-2xl font-semibold">{formatPrice(user?.balance ?? 0)}</p>
            <p className="text-sm text-primary-foreground/80">Joriy balans</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hamyonni to&apos;ldirish</CardTitle>
          <CardDescription>Miqdorni tanlang yoki qo&apos;lda kiriting</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_AMOUNTS.map((value) => (
              <Button
                key={value}
                type="button"
                variant={amount === value ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(value)}
              >
                {formatNumber(value)}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min={1000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="To'lov miqdori (so'm)"
          />
          <Button onClick={handleTopUp} disabled={createPayment.isPending || amount < 1000}>
            {createPayment.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {formatNumber(amount)} so&apos;m to&apos;lash
          </Button>
        </CardContent>
      </Card>

      {user?.tarif !== "premium" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4.5 text-gold" /> Premium a&apos;zolik
            </CardTitle>
            <CardDescription>
              Cheklovlarsiz kirish, ustuvor qo&apos;llab-quvvatlash va eksklyuziv imkoniyatlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handlePremium} disabled={createPayment.isPending}>
              {createPayment.isPending && <Loader2 className="size-4 animate-spin" />}
              Premium sotib olish
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
