"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Crown, Flame, Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorState } from "@/components/ui/error-state"
import { useDailySpinStatus, useDailySpin, type DailySpinResult } from "@/hooks/use-daily-spin"
import { useCreatePayment } from "@/hooks/use-payment"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

const SEGMENTS = 8
const SPIN_DURATION_MS = 3000

export default function DailySpinPage() {
  const user = useAuthStore((s) => s.user)
  const isPremium = user?.tarif === "premium"
  const router = useRouter()
  const { data: status, isLoading, isError, refetch } = useDailySpinStatus()
  const spin = useDailySpin()
  const createPayment = useCreatePayment()

  function handleBuyPremium() {
    createPayment.mutate(
      {
        purpose: "premium",
        returnUrl:
          typeof window !== "undefined" ? `${window.location.origin}/student/daily-spin` : "",
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

  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pendingResult, setPendingResult] = useState<DailySpinResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)

  const canSpin = !!status?.canSpin && !spin.isPending && !isAnimating

  function handleSpin() {
    if (!canSpin) return
    spin.mutate(undefined, {
      onSuccess: (result) => {
        setPendingResult(result)
        setIsAnimating(true)
        setRotation((prev) => prev + 360 * 5 + Math.floor(Math.random() * 360))
      },
    })
  }

  function handleTransitionEnd() {
    if (!isAnimating) return
    setIsAnimating(false)
    if (pendingResult) setResultOpen(true)
  }

  const standardCapReached =
    !isPremium && status && !status.canSpin && status.maxSpinsToday <= 1

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Kunlik barabon" description="Har kuni aylantiring, olmos yutib oling" />

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-md bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <Card className="shadow-sm ring-1 ring-border/60">
            <CardContent className="flex flex-col items-center gap-6 pt-6 pb-8">
              <div className="relative size-64 sm:size-72">
                <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
                  <div className="size-0 border-x-8 border-t-[16px] border-x-transparent border-t-destructive drop-shadow" />
                </div>

                <div
                  onTransitionEnd={handleTransitionEnd}
                  className="relative size-full overflow-hidden rounded-full shadow-lg ring-4 ring-background"
                  style={{
                    background:
                      "conic-gradient(var(--color-primary) 0deg 45deg, var(--color-gold) 45deg 90deg, var(--color-primary) 90deg 135deg, var(--color-gold) 135deg 180deg, var(--color-primary) 180deg 225deg, var(--color-gold) 225deg 270deg, var(--color-primary) 270deg 315deg, var(--color-gold) 315deg 360deg)",
                    transform: `rotate(${rotation}deg)`,
                    transition: isAnimating
                      ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                      : undefined,
                  }}
                >
                  {Array.from({ length: SEGMENTS }).map((_, i) => {
                    const angle = (360 / SEGMENTS) * i + 360 / SEGMENTS / 2
                    return (
                      <div
                        key={i}
                        className="absolute inset-0 flex items-start justify-center"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <Image
                          src="/diamond.png"
                          alt=""
                          width={32}
                          height={32}
                          className="mt-4 size-6 drop-shadow"
                        />
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!canSpin}
                  aria-label="Aylantirish"
                  className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-primary shadow-lg ring-4 ring-primary/20 transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-60"
                >
                  {spin.isPending || isAnimating ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Play className="size-6 fill-current" />
                  )}
                </button>
              </div>

              {status && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400">
                    <Flame className="size-4" /> {status.streakCount} kunlik seriya
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
                    Bugun: {status.spinsUsedToday}/{status.maxSpinsToday}
                  </span>
                </div>
              )}

              {status && !status.canSpin && (
                <p className="text-sm text-muted-foreground">
                  {standardCapReached
                    ? "Bugungi aylantirish limitingiz tugadi — ertaga qayting"
                    : "Bugungi aylantirishlar tugadi — ertaga qayting"}
                </p>
              )}
            </CardContent>
          </Card>

          {standardCapReached && (
            <div className="flex flex-col items-start gap-3 rounded-md border border-gold/30 bg-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Crown className="mt-0.5 size-5 shrink-0 text-gold-foreground" />
                <div>
                  <p className="text-sm font-semibold text-gold-foreground">
                    Premium oling — kuniga 3 marta aylantiring
                  </p>
                  <p className="mt-0.5 text-xs text-gold-foreground/80">
                    Standart tarifda kuniga faqat 1 marta aylantirish mumkin.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full shrink-0 rounded-md sm:w-fit"
                onClick={handleBuyPremium}
                disabled={createPayment.isPending}
              >
                {createPayment.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crown className="size-4" />
                )}
                Premium sotib olish
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="rounded-md sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="justify-center text-center text-xl">
              Tabriklaymiz! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2 py-2">
            <Image src="/diamond.png" alt="" width={64} height={64} className="size-16" />
            <p className={cn("text-3xl font-bold text-gold-foreground")}>
              +{pendingResult?.diamondsWon ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">diamond qo&apos;lga kiritdingiz!</p>
            {pendingResult && pendingResult.streakCount > 1 && (
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                <Flame className="size-3.5" /> {pendingResult.streakCount} kunlik seriya
              </span>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full rounded-md" onClick={() => setResultOpen(false)}>
              Ajoyib!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
