'use client';

import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Eye,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkdownField } from '@/components/live-quiz/markdown-field';
import { OptionBadge, optionStyle } from '@/components/live-quiz/option-styles';
import { uploadLiveQuizImage } from '@/hooks/use-live-quizzes';
import {
  LIVE_IMAGE_TYPES,
  LIVE_LIMITS,
  POINTS_OPTIONS,
  TIME_LIMIT_OPTIONS,
  TRUE_FALSE_OPTIONS,
  plainQuestionText,
  toServerUrl,
  validateImageFile,
} from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { LiveQuizQuestion, PointsMultiplier } from '@/types/live-quiz';

const TIME_ITEMS = Object.fromEntries(TIME_LIMIT_OPTIONS.map((t) => [String(t), `${t} soniya`]));
const POINTS_ITEMS = Object.fromEntries(POINTS_OPTIONS.map((p) => [String(p.value), p.label]));

export function QuestionEditorCard({
  id,
  index,
  question,
  errors,
  collapsed,
  canDuplicate,
  onToggleCollapse,
  onChange,
  onDuplicate,
  onRemove,
  onPreview,
}: {
  id: string;
  index: number;
  question: LiveQuizQuestion;
  errors?: string[];
  collapsed: boolean;
  canDuplicate: boolean;
  onToggleCollapse: () => void;
  onChange: (patch: Partial<LiveQuizQuestion>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const hasErrors = !!errors?.length;
  const image = toServerUrl(question.image);

  function setOption(i: number, text: string) {
    onChange({ options: question.options.map((o, j) => (j === i ? text : o)) });
  }

  function removeOption(i: number) {
    const options = question.options.filter((_, j) => j !== i);
    let correctIndex = question.correctIndex;
    if (i === correctIndex) correctIndex = 0;
    else if (i < correctIndex) correctIndex -= 1;
    onChange({ options, correctIndex });
  }

  async function uploadImage(file: File) {
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setImageUploading(true);
    try {
      onChange({ image: await uploadLiveQuizImage(file) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rasmni yuklab bo'lmadi");
    } finally {
      setImageUploading(false);
    }
  }

  const isTrueFalse =
    question.options.length === 2 &&
    question.options[0] === TRUE_FALSE_OPTIONS[0] &&
    question.options[1] === TRUE_FALSE_OPTIONS[1];

  return (
    <div
      ref={setNodeRef}
      id={`lq-${id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'scroll-mt-24 rounded-[20px] border bg-card',
        hasErrors ? 'border-destructive ring-2 ring-destructive/25' : 'border-border',
        isDragging && 'relative z-10 shadow-lg'
      )}
    >
      {/* Sarlavha qatori */}
      <div className="flex items-center gap-1.5 p-2.5 pr-3 sm:gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={`${index + 1}-savolni sudrab tartiblash`}
        >
          <GripVertical className="size-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 text-left"
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-bold',
              hasErrors ? 'bg-destructive text-white' : 'bg-primary-soft text-primary'
            )}
          >
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {plainQuestionText(question.text, 90) || (
                <span className="text-muted-foreground">Yangi savol</span>
              )}
            </span>
            {collapsed && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{question.options.length} variant</span>
                <span className="flex items-center gap-0.5">
                  <Timer className="size-3" /> {question.timeLimit}s
                </span>
                {question.pointsMultiplier !== 1 && (
                  <span>{POINTS_ITEMS[String(question.pointsMultiplier)]}</span>
                )}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn('size-5 shrink-0 text-muted-foreground transition-transform', !collapsed && 'rotate-180')}
          />
        </button>
        <Button variant="ghost" size="icon" aria-label="Ko'rib chiqish" title="Doskada ko'rish" onClick={onPreview}>
          <Eye className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Nusxalash"
          title="Nusxalash"
          disabled={!canDuplicate}
          onClick={onDuplicate}
        >
          <Copy className="size-4.5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="O'chirish" title="O'chirish" onClick={onRemove}>
          <Trash2 className="size-4.5 text-destructive" />
        </Button>
      </div>

      {hasErrors && (
        <ul className="mx-4 mb-3 flex flex-col gap-1 rounded-xl bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
          {errors!.map((message, i) => (
            <li key={i} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {message}
            </li>
          ))}
        </ul>
      )}

      {!collapsed && (
        <div className="flex flex-col gap-5 border-t border-border p-4 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`lq-text-${id}`}>Savol matni</Label>
            <MarkdownField
              id={`lq-text-${id}`}
              value={question.text}
              onChange={(text) => onChange({ text })}
              invalid={hasErrors && !question.text.trim()}
            />
          </div>

          {/* Alohida rasm */}
          <div className="flex flex-col gap-1.5">
            <Label>Rasm (ixtiyoriy)</Label>
            {image ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="max-h-48 rounded-xl border border-border object-contain"
                />
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute right-2 top-2 shadow-sm"
                  aria-label="Rasmni olib tashlash"
                  onClick={() => onChange({ image: null })}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                disabled={imageUploading}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) uploadImage(file);
                }}
                className="flex min-h-20 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-input px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-60 sm:w-80"
              >
                {imageUploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImagePlus className="size-5" />
                )}
                {imageUploading ? 'Yuklanmoqda...' : 'Rasm yuklash · JPG, PNG, WEBP ≤ 5 MB'}
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept={LIVE_IMAGE_TYPES.join(',')}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) uploadImage(file);
              }}
            />
          </div>

          {/* Variantlar */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Variantlar · to&apos;g&apos;ri javobni belgilang</Label>
              <Button
                variant="outline"
                size="sm"
                disabled={isTrueFalse}
                onClick={() => onChange({ options: [...TRUE_FALSE_OPTIONS], correctIndex: 0 })}
              >
                To&apos;g&apos;ri / Noto&apos;g&apos;ri
              </Button>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2" role="radiogroup" aria-label="To'g'ri javob">
              {question.options.map((option, i) => {
                const correct = question.correctIndex === i;
                const style = optionStyle(i);
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border-2 p-1.5 transition-colors',
                      correct ? 'border-success bg-success-soft' : 'border-transparent bg-muted/50'
                    )}
                  >
                    <OptionBadge index={i} />
                    <Input
                      value={option}
                      maxLength={LIVE_LIMITS.optionMax}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`${style.name} variant`}
                      aria-label={`${i + 1}-variant (${style.name})`}
                      className="h-10 flex-1 bg-card"
                    />
                    <button
                      type="button"
                      role="radio"
                      aria-checked={correct}
                      aria-label={`${i + 1}-variant to'g'ri javob`}
                      title="To'g'ri javob"
                      onClick={() => onChange({ correctIndex: i })}
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-colors',
                        correct
                          ? 'border-success bg-success text-success-foreground'
                          : 'border-input bg-card text-transparent hover:text-muted-foreground'
                      )}
                    >
                      <Check className="size-5" strokeWidth={3} />
                    </button>
                    {question.options.length > LIVE_LIMITS.optionsMin && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        aria-label={`${i + 1}-variantni o'chirish`}
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <X className="size-4.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {question.options.length < LIVE_LIMITS.optionsMax && (
              <Button
                variant="ghost"
                className="w-fit"
                onClick={() => onChange({ options: [...question.options, ''] })}
              >
                <Plus /> Variant qo&apos;shish
              </Button>
            )}
          </div>

          {/* Taymer va ball */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Taymer</Label>
              <Select
                value={String(question.timeLimit)}
                onValueChange={(v) => v && onChange({ timeLimit: Number(v) })}
                items={TIME_ITEMS}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_LIMIT_OPTIONS.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      {t} soniya
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ball</Label>
              <Select
                value={String(question.pointsMultiplier)}
                onValueChange={(v) => v != null && onChange({ pointsMultiplier: Number(v) as PointsMultiplier })}
                items={POINTS_ITEMS}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POINTS_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
