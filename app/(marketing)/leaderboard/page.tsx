"use client"


import { LuMedal } from "react-icons/lu"
import { useState } from "react"
import { Trophy, Gem, Crown, LogIn } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLeaderboard } from "@/hooks/use-users"
import { useAuthStore } from "@/store/auth-store"
import { resolveAssetUrl } from "@/lib/config"
import { formatNumber, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import type { User } from "@/types"

const PODIUM_STYLES = [
  {
    order: "sm:order-2",
    ring: "ring-gold",
    badge: "bg-gold text-gold-foreground",
    card: "sm:-translate-y-4 hover:scale-105 transition-all duration-300 bg-amber-50/60 border border-amber-300 shadow-xl shadow-amber-500/30 dark:bg-amber-500/10 dark:border-[#D4AF37]/40 dark:shadow-2xl dark:shadow-[#D4AF37]/40",
    avatarSize: "size-20",
    icon: Crown,
  },
  {
    order: "sm:order-1",
    ring: "ring-muted-foreground/50",
    badge: "bg-muted-foreground text-background",
    card: "hover:scale-105 transition-all duration-300 bg-slate-100/70 border border-slate-300 shadow-xl shadow-slate-400/40 dark:bg-slate-500/10 dark:border-slate-500/30 dark:shadow-2xl dark:shadow-slate-500/30",
    avatarSize: "size-16",
    icon: LuMedal,
  },
  {
    order: "sm:order-3",
    ring: "ring-amber-700/50",
    badge: "bg-amber-700 text-white",
    card: "hover:scale-105 transition-all duration-300 bg-orange-50/70 border border-orange-300 shadow-xl shadow-orange-600/30 dark:bg-amber-700/10 dark:border-amber-700/40 dark:shadow-2xl dark:shadow-[#CD7F32]/40",
    avatarSize: "size-16",
    icon: LuMedal,
  },
]

function PodiumCard({ entry, rank }: { entry: User; rank: number }) {
  const style = PODIUM_STYLES[rank - 1]
  const Icon = style.icon

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center shadow-sm transition-transform",
        style.order,
        style.card
      )}
    >
      <div className="relative">
        <Avatar className={cn(style.avatarSize, "ring-3 ring-offset-2 ring-offset-background", style.ring)}>
          <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
          <AvatarFallback className="text-lg">{initials(entry.name)}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-1.5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full shadow-sm",
            style.badge
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-1.5">
        <p className="line-clamp-1 max-w-32 text-sm font-semibold">{entry.name}</p>
        {entry.grade?.number && (
          <p className="text-xs text-muted-foreground">
            {entry.grade.number}-{entry.grade.letter} sinf
          </p>
        )}
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-sm font-semibold text-gold-foreground shadow-xs animate-pulse dark:text-white">
        <svg className="size-5 animate-pulse text-amber-500 dark:text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#D4AF37"><path d="M480-120 80-600l120-240h560l120 240-400 480Zm-95-520h190l-60-120h-70l-60 120Zm55 347v-267H218l222 267Zm80 0 222-267H520v267Zm144-347h106l-60-120H604l60 120Zm-474 0h106l60-120H250l-60 120Z"/></svg>
        {formatNumber(entry.diamonds ?? 0)}
      </span>
    </div>
  )
}

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)
  const [page] = useState(1)
  const { data, isLoading, error } = useLeaderboard(page, 20)

  const isUnauthorized = error instanceof ApiError && error.status === 401
  const items = data?.items ?? []
  const hasPodium = items.length >= 3
  const podium = hasPodium ? items.slice(0, 3) : []
  const rest = hasPodium ? items.slice(3) : items

  return (
    <Container className="py-12">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold shadow-sm">
          <Trophy className="size-7" />
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Reyting jadvali</h1>
        <p className="mt-1 text-muted-foreground">
          Eng ko&apos;p olmos to&apos;plagan faol o&apos;quvchilar
        </p>
      </div>

      {isUnauthorized && !user ? (
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <LogIn className="size-8 text-muted-foreground" />
          <p className="font-medium">Reytingni ko&apos;rish uchun tizimga kiring</p>
          <Button render={<Link href="/login?redirect=/leaderboard" />}>Kirish</Button>
        </div>
      ) : isLoading ? (
        <div className="mx-auto max-w-2xl space-y-2">
          <div className="mb-6 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          {hasPodium && (
            <div className="mb-8 grid grid-cols-3 items-end gap-3">
              {podium.map((entry, idx) => (
                <PodiumCard key={entry._id} entry={entry} rank={idx + 1} />
              ))}
            </div>
          )}

          <div className="space-y-2">
            {rest.map((entry, idx) => {
              const rank = idx + (hasPodium ? 4 : 1)
              const isMe = !!user && entry._id === user._id
              return (
                <div
                  key={entry._id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border px-4 py-3 shadow-sm hover:shadow-md hover:translate-x-1 transition-all duration-300",
                    isMe
                      ? "border-blue-400 bg-blue-50/50 dark:border-blue-500/40 dark:bg-blue-500/10 text-slate-900 dark:text-white"
                      : "bg-white border-slate-100 hover:bg-slate-50/80 dark:bg-slate-900/50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex w-8 shrink-0 items-center justify-center">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{rank}</span>
                  </div>
                  <Avatar className="border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
                    <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-white">
                      {entry.name}
                      {isMe && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 dark:bg-blue-400/20">
                          Siz
                        </span>
                      )}
                    </p>
                    {entry.grade?.number && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {entry.grade.number}-{entry.grade.letter} sinf
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-[#D4AF37]">
                    <svg className="size-5 animate-pulse text-amber-500 dark:text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#D4AF37"><path d="M480-120 80-600l120-240h560l120 240-400 480Zm-95-520h190l-60-120h-70l-60 120Zm55 347v-267H218l222 267Zm80 0 222-267H520v267Zm144-347h106l-60-120H604l60 120Zm-474 0h106l60-120H250l-60 120Z"/></svg>
                    {formatNumber(entry.diamonds ?? 0)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Container>
  )
}
