"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, ListChecks, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { QuestionFormDialog, type QuestionFormValues } from "@/components/quizzes/question-form-dialog"
import {
  useQuizWithAnswers,
  useAddQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useUpdateQuiz,
} from "@/hooks/use-quizzes"
import type { Question } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Ko'p tanlovli",
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: "Ochiq savol",
}

export default function TeacherQuizDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: quiz, isLoading } = useQuizWithAnswers(id)
  const addQuestion = useAddQuestion(id)
  const updateQuestion = useUpdateQuestion(id)
  const deleteQuestion = useDeleteQuestion(id)
  const updateQuiz = useUpdateQuiz()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    title: "",
    description: "",
    passingScore: 60,
    maxAttempts: 3,
  })

  if (isLoading || !quiz) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />
  }

  function openSettings() {
    setSettingsForm({
      title: quiz!.title,
      description: quiz!.description ?? "",
      passingScore: quiz!.passingScore,
      maxAttempts: quiz!.maxAttempts,
    })
    setSettingsOpen(true)
  }

  function handleSettingsSubmit() {
    if (!settingsForm.title.trim()) return
    updateQuiz.mutate(
      { id, ...settingsForm },
      { onSuccess: () => setSettingsOpen(false) }
    )
  }

  function handleSubmit(values: QuestionFormValues) {
    if (editingQuestion) {
      updateQuestion.mutate(
        { id: editingQuestion._id, ...values },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      addQuestion.mutate(values, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/teacher/quizzes" />}>
          <ArrowLeft className="size-4" /> Testlarga qaytish
        </Button>
        <Button variant="outline" size="sm" render={<Link href={`/teacher/quizzes/${id}/results`} />}>
          <BarChart3 className="size-4" /> Natijalar
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Sozlamalarni tahrirlash" onClick={openSettings}>
            <Pencil className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>O&apos;tish balli: {quiz.passingScore}%</span>
          <span>Urinishlar: {quiz.maxAttempts}</span>
          <span>Savollar: {quiz.questions?.length ?? 0}</span>
        </CardContent>
      </Card>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test sozlamalari</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Test nomi"
              value={settingsForm.title}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Tavsif (ixtiyoriy)"
              value={settingsForm.description}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">O&apos;tish balli (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsForm.passingScore}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, passingScore: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Urinishlar soni</label>
                <Input
                  type="number"
                  min={1}
                  value={settingsForm.maxAttempts}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, maxAttempts: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSettingsSubmit} disabled={updateQuiz.isPending}>
              {updateQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="size-5" /> Savollar
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingQuestion(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" /> Savol qo&apos;shish
          </Button>
        </div>

        {!quiz.questions || quiz.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali savollar qo&apos;shilmagan</p>
        ) : (
          <div className="space-y-2">
            {quiz.questions.map((question, idx) => (
              <Card key={question._id}>
                <CardContent className="flex items-start gap-3 pt-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{question.text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{TYPE_LABELS[question.type]}</Badge>
                      <span>{question.points} ball</span>
                    </div>
                    {question.options && question.options.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {question.options.map((option, optIdx) => {
                          const isCorrect =
                            typeof question.correctAnswer === "boolean"
                              ? question.correctAnswer === (optIdx === 0)
                              : optIdx === question.correctAnswer
                          return (
                            <li
                              key={option.label}
                              className={isCorrect ? "font-medium text-success" : "text-muted-foreground"}
                            >
                              {option.label}. {option.text}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question)
                        setDialogOpen(true)
                      }}
                    >
                      Tahrirlash
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="size-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Savolni o&apos;chirasizmi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu amalni bekor qilib bo&apos;lmaydi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteQuestion.mutate(question._id)}>
                            O&apos;chirish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialQuestion={editingQuestion}
        onSubmit={handleSubmit}
        isPending={addQuestion.isPending || updateQuestion.isPending}
      />
    </div>
  )
}
