"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle2, FileDown, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { useLesson, useCompleteLesson } from "@/hooks/use-lessons"
import { resolveAssetUrl } from "@/lib/config"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function LessonViewerPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: lesson, isLoading, isError, refetch } = useLesson(id)
  const completeLesson = useCompleteLesson()

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />
  }

  if (!lesson) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Dars topilmadi"
        action={
          <Link href="/student/courses" className="text-sm font-medium text-primary hover:underline">
            Kurslarimga qaytish
          </Link>
        }
      />
    )
  }

  const material = resolveAssetUrl(lesson.material)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href={`/student/courses`} />} className="w-fit">
        <ArrowLeft className="size-4" /> Kursga qaytish
      </Button>

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        {lesson.description && (
          <p className="mt-1 text-muted-foreground">{lesson.description}</p>
        )}
      </div>

      <Card>
        <CardContent className="pt-2">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {lesson.content || "Bu dars uchun matn kiritilmagan."}
          </div>
        </CardContent>
      </Card>

      {material && (
        <Card>
          <CardContent className="flex items-center justify-between pt-2">
            <p className="text-sm font-medium">Qo&apos;shimcha material</p>
            <Button variant="outline" size="sm" render={<a href={material} target="_blank" rel="noreferrer" />}>
              <FileDown className="size-4" /> Yuklab olish
            </Button>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => completeLesson.mutate(id)}
        disabled={completeLesson.isPending || lesson.isCompleted}
      >
        {completeLesson.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {lesson.isCompleted ? "Dars tugallangan" : "Darsni yakunlash"}
      </Button>
    </div>
  )
}
