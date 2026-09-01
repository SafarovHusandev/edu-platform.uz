"use client"

import { useEffect, useRef, useState } from "react"
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
  // "Saqlash va yana qo'shish" faqat yangi savol qo'shishda ko'rsatiladi
  // (tahrirlashda emas) — bosilganda forma tozalanib, dialog ochiq qoladi.
  allowSaveAndAddAnother,
}: {
  initialQuestion?: Question | null
  onSubmit: (values: QuestionFormValues, keepOpen: boolean) => void
  isPending: boolean
  allowSaveAndAddAnother?: boolean
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
  // "Saqlash va yana qo'shish" bosilganda qaysi tugma band ekanini bilish uchun
  // (spinnerni to'g'ri tugmada ko'rsatish maqsadida).
  const [pendingMode, setPendingMode] = useState<"close" | "continue" | null>(null)

  const textRef = useRef<HTMLTextAreaElement>(null)
  const optionRefs = useRef<(HTMLInputElement | null)[]>([])
  const focusOptionIdxRef = useRef<number | null>(null)

  // Dialog ochilganda darhol savol matniga fokus tushsin. "Saqlash va yana
  // qo'shish" bosilgach ham bu komponent qayta mount bo'ladi (ota komponent
  // resetSignal'ni key'ga qo'shadi) — shu orqali forma tabiiy ravishda
  // bo'sh holatga qaytadi, alohida reset-effekt kerak emas.
  useEffect(() => {
    textRef.current?.focus()
  }, [])

  useEffect(() => {
    if (focusOptionIdxRef.current == null) return
    optionRefs.current[focusOptionIdxRef.current]?.focus()
    focusOptionIdxRef.current = null
  }, [options.length])

  function addOption(focusNew: boolean) {
    if (options.length >= LABELS.length) return
    setOptions((prev) => [...prev, ""])
    if (focusNew) focusOptionIdxRef.current = options.length
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key !== "Enter") return
    e.preventDefault()
    if (idx < options.length - 1) {
      optionRefs.current[idx + 1]?.focus()
    } else {
      addOption(true)
    }
  }

  function buildValues(): QuestionFormValues | null {
    if (!text.trim()) return null
    if (type === "multiple_choice") {
      return {
        text,
        type,
        points,
        correctAnswer,
        options: options
          .filter((o) => o.trim())
          .map((o, idx) => ({ label: LABELS[idx], text: o })),
      }
    }
    if (type === "true_false") {
      return {
        text,
        type,
        points,
        correctAnswer: correctAnswer === 0,
        options: [
          { label: "A", text: "To'g'ri" },
          { label: "B", text: "Noto'g'ri" },
        ],
      }
    }
    return { text, type, points, sampleAnswer: sampleAnswer.trim() || undefined }
  }

  function handleSubmit(keepOpen: boolean) {
    const values = buildValues()
    if (!values) return
    setPendingMode(keepOpen ? "continue" : "close")
    onSubmit(values, keepOpen)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Savol matni</Label>
          <Textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="2 + 2 = ?"
          />
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
                  ref={(el) => {
                    optionRefs.current[idx] = el
                  }}
                  value={option}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, i) => (i === idx ? e.target.value : o)))
                  }
                  onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                  placeholder={`Variant ${LABELS[idx]} — Enter bilan keyingisini qo'shing`}
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
              <Button type="button" variant="outline" size="sm" onClick={() => addOption(false)}>
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
        {allowSaveAndAddAnother && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isPending || !text.trim()}
          >
            {isPending && pendingMode === "continue" && <Loader2 className="size-4 animate-spin" />}
            Saqlash va yana qo&apos;shish
          </Button>
        )}
        <Button onClick={() => handleSubmit(false)} disabled={isPending || !text.trim()}>
          {isPending && pendingMode === "close" && <Loader2 className="size-4 animate-spin" />}
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
  isEditing,
  onSubmit,
  isPending,
  resetSignal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuestion?: Question | null
  // true — mavjud savolni tahrirlash; false/undefined — yangi savol (bo'sh yoki
  // boshqa savoldan nusxalab boshlangan bo'lishi mumkin).
  isEditing?: boolean
  onSubmit: (values: QuestionFormValues, keepOpen: boolean) => void
  isPending: boolean
  resetSignal?: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
        </DialogHeader>
        {open && (
          <QuestionForm
            // resetSignal o'zgarishi "Saqlash va yana qo'shish"dan keyingi
            // qayta mount qilishni majburlaydi — forma shu orqali tozalanadi.
            key={`${initialQuestion?._id ?? "new"}-${resetSignal ?? 0}`}
            initialQuestion={initialQuestion}
            onSubmit={onSubmit}
            isPending={isPending}
            allowSaveAndAddAnother={!isEditing}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
