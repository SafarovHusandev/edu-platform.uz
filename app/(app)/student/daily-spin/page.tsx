"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Clock, Crown, Flame, Loader2, Play, RotateCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorState } from "@/components/ui/error-state"
import { useDailySpinStatus, useDailySpin, type DailySpinResult } from "@/hooks/use-daily-spin"
import { useCreatePayment } from "@/hooks/use-payment"
import { useAuthStore } from "@/store/auth-store"

const SEGMENTS = 8
const SPIN_DURATION_MS = 3000
const WHEEL_GRADIENT = [
  "var(--color-primary) 0deg 45deg",
  "var(--color-gold) 45deg 90deg",
  "#10b981 90deg 135deg",
  "#f43f5e 135deg 180deg",
  "var(--color-primary) 180deg 225deg",
  "var(--color-gold) 225deg 270deg",
  "#10b981 270deg 315deg",
  "#f43f5e 315deg 360deg",
].join(", ")

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
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary to-primary/70 p-6 text-primary-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-sm ring-1 ring-white/20">
            <RotateCw className="size-6" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Kunlik barabon</h1>
            <p className="mt-0.5 text-primary-foreground/80">
              Har kuni aylantiring, olmos yutib oling
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <Card className="overflow-hidden rounded-2xl shadow-md ring-1 ring-border/60">
            <CardContent className="relative flex flex-col items-center gap-6 pt-8 pb-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-gold/10 via-primary/5 to-transparent"
              />

              <div className="relative size-64 sm:size-72">
                <div className="absolute inset-[-14px] rounded-full bg-linear-to-br from-primary/30 via-gold/25 to-transparent blur-xl" />

                <div className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2">
                  <div className="size-0 border-x-[10px] border-t-[20px] border-x-transparent border-t-destructive drop-shadow-md" />
                  <div className="mx-auto -mt-px size-2.5 rounded-full bg-destructive shadow-sm" />
                </div>

                <div
                  onTransitionEnd={handleTransitionEnd}
                  className="relative z-10 size-full overflow-hidden rounded-full shadow-2xl ring-[6px] ring-background"
                  style={{
                    background: `conic-gradient(${WHEEL_GRADIENT})`,
                    transform: `rotate(${rotation}deg)`,
                    transition: isAnimating
                      ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                      : undefined,
                  }}
                >
                  {Array.from({ length: SEGMENTS }).map((_, i) => (
                    <div
                      key={`line-${i}`}
                      className="absolute left-1/2 top-1/2 h-1/2 w-px origin-top bg-white/40"
                      style={{ transform: `rotate(${(360 / SEGMENTS) * i}deg)` }}
                    />
                  ))}
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
                          className="mt-3.5 size-6 drop-shadow-md"
                        />
                      </div>
                    )
                  })}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
                </div>

                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!canSpin}
                  aria-label="Aylantirish"
                  className="absolute left-1/2 top-1/2 z-20 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-linear-to-br from-background to-muted text-primary shadow-xl ring-4 ring-background transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-60"
                >
                  {canSpin && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  )}
                  <span className="relative">
                    {spin.isPending || isAnimating ? (
                      <Loader2 className="size-7 animate-spin" />
                    ) : (
                      <Play className="size-7 fill-current pl-0.5" />
                    )}
                  </span>
                </button>
              </div>

              {status && (
                <div className="relative flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-orange-500/15 to-orange-500/5 px-3.5 py-1.5 text-sm font-semibold text-orange-600 shadow-sm dark:text-orange-400">
                    <Flame className="size-4" /> {status.streakCount} kunlik seriya
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
                    <RotateCw className="size-3.5" /> Bugun: {status.spinsUsedToday}/
                    {status.maxSpinsToday}
                  </span>
                </div>
              )}

              {status && !status.canSpin && (
                <p className="relative flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {standardCapReached
                    ? "Bugungi aylantirish limitingiz tugadi — ertaga qayting"
                    : "Bugungi aylantirishlar tugadi — ertaga qayting"}
                </p>
              )}
            </CardContent>
          </Card>

          {standardCapReached && (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-gold/30 bg-linear-to-r from-gold/15 to-transparent p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
                  <Crown className="size-4.5" />
                </span>
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
        <DialogContent className="overflow-hidden rounded-2xl sm:max-w-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-gold/20 via-primary/10 to-transparent"
          />
          <DialogHeader className="relative">
            <DialogTitle className="justify-center text-center text-xl">
              Tabriklaymiz! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex flex-col items-center gap-2 py-2">
            <Sparkles className="absolute -left-2 top-0 size-5 text-gold" />
            <Sparkles className="absolute -right-1 top-6 size-4 text-primary" />
            <span className="flex size-20 items-center justify-center rounded-full bg-gold/15 shadow-inner">
              <Image src="/diamond.png" alt="" width={64} height={64} className="size-14" />
            </span>
            <p className="bg-linear-to-r from-gold-foreground to-gold bg-clip-text text-4xl font-extrabold text-transparent">
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
