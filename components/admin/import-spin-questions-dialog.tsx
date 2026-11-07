'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FilterPills } from '@/components/ui/filter-pills';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useImportSpinQuestions, type SpinQuestionCategory } from '@/hooks/use-spin-questions';
import type { ParsedQuestionError } from '@/lib/parse-quiz-docx';
import { parseSpinQuestionsDocx, type ParsedSpinQuestion } from '@/lib/parse-spin-questions';

export function ImportSpinQuestionsDialog({
  open,
  onOpenChange,
  categoryOptions,
  gradeItems,
  initialCategory,
  initialGrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: { value: SpinQuestionCategory; label: string }[];
  gradeItems: { value: string; label: string }[];
  initialCategory: SpinQuestionCategory;
  initialGrade: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [grade, setGrade] = useState(initialGrade);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [questions, setQuestions] = useState<ParsedSpinQuestion[]>([]);
  const [errors, setErrors] = useState<ParsedQuestionError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importQuestions = useImportSpinQuestions();
  const needsGrade = category === 'knowledge' && !grade;

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
      const result = await parseSpinQuestionsDocx(file);
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
    if (questions.length === 0 || needsGrade) return;
    const shared = { category, grade: category === 'logic' ? null : Number(grade) };
    importQuestions.mutate(
      questions.map((question) => ({ ...shared, ...question })),
      {
        onSuccess: ({ added, failed }) => {
          if (failed.length === 0) {
            toast.success(`${added} ta savol qo'shildi`);
            reset();
            onOpenChange(false);
            return;
          }
          // Faqat qo'shilmaganlarni qoldiramiz — qayta bosilganda takrorlanmasin
          toast.error(`${added} ta qo'shildi, ${failed.length} tasi qo'shilmadi`);
          setQuestions(failed.map(({ question }) => question));
        },
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (importQuestions.isPending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fayldan savollar yuklash</DialogTitle>
          <DialogDescription>
            Na&apos;muna faylni yuklab oling, savollaringizni o&apos;sha formatda yozing va tayyor
            faylni shu yerga yuklang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <a
            href="/templates/baraban-savollari-namunasi.docx"
            download
            className="flex items-center gap-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
          >
            <Download className="size-4 shrink-0" />
            Na&apos;muna Word faylni yuklab olish
          </a>

          <div className="space-y-2">
            <p className="text-sm font-medium">Fayldagi savollar toifasi</p>
            <FilterPills value={category} onChange={setCategory} options={categoryOptions} />
          </div>

          {category === 'knowledge' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sinf</p>
              <Select
                value={grade}
                onValueChange={(value) => setGrade(value ?? '')}
                items={gradeItems}
              >
                <SelectTrigger aria-label="Sinf" className="h-11 w-full">
                  <SelectValue placeholder="Sinfni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {gradeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                {questions.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-md px-1.5 py-1 text-sm"
                  >
                    <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.question}</span>
                    <span className="max-w-32 shrink-0 truncate text-xs font-semibold text-success">
                      {item.options[item.correctIndex]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!parsing && errors.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-medium text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{errors.length} ta savolda xatolik, o&apos;tkazib yuboriladi</span>
              </p>
              <ul className="space-y-1 text-xs text-destructive/90">
                {errors.map((error, index) => (
                  <li key={index}>
                    {error.questionNumber}-savol: {error.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          {fileName && !parsing && (
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={importQuestions.isPending}
            >
              <X className="size-4" /> Bekor qilish
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={parsing || questions.length === 0 || needsGrade || importQuestions.isPending}
          >
            {importQuestions.isPending && <Loader2 className="size-4 animate-spin" />}
            {questions.length > 0
              ? `${questions.length} ta savolni qo'shish`
              : "Savollarni qo'shish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
