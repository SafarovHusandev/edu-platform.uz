'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Loader2,
  Play,
  Plus,
  Presentation,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestionEditorCard } from '@/components/live-quiz/question-editor-card';
import { SlideEditorCard } from '@/components/board-lesson/slide-editor-card';
import { LessonBackdrop, SlideView } from '@/components/board-lesson/slide-view';
import { ExerciseView } from '@/components/board-lesson/exercise-view';
import { AiGenerateDialog, type AiRequestedCounts } from '@/components/board-lesson/ai-generate-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { uploadBoardLessonImage, useSaveBoardLesson } from '@/hooks/use-board-lessons';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import {
  LESSON_LIMITS,
  LESSON_THEMES,
  LESSON_THEME_KEYS,
  exerciseToQuestion,
  newSlide,
  normalizeDraft,
  parseLessonValidation,
  questionToExercise,
  sanitizeSlide,
  validateExercises,
  validateSlides,
} from '@/lib/board-lesson';
import { newQuestion } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { BoardLesson, BoardLessonDraft, BoardLessonSlide, LessonThemeKey } from '@/types/board-lesson';
import type { LiveQuizQuestion } from '@/types/live-quiz';

interface SlideItem {
  key: string;
  slide: BoardLessonSlide;
}
interface ExerciseItem {
  key: string;
  question: LiveQuizQuestion;
}

let keySeq = 0;
const nextKey = (prefix: string) => `${prefix}${++keySeq}`;

const GRADE_ITEMS: Record<string, string> = {
  none: 'Tanlanmagan',
  ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [String(i + 1), `${i + 1}-sinf`])),
};

function omitKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

function scrollToCard(id: string) {
  window.requestAnimationFrame(() =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  );
}

type Preview = { kind: 'slide' | 'exercise'; index: number } | null;

// AI qoralamasi muharrirga tushgach: so'ralgan va olingan sonlar (banner uchun)
type AiDraftNotice = { slides: number; exercises: number } & AiRequestedCounts;

