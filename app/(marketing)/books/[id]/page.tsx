import { notFound } from "next/navigation"
import Image from "next/image"
import { BookMarked, Download, User2 } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { resolveAssetUrl, bookDownloadUrl } from "@/lib/config"
import { formatNumber } from "@/lib/format"
import type { Book } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getBook(id: string) {
  try {
    const res = await api.get<{ book: Book }>(`/books/${id}`, undefined, { skipAuth: true })
    return res.book
  } catch {
    return null
  }
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params
  const book = await getBook(id)
  if (!book) notFound()

  const category = typeof book.category === "object" ? book.category?.name : undefined
  const uploader = typeof book.uploadedBy === "object" ? book.uploadedBy : undefined
  const cover = resolveAssetUrl(book.coverImage)

  return (
    <div className="pb-16">
      <div className="border-b border-border/60 bg-muted/30">
        <Container className="grid gap-8 py-10 lg:grid-cols-[280px_1fr] lg:py-14">
          <div className="mx-auto w-full max-w-56 lg:mx-0">
            {cover ? (
              <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-muted shadow-lg">
                <Image src={cover} alt={book.title} fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="flex aspect-3/4 w-full items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-accent/40">
                <BookMarked className="size-12 text-primary/50" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {category && <Badge variant="secondary">{category}</Badge>}
              {book.grade != null && <Badge variant="outline">{book.grade}-sinf</Badge>}
            </div>
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {book.title}
            </h1>
            <p className="text-lg text-muted-foreground">{book.author}</p>
            {book.description && (
              <p className="max-w-2xl text-muted-foreground">{book.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {uploader && (
                <span className="flex items-center gap-1.5">
                  <User2 className="size-4" /> {uploader.name}
                </span>
              )}
              {book.downloadsCount !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Download className="size-4" /> {formatNumber(book.downloadsCount)} marta yuklab olingan
                </span>
              )}
            </div>
            <div>
              <Button
                size="lg"
                disabled={!book.file}
                render={
                  book.file ? (
                    <a href={bookDownloadUrl(book._id)} target="_blank" rel="noopener noreferrer" />
                  ) : undefined
                }
              >
                <Download className="size-4" />
                {book.file ? "Yuklab olish" : "Fayl hali yuklanmagan"}
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  )
}
