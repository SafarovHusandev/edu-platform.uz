import * as React from "react"
import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  onRetry?: () => void
}

function ErrorState({
  title = "Nimadir xato ketdi",
  description = "Ma'lumotlarni yuklab bo'lmadi. Iltimos, qayta urinib ko'ring.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 py-16 text-center",
        className
      )}
      {...props}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-4" />
          Qayta urinish
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
