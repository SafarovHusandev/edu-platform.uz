"use client"

import Link from "next/link"
import { ClipboardList, ChevronRight, Target, Repeat } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuizzes } from "@/hooks/use-quizzes"

export default function StudentQuizzesPage() {
  const { data, isLoading } = useQuizzes({ page: 1, limit: 50 })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Testlar</h1>
        <p className="mt-1 text-muted-foreground">Bilimingizni sinab ko&apos;ring</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hozircha testlar mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((quiz) => (
            <Link key={quiz._id} href={`/student/quizzes/${quiz._id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 pt-2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{quiz.title}</p>
                    {quiz.description && (
                      <p className="line-clamp-1 text-sm text-muted-foreground">{quiz.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="size-3.5" /> O&apos;tish balli: {quiz.passingScore}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="size-3.5" /> {quiz.maxAttempts} urinish
                      </span>
                      {quiz.questionsCount !== undefined && (
                        <Badge variant="outline">{quiz.questionsCount} savol</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
