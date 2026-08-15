import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface SkeletonListProps extends React.ComponentProps<"div"> {
  count?: number
  itemClassName?: string
}

function SkeletonList({ count = 4, className, itemClassName, ...props }: SkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-14 w-full rounded-xl", itemClassName)} />
      ))}
    </div>
  )
}

interface SkeletonCardGridProps extends React.ComponentProps<"div"> {
  count?: number
  itemClassName?: string
}

function SkeletonCardGrid({
  count = 6,
  className,
  itemClassName,
  ...props
}: SkeletonCardGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-32 w-full rounded-xl", itemClassName)} />
      ))}
    </div>
  )
}

interface SkeletonTableProps extends React.ComponentProps<"div"> {
  rows?: number
}

function SkeletonTable({ rows = 6, className, ...props }: SkeletonTableProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonList, SkeletonCardGrid, SkeletonTable }
