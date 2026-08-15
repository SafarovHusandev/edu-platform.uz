import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
