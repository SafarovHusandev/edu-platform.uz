import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationBarProps {
  page: number
  totalPages: number
  total?: number
  itemLabel?: string
  onPageChange: (page: number) => void
  className?: string
}

function PaginationBar({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
  className,
}: PaginationBarProps) {
  if (totalPages <= 1) return null

  return (
    <div className={cn("mt-4 flex items-center justify-between gap-3", className)}>
      <p className="text-sm text-muted-foreground">
        {total != null && itemLabel ? `Jami ${total} ta ${itemLabel}` : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Oldingi sahifa"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Keyingi sahifa"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export { PaginationBar }
