'use client';

import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  Ban,
  ChevronDown,
  Copy,
  Eye,
  GripVertical,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownField } from '@/components/live-quiz/markdown-field';
import { LessonIcon } from '@/components/board-lesson/slide-view';
import { uploadBoardLessonImage } from '@/hooks/use-board-lessons';
import {
  LESSON_ICONS,
  LESSON_LIMITS,
  LESSON_THEMES,
  LESSON_THEME_KEYS,
  SLIDE_LAYOUTS,
} from '@/lib/board-lesson';
import { LIVE_IMAGE_TYPES, plainQuestionText, toServerUrl, validateImageFile } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { BoardLessonSlide } from '@/types/board-lesson';

const pill =
  'flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-sm font-semibold transition-colors';

export function SlideEditorCard({
  id,
  index,
  slide,
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
  slide: BoardLessonSlide;
  errors?: string[];
  collapsed: boolean;
  canDuplicate: boolean;
  onToggleCollapse: () => void;
  onChange: (patch: Partial<BoardLessonSlide>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const hasErrors = !!errors?.length;
  const image = toServerUrl(slide.image);
  const hasIcon = !!(slide.icon && LESSON_ICONS[slide.icon]);

  async function uploadImage(file: File) {
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setImageUploading(true);
    try {
      const path = await uploadBoardLessonImage(file);
      onChange({ image: path, layout: slide.layout === 'text' ? 'split' : slide.layout });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rasmni yuklab bo'lmadi");
    } finally {
      setImageUploading(false);
    }
  }

  const summary = slide.title.trim() || plainQuestionText(slide.body, 90);

  return (
    <div
      ref={setNodeRef}
      id={`ls-${id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'scroll-mt-24 rounded-[20px] border bg-card',
        hasErrors ? 'border-destructive ring-2 ring-destructive/25' : 'border-border',
        isDragging && 'relative z-10 shadow-lg'
      )}
    >
      <div className="flex items-center gap-1.5 p-2.5 pr-3 sm:gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={`${index + 1}-slaydni sudrab tartiblash`}
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
              'flex size-8 shrink-0 items-center justify-center rounded-lg text-white',
              hasErrors ? 'bg-destructive' : LESSON_THEMES[slide.theme ?? 'ocean'].swatch,
              !slide.theme && !hasErrors && 'bg-primary'
            )}
          >
            {hasIcon ? <LessonIcon name={slide.icon} className="size-4.5" /> : <span className="font-heading text-sm font-bold">{index + 1}</span>}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {summary || <span className="text-muted-foreground">Yangi slayd</span>}
            </span>
            {collapsed && (
              <span className="text-xs text-muted-foreground">
                {index + 1}-slayd · {SLIDE_LAYOUTS.find((l) => l.value === slide.layout)?.label}
                {slide.image ? ' · rasm bor' : ''}
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
            <Label htmlFor={`ls-title-${id}`}>Sarlavha</Label>
            <Input
              id={`ls-title-${id}`}
              value={slide.title}
              maxLength={LESSON_LIMITS.slideTitleMax}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Masalan: Kasr nima?"
              className="h-11 text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`ls-body-${id}`}>Matn</Label>
            <MarkdownField
              id={`ls-body-${id}`}
              value={slide.body}
              onChange={(body) => onChange({ body })}
              upload={uploadBoardLessonImage}
              height={220}
            />
            <p className="text-xs text-muted-foreground">
              Qisqa va yirik yozing: doskada 3–5 qator yaxshi o&apos;qiladi. <strong>Qalin</strong> so&apos;zlar
              rangli chiqadi.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Rasm</Label>
              {image ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="max-h-40 rounded-xl border border-border object-contain" />
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="absolute right-2 top-2 shadow-sm"
                    aria-label="Rasmni olib tashlash"
                    onClick={() => onChange({ image: null, layout: 'text' })}
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
                  className="flex min-h-20 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-input px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-60"
                >
                  {imageUploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
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

            <div className="flex flex-col gap-1.5">
              <Label>Ko&apos;rinish</Label>
              <div className="flex flex-wrap gap-2">
                {SLIDE_LAYOUTS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    disabled={l.value !== 'text' && !slide.image}
                    onClick={() => onChange({ layout: l.value })}
                    className={cn(
                      pill,
                      'disabled:cursor-not-allowed disabled:opacity-40',
                      slide.layout === l.value ? 'border-primary bg-primary-soft text-primary' : 'border-input'
                    )}
                    title={l.value !== 'text' && !slide.image ? 'Avval rasm yuklang' : undefined}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Belgi</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ icon: null })}
                aria-pressed={!slide.icon}
                title="Belgisiz"
                className={cn(pill, 'w-10 px-0', !slide.icon ? 'border-primary bg-primary-soft text-primary' : 'border-input')}
              >
                <Ban className="size-4.5" />
              </button>
              {Object.entries(LESSON_ICONS).map(([key, { label, icon: I }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ icon: key })}
                  aria-pressed={slide.icon === key}
                  aria-label={label}
                  title={label}
                  className={cn(
                    pill,
                    'w-10 px-0',
                    slide.icon === key ? 'border-primary bg-primary-soft text-primary' : 'border-input'
                  )}
                >
                  <I className="size-4.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fon rangi</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ theme: null })}
                className={cn(pill, !slide.theme ? 'border-primary bg-primary-soft text-primary' : 'border-input')}
              >
                Dars rangi
              </button>
              {LESSON_THEME_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ theme: key })}
                  className={cn(pill, slide.theme === key ? 'border-primary' : 'border-input')}
                >
                  <span className={cn('size-4 rounded-full', LESSON_THEMES[key].swatch)} />
                  {LESSON_THEMES[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
