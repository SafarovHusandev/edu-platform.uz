'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  FileDown,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { DebouncedSearch } from '@/components/ui/debounced-search';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import { coverTone } from '@/components/dashboard/dashboard-ui';
import { OptionShape } from '@/components/live-quiz/option-styles';
import { ImportFromQuizDialog } from '@/components/live-quiz/import-from-quiz-dialog';
import {
  useDeleteLiveQuiz,
  useLiveQuizzes,
  useStartLiveSession,
} from '@/hooks/use-live-quizzes';
import { useAuthStore } from '@/store/auth-store';
import { toServerUrl } from '@/lib/live-quiz';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { LiveQuizSummary } from '@/types/live-quiz';

const PAGE_SIZE = 12;

function CoverPlaceholder({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center gap-3 opacity-95',
        coverTone(index)
      )}
    >
      {[0, 1, 2, 3].map((i) => (
        <OptionShape key={i} index={i} className="size-7 opacity-80" />
      ))}
    </div>
  );
}

function LiveQuizCard({
  quiz,
  index,
  onStart,
  starting,
  onDelete,
}: {
  quiz: LiveQuizSummary;
  index: number;
  onStart: (quiz: LiveQuizSummary) => void;
  starting: boolean;
  onDelete: (quiz: LiveQuizSummary) => void;
}) {
  const cover = toServerUrl(quiz.coverImage);
  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="aspect-[16/7] overflow-hidden bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <CoverPlaceholder index={index} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/super-teacher/live-quiz/${quiz._id}/edit`}
            className="line-clamp-2 font-heading text-[17px] font-semibold wrap-break-word hover:text-primary"
          >
            {quiz.title}
          </Link>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {quiz.questionCount} ta savol · {formatDate(quiz.updatedAt)}
          </p>
        </div>
        <Button
          size="lg"
          className="h-12 w-full text-base"
          disabled={starting}
          onClick={() => onStart(quiz)}
        >
          {starting ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
          Boshlash
        </Button>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            render={<Link href={`/super-teacher/live-quiz/${quiz._id}/edit`} />}
          >
            <Pencil /> Tahrirlash
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            render={<Link href={`/super-teacher/live-quiz/${quiz._id}/results`} />}
          >
            <BarChart3 /> Natijalar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Viktorinani o&apos;chirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{quiz.title}&quot; o&apos;chiriladi. Bu amalni bekor qilib bo&apos;lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => onDelete(quiz)}>
                  O&apos;chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function LiveQuizListPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'admin' || role === 'superadmin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useLiveQuizzes({
    search,
    page,
    limit: PAGE_SIZE,
    all: isAdmin && showAll,
  });
  const deleteQuiz = useDeleteLiveQuiz();
  const startSession = useStartLiveSession();

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  function start(quiz: LiveQuizSummary) {
    startSession.mutate(quiz._id, {
      onSuccess: (session) => router.push(`/super-teacher/board/live/${session.pin}`),
    });
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && !isError && items.length === 0 && !search;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageHeader
        title="Jonli viktorina"
        description="O'quvchilar telefondan PIN bilan qo'shiladi — akkaunt shart emas"
        breadcrumbs={[{ label: 'Super-ustoz', href: '/super-teacher' }, { label: 'Jonli viktorina' }]}
        className="mb-0"
        actions={
          <>
            <Button size="lg" variant="outline" onClick={() => setImportOpen(true)}>
              <FileDown className="size-4" /> Testdan import
            </Button>
            <Button size="lg" render={<Link href="/super-teacher/live-quiz/new" />}>
              <Plus className="size-4" /> Yangi viktorina
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Trophy}
          title="Hali viktorina yo'q"
          description="Yangisini yarating yoki mavjud testingizdan import qiling"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileDown className="size-4" /> Testdan import
              </Button>
              <Button render={<Link href="/super-teacher/live-quiz/new" />}>
                <Plus className="size-4" /> Yaratish
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DebouncedSearch
              initial={search}
              onSearch={onSearch}
              delay={400}
              placeholder="Viktorina nomi bo'yicha qidirish..."
              label="Viktorinalarni qidirish"
              className="flex-1"
            />
            {isAdmin && (
              <div className="flex items-center gap-2.5">
                <Switch
                  id="live-all"
                  checked={showAll}
                  onCheckedChange={(v) => {
                    setShowAll(v);
                    setPage(1);
                  }}
                />
                <Label htmlFor="live-all">Barcha o&apos;qituvchilarniki</Label>
              </div>
            )}
          </div>

          {isLoading ? (
            <SkeletonCardGrid />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Hech narsa topilmadi"
              description="Boshqa kalit so'z bilan qayta urinib ko'ring"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((quiz, i) => (
                <LiveQuizCard
                  key={quiz._id}
                  quiz={quiz}
                  index={i}
                  onStart={start}
                  starting={startSession.isPending && startSession.variables === quiz._id}
                  onDelete={(q) => deleteQuiz.mutate(q._id)}
                />
              ))}
            </div>
          )}

          {data && (
            <PaginationBar
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="viktorina"
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ImportFromQuizDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
