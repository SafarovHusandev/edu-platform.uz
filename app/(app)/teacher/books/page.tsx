"use client"

import Link from "next/link"
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
import { useBooks, useDeleteBook } from "@/hooks/use-books"
import { useAuthStore } from "@/store/auth-store"
import { resolveAssetUrl } from "@/lib/config"
import { formatNumber } from "@/lib/format"

export default function TeacherBooksPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useBooks({ page: 1, limit: 100 })
  const deleteBook = useDeleteBook()

  const myBooks = data?.items.filter((book) => {
    const uploaderId = typeof book.uploadedBy === "object" ? book.uploadedBy?._id : book.uploadedBy
    return uploaderId === user?._id
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Kitoblarim</h1>
          <p className="mt-1 text-muted-foreground">Yuklagan kitoblaringizni boshqaring</p>
        </div>
        <Button render={<Link href="/teacher/books/new" />}>
          <Plus className="size-4" /> Yangi kitob
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !myBooks || myBooks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <BookMarked className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hali kitob yuklamagansiz</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myBooks.map((book) => {
            const cover = resolveAssetUrl(book.coverImage)
            return (
              <Card key={book._id}>
                <CardContent className="flex items-center gap-4 pt-2">
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={book.title} className="size-full object-cover" />
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
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
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
