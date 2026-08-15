"use client"

import Link from "next/link"
import Image from "next/image"
import { BookMarked, Plus, Trash2, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonList } from "@/components/ui/skeleton"
import { useBooks, useDeleteBook } from "@/hooks/use-books"
import { useAuthStore } from "@/store/auth-store"
import { resolveAssetUrl } from "@/lib/config"
import { formatNumber } from "@/lib/format"

export default function TeacherBooksPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, refetch } = useBooks({ page: 1, limit: 100 })
  const deleteBook = useDeleteBook()

  const myBooks = data?.items.filter((book) => {
    const uploaderId = typeof book.uploadedBy === "object" ? book.uploadedBy?._id : book.uploadedBy
    return uploaderId === user?._id
  })

  return (
    <div>
      <PageHeader
        title="Kitoblarim"
        description="Yuklagan kitoblaringizni boshqaring"
        actions={
          <Button render={<Link href="/teacher/books/new" />}>
            <Plus className="size-4" /> Yangi kitob
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-20" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !myBooks || myBooks.length === 0 ? (
        <EmptyState icon={BookMarked} title="Hali kitob yuklamagansiz" />
      ) : (
        <div className="space-y-3">
          {myBooks.map((book) => {
            const cover = resolveAssetUrl(book.coverImage)
            return (
              <Card key={book._id}>
                <CardContent className="flex items-center gap-4 pt-2">
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {cover ? (
                      <Image src={cover} alt={book.title} width={44} height={44} unoptimized className="size-full object-cover" />
                    ) : (
                      <BookMarked className="size-5" />
                    )}
                  </span>
                  <Link href={`/teacher/books/${book._id}`} className="flex-1">
                    <p className="font-medium hover:underline">{book.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={book.isPublished ? "default" : "secondary"}>
                        {book.isPublished ? "Nashr etilgan" : "Qoralama"}
                      </Badge>
                      {book.grade != null && <Badge variant="outline">{book.grade}-sinf</Badge>}
                      <span className="flex items-center gap-1">
                        <Download className="size-3.5" /> {formatNumber(book.downloadsCount ?? 0)}
                      </span>
                    </div>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kitobni o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu amalni bekor qilib bo&apos;lmaydi. Muqova va fayl ham diskdan
                          o&apos;chiriladi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteBook.mutate(book._id)}>
                          O&apos;chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
