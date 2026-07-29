"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Question, QuestionType } from "@/types"
import { cn } from "@/lib/utils"

const LABELS = ["A", "B", "C", "D", "E", "F"]
const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Ko'p tanlovli",
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: "Ochiq savol",
}

export interface QuestionFormValues {
  text: string
  type: QuestionType
  options?: { label: string; text: string }[]
  correctAnswer?: number | boolean
  sampleAnswer?: string
  points: number
}

function QuestionForm({
  initialQuestion,
  onSubmit,
  isPending,
}: {
  initialQuestion?: Question | null
  onSubmit: (values: QuestionFormValues) => void
  isPending: boolean
}) {
  const [text, setText] = useState(initialQuestion?.text ?? "")
  const [type, setType] = useState<QuestionType>(initialQuestion?.type ?? "multiple_choice")
  const [options, setOptions] = useState<string[]>(
    initialQuestion?.options?.length ? initialQuestion.options.map((o) => o.text) : ["", ""]
  )
  // Ichkarida har doim index (0/1) sifatida boshqariladi — true_false uchun
  // submit paytida boolean'ga aylantiriladi, chunki backend aynan shuni kutadi.
  const initialTrueFalseIndex = initialQuestion?.correctAnswer === false ? 1 : 0
  const [correctAnswer, setCorrectAnswer] = useState<number>(
    typeof initialQuestion?.correctAnswer === "number"
      ? initialQuestion.correctAnswer
      : initialTrueFalseIndex
  )
  const [sampleAnswer, setSampleAnswer] = useState(initialQuestion?.sampleAnswer ?? "")
  const [points, setPoints] = useState(initialQuestion?.points ?? 1)

  function handleSubmit() {
    if (!text.trim()) return
    if (type === "multiple_choice") {
      onSubmit({
        text,
        type,
        points,
        correctAnswer,
        options: options
          .filter((o) => o.trim())
          .map((o, idx) => ({ label: LABELS[idx], text: o })),
      })
    } else if (type === "true_false") {
      onSubmit({
        text,
        type,
        points,
        correctAnswer: correctAnswer === 0,
        options: [
          { label: "A", text: "To'g'ri" },
          { label: "B", text: "Noto'g'ri" },
        ],
      })
    } else {
      onSubmit({ text, type, points, sampleAnswer: sampleAnswer.trim() || undefined })
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Savol matni</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="2 + 2 = ?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Turi</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as QuestionType)}
              items={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ball</Label>
            <Input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>
        </div>

        {type === "multiple_choice" && (
          <div className="space-y-2">
            <Label>Variantlar (to&apos;g&apos;risini belgilang)</Label>
            {options.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(idx)}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    correctAnswer === idx
                      ? "border-success bg-success/15 text-success"
                      : "border-input text-muted-foreground"
                  )}
                >
                  {LABELS[idx]}
                </button>
                <Input
                  value={option}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, i) => (i === idx ? e.target.value : o)))
                  }
                  placeholder={`Variant ${LABELS[idx]}`}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < LABELS.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => [...prev, ""])}
              >
                <Plus className="size-3.5" /> Variant qo&apos;shish
              </Button>
            )}
          </div>
        )}

        {type === "true_false" && (
          <div className="space-y-2">
            <Label>To&apos;g&apos;ri javob</Label>
            <div className="flex gap-2">
              {["To'g'ri", "Noto'g'ri"].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCorrectAnswer(idx)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    correctAnswer === idx
                      ? "border-success bg-success/15 text-success"
                      : "border-input text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "open_ended" && (
          <div className="space-y-1.5">
            <Label>Namuna javob (ixtiyoriy)</Label>
            <Textarea
              value={sampleAnswer}
              onChange={(e) => setSampleAnswer(e.target.value)}
              placeholder="Faqat siz ko'radigan namuna javob, o'quvchiga ko'rsatilmaydi"
            />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isPending || !text.trim()}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Saqlash
        </Button>
      </DialogFooter>
    </>
  )
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  initialQuestion,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuestion?: Question | null
  onSubmit: (values: QuestionFormValues) => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialQuestion ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
        </DialogHeader>
        {open && (
          <QuestionForm
            key={initialQuestion?._id ?? "new"}
            initialQuestion={initialQuestion}
            onSubmit={onSubmit}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
