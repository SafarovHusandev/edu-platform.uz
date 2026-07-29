"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          className="p-0.5"
          aria-label={`${star} yulduz`}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              star <= active ? "fill-gold text-gold" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  )
}
