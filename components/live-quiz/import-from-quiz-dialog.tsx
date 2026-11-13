'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ClipboardList, Info, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuizzesMy } from '@/hooks/use-quizzes';
import { useImportLiveQuiz } from '@/hooks/use-live-quizzes';
import { ApiError } from '@/lib/api-client';
import { LIVE_LIMITS } from '@/lib/live-quiz';
import { cn } from '@/lib/utils';
import type { LiveImportResult } from '@/types/live-quiz';

// Oddiy testdan jonli viktorina yaratish. Ochiq javobli savollar o'tmaydi.
export function ImportFromQuizDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const quizzes = useQuizzesMy({ page: 1, limit: 100 });
  const importQuiz = useImportLiveQuiz();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<LiveImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (quizzes.data?.items ?? []).filter((quiz) => !q || quiz.title.toLowerCase().includes(q));
  }, [quizzes.data?.items, search]);

  function reset() {
    setSearch('');
    setSelectedId(null);
    setTitle('');
    setResult(null);
    setError(null);
    importQuiz.reset();
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function submit() {
    if (!selectedId) return;
    setError(null);
    importQuiz.mutate(
      { quizId: selectedId, title: title.trim() || undefined },
      {
        onSuccess: setResult,
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'NO_COMPATIBLE_QUESTIONS') {
            setError(
              "Bu testda jonli viktorinaga mos savol yo'q (ochiq javobli savollar o'tmaydi)"
            );
            return;
          }
          toast.error(err instanceof Error ? err.message : 'Import qilishda xatolik');
        },
      }
    );
  }

  const selected = quizzes.data?.items.find((q) => q._id === selectedId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Testdan import</DialogTitle>
          <DialogDescription>
            Testlaringizdan birini tanlang — variantli savollar jonli viktorinaga ko&apos;chiriladi.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-2xl bg-success-soft p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <p className="font-semibold">
                {result.imported} ta savol import qilindi
                {result.skipped.length > 0 && `, ${result.skipped.length} tasi o'tmadi`}
              </p>
            </div>
            {result.skipped.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-muted-foreground">O&apos;tmagan savollar</p>
                <ul className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
                  {result.skipped.map((item) => (
                    <li
                      key={item.index}
                      className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">
                        {item.index + 1}. {item.text.length > 70 ? `${item.text.slice(0, 70)}…` : item.text}
                      </span>
                      <span className="block text-muted-foreground">{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Har bir savolga 20 soniya taymer qo&apos;yildi. O&apos;yindan oldin savollarni
                muharrirda tekshirib chiqing: vaqt, ball va variantlar matnini moslang.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Yopish
              </Button>
              <Button
                render={<Link href={`/super-teacher/live-quiz/${result.quiz._id}/edit?imported=1`} />}
              >
                Muharrirga o&apos;tish
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Test nomi bo'yicha qidirish..."
                aria-label="Testlarni qidirish"
                className="h-11 pl-10"
              />
            </div>

            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto" role="radiogroup">
              {quizzes.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <ClipboardList className="size-6" />
                  {search ? 'Hech narsa topilmadi' : "Sizda hali test yo'q"}
                </div>
              ) : (
                filtered.map((quiz) => {
                  const active = quiz._id === selectedId;
                  return (
                    <button
                      key={quiz._id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setSelectedId(quiz._id);
                        setError(null);
                      }}
                      className={cn(
                        'flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary-soft'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'size-4 shrink-0 rounded-full border-2',
                          active ? 'border-primary bg-primary' : 'border-input'
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{quiz.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {quiz.questionsCount ?? quiz.questions?.length ?? 0} ta savol
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {selected && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="import-title">Nomi (ixtiyoriy)</Label>
                <Input
                  id="import-title"
                  value={title}
                  maxLength={LIVE_LIMITS.titleMax}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selected.title}
                  className="h-11"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button disabled={!selectedId || importQuiz.isPending} onClick={submit}>
                {importQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
                Import qilish
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
