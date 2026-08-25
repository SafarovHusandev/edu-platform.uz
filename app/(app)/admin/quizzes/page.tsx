"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardList, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { SkeletonTable } from "@/components/ui/skeleton"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { useQuizzes, useDeleteQuiz } from "@/hooks/use-quizzes"

const PAGE_SIZE = 15

const TARGET_LABELS: Record<string, string> = {
  standalone: "Mustaqil",
  course: "Kursga bog'liq",
  lesson: "Darsga bog'liq",
}

export default function AdminQuizzesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const { data, isLoading, isError, refetch } = useQuizzes({ page, limit: PAGE_SIZE })
  const deleteQuiz = useDeleteQuiz()

  const items = (data?.items ?? []).filter((quiz) =>
    quiz.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Testlar" description="Platformadagi barcha testlar" />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Test nomi bo'yicha qidirish..."
          className="h-11 rounded-md pl-10 text-base"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Test topilmadi" />
      ) : (
        <>
          <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-sm ring-1 ring-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Test
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Yaratuvchi
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Turi
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    O&apos;tish balli
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Urinishlar
                  </TableHead>
                  <TableHead className="h-12 bg-muted/40 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((quiz) => {
                  const creator = typeof quiz.createdBy === "object" ? quiz.createdBy : undefined
                  return (
                    <TableRow key={quiz._id} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <ClipboardList className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/teacher/quizzes/${quiz._id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {quiz.title}
                            </Link>
                            {quiz.description && (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {creator?.name ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="rounded-full px-2.5 py-1">
                          {TARGET_LABELS[quiz.targetType] ?? quiz.targetType}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold">{quiz.passingScore}%</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{quiz.maxAttempts}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-md"
                                aria-label="O'chirish"
                              />
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Testni o&apos;chirasizmi?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &quot;{quiz.title}&quot; va unga bog&apos;liq savollar butunlay o&apos;chib
                                ketadi. Bu amalni bekor qilib bo&apos;lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteQuiz.mutate(quiz._id)}>
                                O&apos;chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-4">
            <PaginationBar
              page={page}
              totalPages={data?.totalPages ?? 1}
              total={data?.total}
              itemLabel="test"
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
