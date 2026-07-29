import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight",
        className
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="size-4.5" />
      </span>
      <span className="text-base">
        Edu<span className="text-primary">Platform</span>
      </span>
    </Link>
  )
}
