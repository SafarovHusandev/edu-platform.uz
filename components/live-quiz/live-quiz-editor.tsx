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
  Eye,
  EyeOff,
  Info,
  Loader2,
  Play,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { QuestionEditorCard } from '@/components/live-quiz/question-editor-card';
import { BoardQuestion } from '@/components/live-quiz/board-views';
import { useSaveLiveQuiz, useStartLiveSession } from '@/hooks/use-live-quizzes';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import {
  LIVE_LIMITS,
  newQuestion,
  parseValidationErrors,
  sanitizeQuestion,
  validateQuestions,
} from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { LiveQuiz, LiveQuizQuestion } from '@/types/live-quiz';

interface Item {
  key: string;
  question: LiveQuizQuestion;
}

// Sudrab tartiblash va xatolarni bog'lash uchun barqaror kalit (crypto.randomUUID
// maktab LAN'idagi http sahifalarda mavjud bo'lmasligi mumkin)
let keySeq = 0;
const nextKey = () => `q${++keySeq}`;

function toItems(questions: LiveQuizQuestion[]): Item[] {
  return questions.map((question) => ({ key: nextKey(), question: { ...question, options: [...question.options] } }));
}

function omitKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

function scrollToCard(key: string) {
  window.requestAnimationFrame(() =>
    document.getElementById(`lq-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  );
}

export function LiveQuizEditor({ quiz, imported }: { quiz?: LiveQuiz; imported?: boolean }) {
  const router = useRouter();
  const save = useSaveLiveQuiz();
  const startSession = useStartLiveSession();

  const [title, setTitle] = useState(quiz?.title ?? '');
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [items, setItems] = useState<Item[]>(() =>
    quiz?.questions?.length ? toItems(quiz.questions) : [{ key: nextKey(), question: newQuestion() }]
  );
  // Ko'p savolli viktorinada kartalar yig'ilgan holda ochiladi
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    items.length <= 5 ? new Set(items.map((i) => i.key)) : new Set()
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewReveal, setPreviewReveal] = useState(false);
  const [importNote, setImportNote] = useState(!!imported);

  useUnsavedChangesWarning(dirty);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canAdd = items.length < LIVE_LIMITS.questionsMax;

  function touch() {
    setDirty(true);
    setFormError(null);
  }

  function updateQuestion(key: string, patch: Partial<LiveQuizQuestion>) {
    setItems((list) =>
      list.map((item) => (item.key === key ? { ...item, question: { ...item.question, ...patch } } : item))
    );
    if (errors[key]) setErrors((e) => omitKey(e, key));
    touch();
  }

  function addQuestion() {
    if (!canAdd) return;
    const item = { key: nextKey(), question: newQuestion() };
    setItems((list) => [...list, item]);
    setExpanded((s) => new Set(s).add(item.key));
    touch();
    scrollToCard(item.key);
  }

  function duplicate(index: number) {
    if (!canAdd) return;
    const source = items[index];
    const copy = { key: nextKey(), question: { ...source.question, _id: undefined, options: [...source.question.options] } };
    setItems((list) => [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    setExpanded((s) => new Set(s).add(copy.key));
    touch();
    scrollToCard(copy.key);
  }

  function remove(key: string) {
    setItems((list) => list.filter((item) => item.key !== key));
    setErrors((e) => omitKey(e, key));
    touch();
  }

  function toggle(key: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((list) => {
      const from = list.findIndex((i) => i.key === active.id);
      const to = list.findIndex((i) => i.key === over.id);
      return arrayMove(list, from, to);
    });
    touch();
  }

  // Savol indeksi bo'yicha xatolarni kartalarga bog'lab, birinchisiga scroll
  function showQuestionErrors(byIndex: Record<number, string[]>) {
    const byKey: Record<string, string[]> = {};
    for (const [index, messages] of Object.entries(byIndex)) {
      const item = items[Number(index)];
      if (item) byKey[item.key] = messages;
    }
    setErrors(byKey);
    const keys = Object.keys(byKey);
    if (keys.length) {
      setExpanded((s) => new Set([...s, ...keys]));
      const first = items.find((i) => byKey[i.key]);
      if (first) scrollToCard(first.key);
    }
    return keys.length;
  }

  function submit() {
    setTitleError(null);
    setFormError(null);
    if (!title.trim()) {
      setTitleError('Viktorina nomini kiriting');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const clientErrors = validateQuestions(items.map((i) => i.question));
    if (showQuestionErrors(clientErrors) > 0) {
      toast.error("Savollardagi xatolarni to'g'rilang");
      return;
    }
    setErrors({});

    save.mutate(
      {
        id: quiz?._id,
        title: title.trim(),
        description: description.trim() || undefined,
        questions: items.map((i) => sanitizeQuestion(i.question)),
      },
      {
        onSuccess: (saved) => {
          setDirty(false);
          toast.success('Viktorina saqlandi');
          if (!quiz) router.replace(`/super-teacher/live-quiz/${saved._id}/edit`);
        },
        onError: (error) => {
          const parsed = parseValidationErrors(error);
          if (parsed) {
            const count = showQuestionErrors(parsed.questions);
            if (parsed.fields.title) setTitleError(parsed.fields.title);
            const other = Object.entries(parsed.fields)
              .filter(([field]) => field !== 'title')
              .map(([, message]) => message);
            if (other.length) setFormError(other.join('. '));
            toast.error(count ? "Savollardagi xatolarni to'g'rilang" : "Ma'lumotlarni tekshiring");
            return;
          }
          toast.error(error instanceof Error ? error.message : 'Saqlashda xatolik');
        },
      }
    );
  }

  function startGame() {
    if (!quiz) return;
    if (dirty) {
      toast.error("Avval o'zgarishlarni saqlang");
      return;
    }
    startSession.mutate(quiz._id, {
      onSuccess: (session) => router.push(`/super-teacher/board/live/${session.pin}`),
    });
  }

  const preview = previewIndex != null ? items[previewIndex]?.question : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-24">
      <PageHeader
        title={quiz ? 'Viktorinani tahrirlash' : 'Yangi viktorina'}
        breadcrumbs={[
          { label: 'Super-ustoz', href: '/super-teacher' },
          { label: 'Jonli viktorina', href: '/super-teacher/live-quiz' },
          { label: quiz ? quiz.title : 'Yangi' },
        ]}
        className="mb-0"
        actions={
          <>
            <Button
              variant="outline"
              size="lg"
              disabled={items.length === 0}
              onClick={() => {
                setPreviewReveal(false);
                setPreviewIndex(0);
              }}
            >
              <Eye className="size-4" /> Ko&apos;rib chiqish
            </Button>
            {quiz && (
              <Button variant="outline" size="lg" disabled={startSession.isPending} onClick={startGame}>
                {startSession.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Boshlash
              </Button>
            )}
          </>
        }
      />

      {importNote && (
        <div className="flex items-start gap-3 rounded-[18px] bg-primary-soft p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm">
            <strong>Savollar testdan import qilindi.</strong> Har biriga 20 soniya taymer qo&apos;yildi —
            o&apos;yindan oldin vaqt, ball va variantlarni tekshirib chiqing.
          </p>
          <Button variant="ghost" size="icon-sm" aria-label="Yopish" onClick={() => setImportNote(false)}>
            <X />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lq-title">Nomi</Label>
          <Input
            id="lq-title"
            value={title}
            maxLength={LIVE_LIMITS.titleMax}
            aria-invalid={!!titleError}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(null);
              touch();
            }}
            placeholder="Masalan: Kasrlar — 5-sinf"
            className="h-11 text-base"
          />
          {titleError && <p className="text-sm text-destructive">{titleError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="lq-desc">Tavsif (ixtiyoriy)</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {description.length}/{LIVE_LIMITS.descriptionMax}
            </span>
          </div>
          <Textarea
            id="lq-desc"
            value={description}
            maxLength={LIVE_LIMITS.descriptionMax}
            onChange={(e) => {
              setDescription(e.target.value);
              touch();
            }}
            rows={2}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">
          Savollar <span className="text-muted-foreground">({items.length}/{LIVE_LIMITS.questionsMax})</span>
        </h2>
        {items.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setExpanded((s) => (s.size > 0 ? new Set() : new Set(items.map((i) => i.key))))
            }
          >
            {expanded.size > 0 ? "Hammasini yig'ish" : 'Hammasini ochish'}
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <QuestionEditorCard
                key={item.key}
                id={item.key}
                index={index}
                question={item.question}
                errors={errors[item.key]}
                collapsed={!expanded.has(item.key)}
                canDuplicate={canAdd}
                onToggleCollapse={() => toggle(item.key)}
                onChange={(patch) => updateQuestion(item.key, patch)}
                onDuplicate={() => duplicate(index)}
                onRemove={() => remove(item.key)}
                onPreview={() => {
                  setPreviewReveal(false);
                  setPreviewIndex(index);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        size="lg"
        className="h-14 border-2 border-dashed text-base"
        disabled={!canAdd}
        onClick={addQuestion}
      >
        <Plus className="size-5" /> Savol qo&apos;shish
      </Button>

      {formError && (
        <div className="flex items-start gap-3 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {formError}
        </div>
      )}

      {/* Saqlash paneli — doim ko'rinadi */}
      <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
        <span className={cn('px-2 text-sm', dirty ? 'font-semibold text-gold-foreground' : 'text-muted-foreground')}>
          {dirty ? "Saqlanmagan o'zgarishlar bor" : quiz ? "Barcha o'zgarishlar saqlangan" : 'Yangi viktorina'}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="lg" render={<Link href="/super-teacher/live-quiz" />}>
            Orqaga
          </Button>
          <Button size="lg" disabled={save.isPending} onClick={submit}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Saqlash
          </Button>
        </div>
      </div>

      {/* Ko'rib chiqish: doska komponentlari bilan */}
      <Dialog open={preview != null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="dark h-[min(92svh,900px)] max-w-[calc(100%-1.5rem)] grid-rows-[auto_1fr_auto] overflow-hidden bg-[#141B3D] p-0 text-white sm:max-w-6xl">
          <DialogTitle className="px-5 pt-4 text-base text-white/80">
            Ko&apos;rib chiqish — doskada shunday ko&apos;rinadi
          </DialogTitle>
          {preview && previewIndex != null && (
            <div className="overflow-y-auto px-5 pb-2 text-xl">
              <BoardQuestion
                question={{ ...preview, index: previewIndex, total: items.length }}
                remainingMs={previewReveal ? null : preview.timeLimit * 1000}
                correctIndex={previewReveal ? preview.correctIndex : null}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 py-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setPreviewReveal((v) => !v)}
            >
              {previewReveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {previewReveal ? 'Javobni yashirish' : "To'g'ri javob"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon-lg"
                aria-label="Oldingi savol"
                disabled={!previewIndex}
                onClick={() => {
                  setPreviewReveal(false);
                  setPreviewIndex((i) => (i ? i - 1 : 0));
                }}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon-lg"
                aria-label="Keyingi savol"
                disabled={previewIndex == null || previewIndex >= items.length - 1}
                onClick={() => {
                  setPreviewReveal(false);
                  setPreviewIndex((i) => Math.min(items.length - 1, (i ?? 0) + 1));
                }}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