export function BoardLessonEditor({ lesson, autoOpenAi }: { lesson?: BoardLesson; autoOpenAi?: boolean }) {
  const router = useRouter();
  const save = useSaveBoardLesson();

  const [title, setTitle] = useState(lesson?.title ?? '');
  const [subject, setSubject] = useState(lesson?.subject ?? '');
  const [grade, setGrade] = useState(lesson?.grade ? String(lesson.grade) : 'none');
  const [description, setDescription] = useState(lesson?.description ?? '');
  const [theme, setTheme] = useState<LessonThemeKey>(lesson?.theme ?? 'ocean');
  const [slides, setSlides] = useState<SlideItem[]>(() =>
    lesson?.slides?.length
      ? lesson.slides.map((slide) => ({ key: nextKey('s'), slide: { ...slide } }))
      : [{ key: nextKey('s'), slide: newSlide() }]
  );
  const [exercises, setExercises] = useState<ExerciseItem[]>(() =>
    lesson?.exercises?.length
      ? lesson.exercises.map((e) => ({ key: nextKey('e'), question: exerciseToQuestion(e) }))
      : [{ key: nextKey('e'), question: newQuestion() }]
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const keys = [...slides, ...exercises].map((i) => i.key);
    return keys.length <= 4 ? new Set(keys) : new Set();
  });
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const [previewRound, setPreviewRound] = useState(0);
  // Ro'yxatdagi "AI bilan yaratish" tugmasi /new?ai=1 ga olib keladi
  const [aiOpen, setAiOpen] = useState(!!autoOpenAi && !lesson);
  const [aiNotice, setAiNotice] = useState<AiDraftNotice | null>(null);
  // AI natijasi mavjud kontent ustiga yozilishidan oldin tasdiq
  const [pendingDraft, setPendingDraft] = useState<{ draft: BoardLessonDraft; requested: AiRequestedCounts } | null>(
    null
  );

  // Muharrirda hali hech narsa yozilmagan (yangi darsning bo'sh holati)
  const isBlank =
    !title.trim() &&
    slides.every((i) => !i.slide.title.trim() && !i.slide.body.trim() && !i.slide.image) &&
    exercises.every((i) => !i.question.text.trim());

  function applyDraft(draft: BoardLessonDraft, requested: AiRequestedCounts) {
    const d = normalizeDraft(draft);
    if (!d.slides.length && !d.exercises.length) {
      toast.error("AI bo'sh natija qaytardi. Mavzuni aniqroq yozib, qayta urinib ko'ring");
      return;
    }
    if (d.title) setTitle(d.title);
    if (d.subject) setSubject(d.subject);
    if (d.grade) setGrade(String(d.grade));
    if (d.description) setDescription(d.description);
    if (d.theme) setTheme(d.theme);
    const slideItems = d.slides.map((slide) => ({ key: nextKey('s'), slide }));
    const exerciseItems = d.exercises.map((e) => ({ key: nextKey('e'), question: exerciseToQuestion(e) }));
    setSlides(slideItems);
    setExercises(exerciseItems);
    // Ko'rib chiqish oson bo'lsin: birinchi slayd va birinchi mashq ochiq
    setExpanded(new Set([slideItems[0]?.key, exerciseItems[0]?.key].filter(Boolean) as string[]));
    setErrors({});
    setTitleError(null);
    setAiNotice({ ...requested, slides: d.slides.length, exercises: d.exercises.length });
    touch();
    toast.success(`Tayyor: ${d.slides.length} ta slayd, ${d.exercises.length} ta mashq`, {
      description: "Tekshirib chiqing, kerak bo'lsa rasm qo'shing va saqlang",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onGenerated(draft: BoardLessonDraft, requested: AiRequestedCounts) {
    setAiOpen(false);
    if (isBlank) applyDraft(draft, requested);
    else setPendingDraft({ draft, requested });
  }

  useUnsavedChangesWarning(dirty);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canAddSlide = slides.length < LESSON_LIMITS.slidesMax;
  const canAddExercise = exercises.length < LESSON_LIMITS.exercisesMax;

  function touch() {
    setDirty(true);
    setFormError(null);
  }

  function clearError(key: string) {
    if (errors[key]) setErrors((e) => omitKey(e, key));
  }

  function toggle(key: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ---- Slaydlar ----
  function updateSlide(key: string, patch: Partial<BoardLessonSlide>) {
    setSlides((list) => list.map((i) => (i.key === key ? { ...i, slide: { ...i.slide, ...patch } } : i)));
    clearError(key);
    touch();
  }
  function addSlide() {
    if (!canAddSlide) return;
    const item = { key: nextKey('s'), slide: newSlide() };
    setSlides((list) => [...list, item]);
    setExpanded((s) => new Set(s).add(item.key));
    touch();
    scrollToCard(`ls-${item.key}`);
  }
  function duplicateSlide(index: number) {
    if (!canAddSlide) return;
    const copy = { key: nextKey('s'), slide: { ...slides[index].slide, _id: undefined } };
    setSlides((list) => [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    setExpanded((s) => new Set(s).add(copy.key));
    touch();
  }

  // ---- Mashqlar ----
  function updateExercise(key: string, patch: Partial<LiveQuizQuestion>) {
    setExercises((list) =>
      list.map((i) => (i.key === key ? { ...i, question: { ...i.question, ...patch } } : i))
    );
    clearError(key);
    touch();
  }
  function addExercise() {
    if (!canAddExercise) return;
    const item = { key: nextKey('e'), question: newQuestion() };
    setExercises((list) => [...list, item]);
    setExpanded((s) => new Set(s).add(item.key));
    touch();
    scrollToCard(`lq-${item.key}`);
  }
  function duplicateExercise(index: number) {
    if (!canAddExercise) return;
    const source = exercises[index].question;
    const copy = { key: nextKey('e'), question: { ...source, _id: undefined, options: [...source.options] } };
    setExercises((list) => [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    setExpanded((s) => new Set(s).add(copy.key));
    touch();
  }

  function onDragEnd<T extends { key: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setter((list) => {
        const from = list.findIndex((i) => i.key === active.id);
        const to = list.findIndex((i) => i.key === over.id);
        return arrayMove(list, from, to);
      });
      touch();
    };
  }

  // Indeks bo'yicha xatolarni kartalarga bog'lab, birinchisiga scroll
  function showErrors(slideErrors: Record<number, string[]>, exerciseErrors: Record<number, string[]>) {
    const byKey: Record<string, string[]> = {};
    let firstId: string | null = null;
    slides.forEach((item, i) => {
      if (slideErrors[i]) {
        byKey[item.key] = slideErrors[i];
        firstId ??= `ls-${item.key}`;
      }
    });
    exercises.forEach((item, i) => {
      if (exerciseErrors[i]) {
        byKey[item.key] = exerciseErrors[i];
        firstId ??= `lq-${item.key}`;
      }
    });
    setErrors(byKey);
    const keys = Object.keys(byKey);
    if (keys.length) setExpanded((s) => new Set([...s, ...keys]));
    if (firstId) scrollToCard(firstId);
    return keys.length;
  }

  function submit() {
    setTitleError(null);
    setFormError(null);
    if (!title.trim()) {
      setTitleError('Dars mavzusini kiriting');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!slides.length && !exercises.length) {
      setFormError("Kamida bitta slayd yoki mashq qo'shing");
      return;
    }
    if (showErrors(validateSlides(slides.map((i) => i.slide)), validateExercises(exercises.map((i) => i.question))) > 0) {
      toast.error("Xatolarni to'g'rilang");
      return;
    }
    setErrors({});

    save.mutate(
      {
        id: lesson?._id,
        title: title.trim(),
        subject: subject.trim() || undefined,
        grade: grade === 'none' ? null : Number(grade),
        description: description.trim() || undefined,
        theme,
        slides: slides.map((i) => sanitizeSlide(i.slide)),
        exercises: exercises.map((i) => questionToExercise(i.question)),
      },
      {
        onSuccess: (saved) => {
          setDirty(false);
          setAiNotice(null);
          toast.success('Dars saqlandi');
          if (!lesson) router.replace(`/super-teacher/lessons/${saved._id}/edit`);
        },
        onError: (error) => {
          const parsed = parseLessonValidation(error);
          if (parsed) {
            const count = showErrors(parsed.slides, parsed.exercises);
            if (parsed.fields.title) setTitleError(parsed.fields.title);
            const other = Object.entries(parsed.fields)
              .filter(([field]) => field !== 'title')
              .map(([, message]) => message);
            if (other.length) setFormError(other.join('. '));
            toast.error(count ? "Xatolarni to'g'rilang" : "Ma'lumotlarni tekshiring");
            return;
          }
          toast.error(error instanceof Error ? error.message : 'Saqlashda xatolik');
        },
      }
    );
  }

  function startOnBoard() {
    if (!lesson) return;
    if (dirty) {
      toast.error("Avval o'zgarishlarni saqlang");
      return;
    }
    router.push(`/super-teacher/board/lesson/${lesson._id}`);
  }

  const previewCount = preview?.kind === 'slide' ? slides.length : exercises.length;
  const movePreview = (delta: number) => {
    setPreview((p) => (p ? { ...p, index: Math.min(previewCount - 1, Math.max(0, p.index + delta)) } : p));
    setPreviewRound((r) => r + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-24">
      <PageHeader
        title={lesson ? 'Darsni tahrirlash' : 'Yangi dars'}
        breadcrumbs={[
          { label: 'Super-ustoz', href: '/super-teacher' },
          { label: 'Interaktiv dars', href: '/super-teacher/lessons' },
          { label: lesson ? lesson.title : 'Yangi' },
        ]}
        className="mb-0"
        actions={
          <>
            <Button size="lg" variant="outline" onClick={() => setAiOpen(true)}>
              <Sparkles className="size-4 text-primary" /> AI bilan yaratish
            </Button>
            {lesson && (
              <Button size="lg" onClick={startOnBoard}>
                <Play className="size-4" /> Doskada boshlash
              </Button>
            )}
          </>
        }
      />

      {aiNotice && (
        <div className="flex items-start gap-3 rounded-[20px] border border-primary/30 bg-primary-soft px-4 py-3.5">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-semibold text-foreground">AI qoralamasi — tekshirib, keyin saqlang</p>
            <p className="text-sm text-muted-foreground">
              Faktlar va to&apos;g&apos;ri javoblarni ko&apos;zdan kechiring. Slaydlarga rasmni qo&apos;lda
              qo&apos;shishingiz mumkin.
            </p>
            {(aiNotice.slides < aiNotice.slideCount || aiNotice.exercises < aiNotice.exerciseCount) && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-gold-foreground">
                <AlertTriangle className="size-4 shrink-0" />
                {[
                  aiNotice.slides < aiNotice.slideCount &&
                    `AI ${aiNotice.slideCount} ta o'rniga ${aiNotice.slides} ta slayd tuzdi`,
                  aiNotice.exercises < aiNotice.exerciseCount &&
                    `AI ${aiNotice.exerciseCount} ta o'rniga ${aiNotice.exercises} ta mashq tuzdi`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Yopish" onClick={() => setAiNotice(null)}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      {!lesson && isBlank && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="group flex items-center gap-4 rounded-[20px] bg-gradient-to-br from-[#3B1E8C] via-[#5B3BD1] to-[#1559C9] p-5 text-left text-white shadow-lg transition-transform active:scale-[0.99]"
        >
          <span className="lesson-bob flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="size-7" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-heading text-xl font-bold">AI bilan bir daqiqada tayyorlang</span>
            <span className="text-sm text-white/85">
              Mavzu va sinfni yozing — slaydlar va mustahkamlash mashqlari avtomatik tuziladi
            </span>
          </span>
          <span className="hidden rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#3B1E8C] sm:block">
            Boshlash
          </span>
        </button>
      )}

      {/* Asosiy ma'lumotlar */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bl-title">Mavzu</Label>
          <Input
            id="bl-title"
            value={title}
            maxLength={LESSON_LIMITS.titleMax}
            aria-invalid={!!titleError}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(null);
              touch();
            }}
            placeholder="Masalan: Oddiy kasrlar"
            className="h-11 text-base"
          />
          {titleError && <p className="text-sm text-destructive">{titleError}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bl-subject">Fan (ixtiyoriy)</Label>
            <Input
              id="bl-subject"
              value={subject}
              maxLength={LESSON_LIMITS.subjectMax}
              onChange={(e) => {
                setSubject(e.target.value);
                touch();
              }}
              placeholder="Matematika"
              className="h-11 text-base"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Sinf (ixtiyoriy)</Label>
            <Select
              value={grade}
              onValueChange={(v) => {
                if (!v) return;
                setGrade(v);
                touch();
              }}
              items={GRADE_ITEMS}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GRADE_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="bl-desc">Qisqa tavsif (ixtiyoriy)</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {description.length}/{LESSON_LIMITS.descriptionMax}
            </span>
          </div>
          <Textarea
            id="bl-desc"
            value={description}
            maxLength={LESSON_LIMITS.descriptionMax}
            onChange={(e) => {
              setDescription(e.target.value);
              touch();
            }}
            rows={2}
            placeholder="Doskadagi muqovada ko'rinadi"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Rang mavzusi</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LESSON_THEME_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTheme(key);
                  touch();
                }}
                aria-pressed={theme === key}
                className={cn(
                  'flex h-16 items-end rounded-2xl p-2 text-left text-sm font-bold text-white ring-offset-2 ring-offset-background transition-[box-shadow,transform] active:scale-[0.97]',
                  LESSON_THEMES[key].gradient,
                  theme === key ? 'ring-[3px] ring-primary' : 'opacity-85 hover:opacity-100'
                )}
              >
                {LESSON_THEMES[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slaydlar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Presentation className="size-5 text-primary" /> Mavzu slaydlari{' '}
          <span className="text-muted-foreground">
            ({slides.length}/{LESSON_LIMITS.slidesMax})
          </span>
        </h2>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(setSlides)}>
        <SortableContext items={slides.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {slides.map((item, index) => (
              <SlideEditorCard
                key={item.key}
                id={item.key}
                index={index}
                slide={item.slide}
                errors={errors[item.key]}
                collapsed={!expanded.has(item.key)}
                canDuplicate={canAddSlide}
                onToggleCollapse={() => toggle(item.key)}
                onChange={(patch) => updateSlide(item.key, patch)}
                onDuplicate={() => duplicateSlide(index)}
                onRemove={() => {
                  setSlides((list) => list.filter((i) => i.key !== item.key));
                  clearError(item.key);
                  touch();
                }}
                onPreview={() => setPreview({ kind: 'slide', index })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        size="lg"
        className="h-14 border-2 border-dashed text-base"
        disabled={!canAddSlide}
        onClick={addSlide}
      >
        <Plus className="size-5" /> Slayd qo&apos;shish
      </Button>

      {/* Mashqlar */}
      <div className="flex flex-col gap-1 pt-4">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Dumbbell className="size-5 text-primary" /> Mustahkamlash mashqlari{' '}
          <span className="text-muted-foreground">
            ({exercises.length}/{LESSON_LIMITS.exercisesMax})
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Mavzudan keyin doskada o&apos;quvchilar chiqib javobni bosadi. To&apos;g&apos;ri javobga konfetti va
          yulduzlar beriladi.
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(setExercises)}>
        <SortableContext items={exercises.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {exercises.map((item, index) => (
              <QuestionEditorCard
                key={item.key}
                id={item.key}
                index={index}
                question={item.question}
                errors={errors[item.key]}
                collapsed={!expanded.has(item.key)}
                canDuplicate={canAddExercise}
                onToggleCollapse={() => toggle(item.key)}
                onChange={(patch) => updateExercise(item.key, patch)}
                onDuplicate={() => duplicateExercise(index)}
                onRemove={() => {
                  setExercises((list) => list.filter((i) => i.key !== item.key));
                  clearError(item.key);
                  touch();
                }}
                onPreview={() => {
                  setPreviewRound((r) => r + 1);
                  setPreview({ kind: 'exercise', index });
                }}
                hideTiming
                upload={uploadBoardLessonImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        size="lg"
        className="h-14 border-2 border-dashed text-base"
        disabled={!canAddExercise}
        onClick={addExercise}
      >
        <Plus className="size-5" /> Mashq qo&apos;shish
      </Button>

      {formError && (
        <div className="flex items-start gap-3 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {formError}
        </div>
      )}

      {/* Saqlash paneli — doim ko'rinadi */}
      <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
        <span className={cn('px-2 text-sm', dirty ? 'font-semibold text-gold-foreground' : 'text-muted-foreground')}>
          {dirty ? "Saqlanmagan o'zgarishlar bor" : lesson ? "Barcha o'zgarishlar saqlangan" : 'Yangi dars'}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="lg" render={<Link href="/super-teacher/lessons" />}>
            Orqaga
          </Button>
          <Button size="lg" disabled={save.isPending} onClick={submit}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Saqlash
          </Button>
        </div>
      </div>

      <AiGenerateDialog
        // Har ochilishda joriy mavzu/sinf bilan yangidan to'ldiriladi
        key={aiOpen ? 'ai-open' : 'ai-closed'}
        open={aiOpen}
        onOpenChange={setAiOpen}
        initialTopic={title}
        initialGrade={grade === 'none' ? null : Number(grade)}
        initialSubject={subject}
        onGenerated={onGenerated}
      />

      <AlertDialog open={pendingDraft != null} onOpenChange={(open) => !open && setPendingDraft(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI natijasi bilan almashtirilsinmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Hozirgi slaydlar va mashqlar o&apos;rniga AI tuzgan dars qo&apos;yiladi. Saqlamaguningizcha
              serverdagi dars o&apos;zgarmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDraft) applyDraft(pendingDraft.draft, pendingDraft.requested);
                setPendingDraft(null);
              }}
            >
              Almashtirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ko'rib chiqish: doska komponentlari bilan */}
      <Dialog open={preview != null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="dark h-[min(92svh,900px)] max-w-[calc(100%-1.5rem)] grid-rows-[auto_1fr_auto] overflow-hidden bg-[#141B3D] p-0 text-white sm:max-w-6xl">
          <DialogTitle className="px-5 pt-4 text-base text-white/80">
            Ko&apos;rib chiqish — doskada shunday ko&apos;rinadi
          </DialogTitle>
          {preview && (
            <LessonBackdrop
              theme={preview.kind === 'slide' ? (slides[preview.index]?.slide.theme ?? theme) : theme}
              className="mx-3 flex flex-col overflow-y-auto rounded-2xl p-6 text-xl"
            >
              {preview.kind === 'slide' && slides[preview.index] && (
                <SlideView slide={slides[preview.index].slide} lessonThemeKey={theme} />
              )}
              {preview.kind === 'exercise' && exercises[preview.index] && (
                <ExerciseView
                  key={`${previewRound}-${preview.index}`}
                  exercise={questionToExercise(exercises[preview.index].question)}
                  index={preview.index}
                  total={exercises.length}
                  onSolved={() => {}}
                />
              )}
            </LessonBackdrop>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3">
            <Button
              variant="secondary"
              size="icon-lg"
              aria-label="Oldingi"
              disabled={!preview?.index}
              onClick={() => movePreview(-1)}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon-lg"
              aria-label="Keyingi"
              disabled={!preview || preview.index >= previewCount - 1}
              onClick={() => movePreview(1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
