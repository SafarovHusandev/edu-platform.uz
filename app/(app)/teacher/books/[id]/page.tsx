"use client"

import { use, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft,
  BookMarked,
  Camera,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import {
  useBook,
  useDeleteBook,
  useUpdateBook,
  useUploadBookCover,
  useUploadBookFile,
} from "@/hooks/use-books"
import { useBookCategories } from "@/hooks/use-book-categories"
import { resolveAssetUrl, bookDownloadUrl } from "@/lib/config"
import { formatNumber } from "@/lib/format"

interface PageProps {
  params: Promise<{ id: string }>
}

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1))

const bookSchema = z.object({
  title: z.string().min(2, { error: "Kamida 2 ta belgi" }).max(150),
  author: z.string().min(2, { error: "Kamida 2 ta belgi" }).max(100),
  description: z.string().optional(),
  category: z.string().min(1, { error: "Kategoriyani tanlang" }),
  grade: z.string().optional(),
})

type BookFormValues = z.infer<typeof bookSchema>

export default function TeacherBookDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: book, isLoading, isError, refetch } = useBook(id)
  const { data: categories } = useBookCategories()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
  const uploadCover = useUploadBookCover()
  const uploadFile = useUploadBookFile()

  const coverInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: { title: "", author: "", description: "", category: "", grade: "" },
    values: book
      ? {
          title: book.title,
          author: book.author,
          description: book.description ?? "",
          category: typeof book.category === "object" ? book.category._id : book.category,
          grade: book.grade != null ? String(book.grade) : "all",
        }
      : undefined,
  })

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />
  }

  if (!book) {
    return (
      <EmptyState
        title="Kitob topilmadi"
        action={
          <Link href="/teacher/books" className="text-sm font-medium text-primary hover:underline">
            Kitoblarga qaytish
          </Link>
        }
      />
    )
  }

  const cover = resolveAssetUrl(book.coverImage)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/teacher/books" />}>Kitoblarim</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{book.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/teacher/books" />}>
          <ArrowLeft className="size-4" /> Kitoblarga qaytish
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Download className="size-4" /> {formatNumber(book.downloadsCount ?? 0)} marta yuklab
          olingan
        </span>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-2">
          <div className="relative aspect-3/4 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
            {cover && (
              <Image src={cover} alt={book.title} fill unoptimized className="object-cover" />
            )}
            <button
              type="button"
              aria-label="Muqovani almashtirish"
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {uploadCover.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Camera className="size-5" />
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadCover.mutate({ id, file })
                e.target.value = ""
              }}
            />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={book.isPublished ?? false}
                onCheckedChange={(checked) => updateBook.mutate({ id, isPublished: checked })}
              />
              <Label>{book.isPublished ? "Nashr etilgan" : "Qoralama"}</Label>
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="size-4" /> O&apos;chirish
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
                  <AlertDialogAction
                    onClick={() =>
                      deleteBook.mutate(id, { onSuccess: () => router.push("/teacher/books") })
                    }
                  >
                    O&apos;chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kitob fayli</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" />
          </span>
          <div className="flex-1">
            {book.file ? (
              <a
                href={bookDownloadUrl(id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                Faylni ko&apos;rish / yuklab olish
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Fayl hali yuklanmagan</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadFile.isPending}
          >
            {uploadFile.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {book.file ? "Almashtirish" : "Yuklash"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadFile.mutate({ id, file })
              e.target.value = ""
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kitob ma&apos;lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                updateBook.mutate({
                  id,
                  title: values.title,
                  author: values.author,
                  description: values.description,
                  category: values.category,
                  grade: values.grade && values.grade !== "all" ? Number(values.grade) : null,
                })
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kitob nomi</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muallif</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategoriya</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={
                          categories?.map((cat) => ({ value: cat._id, label: cat.name })) ?? []
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinf</FormLabel>
                      <Select
                        value={field.value || "all"}
                        onValueChange={field.onChange}
                        items={[
                          { value: "all", label: "Barcha sinflar uchun" },
                          ...GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` })),
                        ]}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Barcha sinflar uchun</SelectItem>
                          {GRADE_NUMBERS.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}-sinf
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={updateBook.isPending}>
                {updateBook.isPending && <Loader2 className="size-4 animate-spin" />}
                Saqlash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {!book.isPublished && (
        <div className="flex items-center gap-2.5 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-gold-foreground">
          <BookMarked className="size-5 shrink-0" />
          Bu kitob hali qoralama holatida — nashr qilinmaguncha kutubxonada ko&apos;rinmaydi.
        </div>
      )}
    </div>
  )
}
