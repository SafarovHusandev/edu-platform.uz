import Link from "next/link"
import Image from "next/image"
import { BookMarked, Download } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Book } from "@/types"
import { formatNumber } from "@/lib/format"
import { resolveAssetUrl } from "@/lib/config"

export function BookCard({ book }: { book: Book }) {
  const category = typeof book.category === "object" ? book.category?.name : undefined
  const cover = resolveAssetUrl(book.coverImage)

  return (
    <Link href={`/books/${book._id}`}>
      <Card className="group h-full py-0 transition-shadow hover:shadow-lg">
        <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
          {cover ? (
            <Image
              src={cover}
              alt={book.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 to-accent/40">
              <BookMarked className="size-10 text-primary/50" />
            </div>
          )}
          {book.grade != null && (
            <Badge className="absolute top-2.5 left-2.5" variant="secondary">
              {book.grade}-sinf
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-1.5 pt-4">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">{book.author}</p>
          {category && (
            <Badge variant="outline" className="w-fit">
              {category}
            </Badge>
          )}
        </CardContent>
        <CardFooter className="justify-between bg-transparent px-4 pt-0 pb-4">
          <span className="font-semibold text-success">Bepul</span>
          {book.downloadsCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Download className="size-3.5" />
              {formatNumber(book.downloadsCount)}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}

export function BookCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <div className="aspect-3/4 w-full animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
