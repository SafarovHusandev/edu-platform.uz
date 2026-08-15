"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardList, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Test nomi bo'yicha qidirish..."
          className="h-10 pl-9"
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Yaratuvchi</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>O&apos;tish balli</TableHead>
                <TableHead>Urinishlar</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((quiz) => {
                const creator = typeof quiz.createdBy === "object" ? quiz.createdBy : undefined
                return (
                  <TableRow key={quiz._id}>
                    <TableCell>
                      <Link href={`/teacher/quizzes/${quiz._id}`} className="font-medium hover:underline">
                        {quiz.title}
                      </Link>
                      {quiz.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{quiz.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{creator?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TARGET_LABELS[quiz.targetType] ?? quiz.targetType}</Badge>
                    </TableCell>
                    <TableCell>{quiz.passingScore}%</TableCell>
                    <TableCell>{quiz.maxAttempts}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
                          <Trash2 className="size-4" />
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

          <PaginationBar
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total}
            itemLabel="test"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
