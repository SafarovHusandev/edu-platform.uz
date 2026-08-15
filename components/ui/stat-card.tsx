import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STAT_CARD_TONE_CLASSES = {
  primary: "bg-primary/10 text-primary",
  gold: "bg-gold/15 text-gold",
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const

type StatCardTone = keyof typeof STAT_CARD_TONE_CLASSES

interface StatCardProps extends React.ComponentProps<typeof Card> {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  tone?: StatCardTone
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={className} {...props}>
      <CardContent className="flex items-center gap-4 pt-2">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            STAT_CARD_TONE_CLASSES[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { StatCard, type StatCardTone }
