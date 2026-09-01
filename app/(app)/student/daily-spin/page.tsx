"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Crown, Flame, Loader2, PartyPopper, Play, RotateCw, Sparkles, ArrowRight } from "lucide-react"
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
import { useAuthStore } from "@/store/auth-store"

const SEGMENTS = 8
const SPIN_DURATION_MS = 3000
const WHEEL_GRADIENT = [
  "#6366f1 0deg 45deg",
  "#f59e0b 45deg 90deg",
  "#10b981 90deg 135deg",
  "#ec4899 135deg 180deg",
  "#3b82f6 180deg 225deg",
  "#eab308 225deg 270deg",
  "#06b6d4 270deg 315deg",
  "#8b5cf6 315deg 360deg",
].join(", ")

export default function DailySpinPage() {
  const user = useAuthStore((s) => s.user)
  const isPremium = user?.tarif === "premium"
  const { data: status, isLoading, isError, refetch } = useDailySpinStatus()
  const spin = useDailySpin()

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
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-500 via-orange-600 to-primary p-6 text-white shadow-xl shadow-amber-500/20 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-amber-300/30 blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md shadow-lg">
            <RotateCw className="size-7 animate-spin-slow" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold text-amber-100 backdrop-blur-xs mb-1">
              <Sparkles className="size-3" />
              <span>Har Kuni Bepul Sovrin</span>
            </div>
            <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">Kunlik Baraban</h1>
            <p className="text-sm text-white/90">
              Barabanni aylantiring va qimmatbaho olmoslarni yutib oling!
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="glass-card relative overflow-hidden rounded-3xl border border-border/80 p-6 sm:p-8 shadow-xl">
            <div className="relative flex flex-col items-center gap-6">
              {/* Wheel Container */}
              <div className="relative size-64 sm:size-76">
                <div className="absolute inset-[-18px] rounded-full bg-linear-to-tr from-amber-500/30 via-primary/25 to-transparent blur-2xl" />

                {/* Arrow Pointer */}
                <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center drop-shadow-xl">
                  <div className="size-0 border-x-[12px] border-t-[22px] border-x-transparent border-t-amber-500" />
                  <div className="size-3 rounded-full bg-amber-400 -mt-1 shadow-sm ring-2 ring-white" />
                </div>

                {/* The Rotating Wheel */}
                <div
                  onTransitionEnd={handleTransitionEnd}
                  className="relative z-10 size-full overflow-hidden rounded-full shadow-2xl ring-[8px] ring-card/90"
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
                      className="absolute left-1/2 top-1/2 h-1/2 w-[2px] origin-top bg-white/40 shadow-xs"
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
                        <div className="mt-4 flex flex-col items-center">
                          <Image
                            src="/diamond.png"
                            alt=""
                            width={32}
                            height={32}
                            className="size-7 drop-shadow-lg"
                          />
                        </div>
                      </div>
                    )
                  })}
                  <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-white/30" />
                </div>

                {/* Center Spin Button */}
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!canSpin}
                  aria-label="Aylantirish"
                  className="absolute left-1/2 top-1/2 z-20 flex size-22 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-linear-to-tr from-card via-background to-muted text-primary shadow-2xl ring-4 ring-card hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-60"
                >
                  {canSpin && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  )}
                  <span className="relative font-bold text-xs flex flex-col items-center gap-0.5">
                    {spin.isPending || isAnimating ? (
                      <Loader2 className="size-7 animate-spin text-primary" />
                    ) : (
                      <>
                        <Play className="size-6 fill-current text-primary pl-0.5" />
                        <span className="text-[10px] uppercase tracking-wider text-foreground font-extrabold">Aylantir</span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Status and Streaks */}
              {status && (
                <div className="relative flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 shadow-xs">
                    <Flame className="size-4" /> {status.streakCount} kunlik ketma-ketlik
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-xs">
                    <RotateCw className="size-3.5" /> Bugun: {status.spinsUsedToday}/
                    {status.maxSpinsToday}
                  </span>
                </div>
              )}

              {status && !status.canSpin && (
                <p className="relative flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground bg-muted/60 px-4 py-2 rounded-2xl">
                  <Clock className="size-4 text-primary" />
                  {standardCapReached
                    ? "Bugungi imkoniyatingiz tugadi — ertaga yana kiring!"
                    : "Bugungi barcha urinishlar tugadi — ertaga kuting!"}
                </p>
              )}
            </div>
          </div>

          {standardCapReached && (
            <div className="flex flex-col items-start gap-4 rounded-3xl border border-amber-500/40 bg-linear-to-r from-amber-500/15 via-orange-500/10 to-transparent p-5 shadow-md sm:flex-row sm:items-center sm:justify-between card-hover-glow">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <Crown className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Premium bilan kuniga 3 marta aylantiring!
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Standart tarifda kuniga 1 ta, Premiumda esa 3 ta urinish beriladi.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full shrink-0 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 font-bold text-white shadow-md shadow-amber-500/20 sm:w-fit cursor-pointer"
                render={<Link href="/premium" />}
              >
                <Crown className="size-4 mr-1.5" />
                Premium olish
              </Button>
            </div>
          )}
        </>
      )}

      {/* Win Modal Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="overflow-hidden rounded-3xl border border-border/80 bg-card sm:max-w-sm p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-amber-500/20 via-primary/10 to-transparent"
          />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center justify-center gap-2 text-center text-2xl font-extrabold text-foreground">
              Tabriklaymiz! <PartyPopper className="size-6 text-amber-500 animate-bounce" />
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex flex-col items-center gap-2 py-4">
            <Sparkles className="absolute -left-1 top-0 size-6 text-amber-400 animate-pulse" />
            <Sparkles className="absolute -right-1 top-6 size-5 text-primary animate-pulse" />
            
            <div className="flex size-24 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 shadow-xl shadow-amber-500/20 mb-2">
              <Image src="/diamond.png" alt="" width={64} height={64} className="size-16 drop-shadow-md" />
            </div>

            <p className="text-4xl font-extrabold text-amber-500 dark:text-amber-400">
              +{pendingResult?.diamondsWon ?? 0}
            </p>
            <p className="text-sm font-bold text-foreground">ta Olmos hisobingizga qo&apos;shildi!</p>
            {pendingResult && pendingResult.streakCount > 1 && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-3.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Flame className="size-3.5" /> {pendingResult.streakCount} kunlik seriya
              </span>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl h-11 font-bold text-base bg-primary shadow-lg shadow-primary/25 cursor-pointer" onClick={() => setResultOpen(false)}>
              Qabul qilish ✨
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

