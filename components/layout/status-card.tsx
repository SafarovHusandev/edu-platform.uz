"use client"

import Image from "next/image"
import Link from "next/link"
import { Crown, Wallet } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/store/auth-store"
import { fromTiyin, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

// Ranglar dizayn maketidagi tokenlarga mos ("Status kartasi" spetsifikatsiyasi):
// pul — teal-yashil, diamond — indigo, premium — oltin. Ikkala temaga moslashtirilgan.
const MONEY = "text-[#1F7A6C] dark:text-[#4FC7B1]"
const MONEY_BG = "bg-[#E4F3F0] dark:bg-[#16302C]"
const GEM = "text-[#5457A6] dark:text-[#9DA0EC]"
const GEM_BG = "bg-[#ECECF9] dark:bg-[#262A45]"
const PREMIUM = "text-[#A9791C] dark:text-[#F0C878]"
const PREMIUM_2 = "text-[#C99A2E] dark:text-[#E7B85A]"

function Segment({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 whitespace-nowrap px-3.5 py-2 first:pt-2 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-[#E1E5EE] min-[480px]:[&:not(:first-child)]:border-t-0 min-[480px]:[&:not(:first-child)]:border-l dark:[&:not(:first-child)]:border-[#2B3040]",
        className
      )}
      {...props}
    />
  )
}

function StatusCardSkeleton() {
  return (
    <div className="inline-flex max-w-full flex-col overflow-hidden rounded-[13px] border border-[#E1E5EE] bg-white shadow-sm min-[480px]:flex-row dark:border-[#2B3040] dark:bg-[#1B1E2A]">
      <Segment>
        <span className="h-3.5 w-14 animate-pulse rounded bg-[#E9EDF5] dark:bg-[#242838]" />
      </Segment>
      <Segment>
        <span className="size-[26px] shrink-0 animate-pulse rounded-lg bg-[#E9EDF5] dark:bg-[#242838]" />
        <span className="h-3.5 w-16 animate-pulse rounded bg-[#E9EDF5] dark:bg-[#242838]" />
      </Segment>
      <Segment>
        <span className="size-[26px] shrink-0 animate-pulse rounded-lg bg-[#E9EDF5] dark:bg-[#242838]" />
        <span className="h-3.5 w-10 animate-pulse rounded bg-[#E9EDF5] dark:bg-[#242838]" />
      </Segment>
    </div>
  )
}

export function StatusCard() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <StatusCardSkeleton />

  const isPremium = user.tarif === "premium"

  return (
    <div className="inline-flex max-w-full flex-col overflow-hidden rounded-[13px] border border-[#E1E5EE] bg-white shadow-sm min-[480px]:flex-row dark:border-[#2B3040] dark:bg-[#1B1E2A]">
      <Segment
        className={cn(
          isPremium &&
            "bg-gradient-to-br from-[#F8EDD4] to-transparent dark:from-[#362A14]"
        )}
      >
        {isPremium && <Crown className={cn("size-3.5 shrink-0", PREMIUM_2)} />}
        <span className={cn("text-xs font-bold", isPremium ? PREMIUM : "text-[#5B6270] dark:text-[#9BA2B4]")}>
          {isPremium ? "Premium" : "Standart"}
        </span>
      </Segment>

      <Segment>
        <span className={cn("flex size-[26px] shrink-0 items-center justify-center rounded-lg", MONEY_BG, MONEY)}>
          <Wallet className="size-3.5" />
        </span>
        <span className="flex flex-col gap-px leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#838B9C] dark:text-[#737A8C]">
            Balans
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-[#171A24] dark:text-[#EDEFF6]">
            {formatNumber(Math.round(fromTiyin(user.balance ?? 0)))}
            <span className="ml-1 font-sans text-[11px] font-semibold text-[#5B6270] dark:text-[#9BA2B4]">
              so&apos;m
            </span>
          </span>
        </span>
      </Segment>

      <Tooltip>
        <TooltipTrigger render={<Segment />}>
          <span className={cn("flex size-[26px] shrink-0 items-center justify-center rounded-lg", GEM_BG)}>
            <Image src="/diamond.png" alt="" width={32} height={32} className="size-3.5" />
          </span>
          <span className="flex flex-col gap-px leading-none">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#838B9C] dark:text-[#737A8C]">
              Diamond
            </span>
            <span className={cn("font-mono text-sm font-semibold tabular-nums", GEM)}>
              {formatNumber(Math.round(user.diamonds ?? 0))}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>Test va darslarni tugatib diamond to&apos;plang</TooltipContent>
      </Tooltip>

      {!isPremium && (
        <Link
          href="/premium"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap border-t border-[#E1E5EE] bg-[#E9EDF5] px-3.5 py-2 text-xs font-bold text-[#171A24] transition-colors hover:bg-[#CBD1E0] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#5457A6] min-[480px]:border-l min-[480px]:border-t-0 dark:border-[#2B3040] dark:bg-[#242838] dark:text-[#EDEFF6] dark:hover:bg-[#3A4058] dark:focus-visible:outline-[#9DA0EC]"
        >
          <Crown className={cn("size-3.5", PREMIUM_2)} />
          Premium olish
        </Link>
      )}
    </div>
  )
}
