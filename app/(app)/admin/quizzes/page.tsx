"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ClipboardList, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useQuizzes, useDeleteQuiz } from "@/hooks/use-quizzes"

const PAGE_SIZE = 15

const TARGET_LABELS: Record<string, string> = {
  standalone: "Mustaqil",
  course: "Kursga bog'liq",
  lesson: "Darsga bog'liq",
}

export default function AdminQuizzesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuizzes({ page, limit: PAGE_SIZE })
  const deleteQuiz = useDeleteQuiz()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Testlar</h1>
        <p className="mt-1 text-muted-foreground">Platformadagi barcha testlar</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Test topilmadi</p>
        </div>
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
              {data.items.map((quiz) => {
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
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
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

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Jami {data.total} ta test</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
