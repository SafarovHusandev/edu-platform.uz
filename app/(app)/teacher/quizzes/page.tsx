"use client"

import Link from "next/link"
import { ClipboardList, Plus, Trash2, BarChart3 } from "lucide-react"
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
import { useQuizzes, useDeleteQuiz } from "@/hooks/use-quizzes"

export default function TeacherQuizzesPage() {
  const { data, isLoading, isError, refetch } = useQuizzes({ page: 1, limit: 100 })
  const deleteQuiz = useDeleteQuiz()

  return (
    <div>
      <PageHeader
        title="Testlar"
        description="Testlaringizni yarating va boshqaring"
        actions={
          <Button render={<Link href="/teacher/quizzes/new" />}>
            <Plus className="size-4" /> Yangi test
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-20" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Hali test yaratmagansiz" />
      ) : (
        <div className="space-y-3">
          {data.items.map((quiz) => (
            <Card key={quiz._id}>
              <CardContent className="flex items-center gap-4 pt-2">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="size-5" />
                </span>
                <Link href={`/teacher/quizzes/${quiz._id}`} className="flex-1">
                  <p className="font-medium hover:underline">{quiz.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {quiz.grade != null && <Badge variant="outline">{quiz.grade}-sinf</Badge>}
                    <Badge variant="outline">{quiz.questionsCount ?? quiz.questions?.length ?? 0} savol</Badge>
                    <span>O&apos;tish balli: {quiz.passingScore}%</span>
                  </div>
                </Link>
                <Button variant="ghost" size="icon-sm" render={<Link href={`/teacher/quizzes/${quiz._id}/results`} />}>
                  <BarChart3 className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Testni o&apos;chirasizmi?</AlertDialogTitle>
                      <AlertDialogDescription>Bu amalni bekor qilib bo&apos;lmaydi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteQuiz.mutate(quiz._id)}>
                        O&apos;chirish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
