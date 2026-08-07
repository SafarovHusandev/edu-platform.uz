"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, SearchX } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { BookCard, BookCardSkeleton } from "@/components/books/book-card"
import { useBooks } from "@/hooks/use-books"
import { useBookCategories } from "@/hooks/use-book-categories"

const PAGE_SIZE = 12
const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1))

function BooksCatalog() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page") ?? "1")
  const category = searchParams.get("category") ?? ""
  const grade = searchParams.get("grade") ?? ""
  const initialSearch = searchParams.get("search") ?? ""
  const [searchInput, setSearchInput] = useState(initialSearch)

  const { data: categories } = useBookCategories()
  const { data, isLoading, isPlaceholderData } = useBooks({
    page,
    limit: PAGE_SIZE,
    search: initialSearch || undefined,
    category: category || undefined,
    grade: grade ? Number(grade) : undefined,
  })

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== initialSearch) {
        updateParams({ search: searchInput || undefined, page: undefined })
      }
    }, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const totalPages = data?.totalPages ?? 1
  const baseParams = {
    ...(category && { category }),
    ...(grade && { grade }),
    ...(initialSearch && { search: initialSearch }),
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Kutubxona</h1>
        <p className="mt-1 text-muted-foreground">
          {data?.total ? `${data.total} ta bepul kitob topildi` : "Bepul kitoblarni yuklab oling va o'qing"}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Kitob nomi yoki muallif bo'yicha qidirish..."
            className="h-10 pl-9"
          />
        </div>
        <Select
          value={category || "all"}
          onValueChange={(value) =>
            updateParams({ category: !value || value === "all" ? undefined : value, page: undefined })
          }
          items={[
            { value: "all", label: "Barcha kategoriyalar" },
            ...(categories?.map((cat) => ({ value: cat._id, label: cat.name })) ?? []),
          ]}
        >
          <SelectTrigger className="h-10 w-full sm:w-56">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={grade || "all"}
          onValueChange={(value) =>
            updateParams({ grade: !value || value === "all" ? undefined : value, page: undefined })
          }
          items={[
            { value: "all", label: "Barcha sinflar" },
            ...GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` })),
          ]}
        >
          <SelectTrigger className="h-10 w-full sm:w-40">
            <SelectValue placeholder="Sinf" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sinflar</SelectItem>
            {GRADE_NUMBERS.map((n) => (
              <SelectItem key={n} value={n}>
                {n}-sinf
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div
          className={
            isPlaceholderData
              ? "grid gap-5 opacity-60 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }
        >
          {data.items.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="font-medium">Hech qanday kitob topilmadi</p>
          <p className="text-sm text-muted-foreground">
            Boshqa kalit so&apos;z yoki filtr bilan qidirib ko&apos;ring
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`${pathname}?${new URLSearchParams({ ...baseParams, page: String(Math.max(1, page - 1)) }).toString()}`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <PaginationItem key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 ? <span className="px-1 text-muted-foreground">…</span> : null}
                  <PaginationLink
                    isActive={p === page}
                    href={`${pathname}?${new URLSearchParams({ ...baseParams, page: String(p) }).toString()}`}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                href={`${pathname}?${new URLSearchParams({ ...baseParams, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Container>
  )
}

export default function BooksPage() {
  return (
    <Suspense>
      <BooksCatalog />
    </Suspense>
  )
}
