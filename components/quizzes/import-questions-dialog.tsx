'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useBulkAddQuestions, type QuestionPayload } from '@/hooks/use-quizzes';
import { parseQuizDocx, type ParsedQuestionError } from '@/lib/parse-quiz-docx';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_LABELS: Record<QuestionPayload['type'], string> = {
  multiple_choice: "Ko'p tanlovli",
  true_false: "To'g'ri/Noto'g'ri",
  open_ended: 'Ochiq savol',
};

export function ImportQuestionsDialog({
  quizId,
  open,
  onOpenChange,
}: {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [errors, setErrors] = useState<ParsedQuestionError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkAdd = useBulkAddQuestions(quizId);

  function reset() {
    setFileName(null);
    setQuestions([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setQuestions([]);
    setErrors([]);
    try {
      const result = await parseQuizDocx(file);
      if (result.questions.length === 0 && result.errors.length === 0) {
        toast.error("Fayldan birorta savol topilmadi — na'muna faylga qarab tekshiring");
      }
      setQuestions(result.questions);
      setErrors(result.errors);
    } catch {
      toast.error("Faylni o'qib bo'lmadi — .docx formatida ekanligini tekshiring");
      reset();
    } finally {
      setParsing(false);
    }
  }

  function handleConfirm() {
    if (questions.length === 0) return;
    bulkAdd.mutate(questions, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Word fayldan savollar yuklash</DialogTitle>
          <DialogDescription>
            Na&apos;muna faylni yuklab oling, o&apos;sha formatda savollaringizni tuzib, tayyor
            faylni shu yerga yuklang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <a
            href="/templates/savol-namunasi.docx"
            download
            className="flex items-center gap-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
          >
            <Download className="size-4 shrink-0" />
            Na&apos;muna Word faylni yuklab olish
          </a>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/40 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Upload className="size-5" />
              )}
              {fileName ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <FileText className="size-4" /> {fileName}
                </span>
              ) : (
                <span>.docx faylni tanlash uchun bosing</span>
              )}
            </button>
          </div>

          {!parsing && questions.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" /> {questions.length} ta savol topildi
              </p>
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border/70 p-2.5">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-md px-1.5 py-1 text-sm"
                  >
                    <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">{idx + 1}.</span>
                    <span className="min-w-0 flex-1 truncate">{q.text}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {TYPE_LABELS[q.type]}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!parsing && errors.length > 0 && (
            <div
              className={cn(
                'space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'
              )}
            >
              <p className="flex items-center gap-1.5 font-medium text-destructive">
                <AlertTriangle className="size-4" /> {errors.length} ta savolda xatolik, o&apos;tkazib
                yuboriladi
              </p>
              <ul className="space-y-1 text-xs text-destructive/90">
                {errors.map((err, idx) => (
                  <li key={idx}>
                    {err.questionNumber}-savol: {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          {fileName && !parsing && (
            <Button type="button" variant="outline" onClick={reset}>
              <X className="size-4" /> Bekor qilish
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={parsing || questions.length === 0 || bulkAdd.isPending}
          >
            {bulkAdd.isPending && <Loader2 className="size-4 animate-spin" />}
            {questions.length > 0 ? `${questions.length} ta savolni qo'shish` : 'Savolni qo\'shish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
