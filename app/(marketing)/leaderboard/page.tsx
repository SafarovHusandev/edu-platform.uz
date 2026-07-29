"use client"

import { useState } from "react"
import { Trophy, Gem, Medal, LogIn } from "lucide-react"
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

const MEDAL_COLORS = ["text-gold", "text-muted-foreground", "text-amber-700"]

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)
  const [page] = useState(1)
  const { data, isLoading, error } = useLeaderboard(page, 20)

  const isUnauthorized = error instanceof ApiError && error.status === 401

  return (
    <Container className="py-12">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
          <Trophy className="size-6" />
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-2">
          {data?.items.map((entry, idx) => (
            <div
              key={entry._id}
              className={cn(
                "flex items-center gap-4 rounded-xl border border-border px-4 py-3",
                idx < 3 && "bg-muted/40"
              )}
            >
              <div className="flex w-8 shrink-0 items-center justify-center">
                {idx < 3 ? (
                  <Medal className={cn("size-5", MEDAL_COLORS[idx])} />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">{idx + 1}</span>
                )}
              </div>
              <Avatar>
                <AvatarImage src={resolveAssetUrl(entry.avatar)} alt={entry.name} />
                <AvatarFallback>{initials(entry.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.name}</p>
                {entry.grade && (
                  <p className="text-xs text-muted-foreground">
                    {entry.grade.number}-{entry.grade.letter} sinf
                  </p>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gold-foreground">
                <Gem className="size-4 text-gold" />
                {formatNumber(entry.diamonds ?? 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
