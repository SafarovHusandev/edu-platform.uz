'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, CircleHelp, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { ImportSpinQuestionsDialog } from '@/components/admin/import-spin-questions-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterPills } from '@/components/ui/filter-pills';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { StatusPill } from '@/components/dashboard/dashboard-ui';
import {
  useCreateSpinQuestion,
  useDeleteSpinQuestion,
  useSpinQuestions,
  useUpdateSpinQuestion,
  type SpinQuestion,
  type SpinQuestionCategory,
} from '@/hooks/use-spin-questions';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const ALL_GRADES = 'all';
const GRADES = Array.from({ length: 11 }, (_, i) => String(i + 1));
const GRADE_ITEMS = GRADES.map((grade) => ({ value: grade, label: `${grade}-sinf` }));

const CATEGORY_OPTIONS: { value: SpinQuestionCategory; label: string }[] = [
  { value: 'knowledge', label: 'Bilim savoli' },
  { value: 'logic', label: 'Mantiqiy savol' },
];

const questionSchema = z
  .object({
    category: z.enum(['knowledge', 'logic']),
    grade: z.string(),
    question: z.string().trim().min(3, { error: 'Kamida 3 ta belgi' }),
    options: z
      .array(z.string().trim().min(1, { error: 'Variantni kiriting' }))
      .length(OPTION_LETTERS.length),
    correctIndex: z.number().min(0).max(3),
  })
  .superRefine((values, ctx) => {
    // Mantiqiy savol barcha sinflarga umumiy, sinf faqat bilim savolida majburiy
    if (values.category === 'knowledge' && !values.grade) {
      ctx.addIssue({ code: 'custom', path: ['grade'], message: 'Sinfni tanlang' });
    }
  });

type QuestionFormValues = z.infer<typeof questionSchema>;

const EMPTY_FORM: QuestionFormValues = {
  category: 'knowledge',
  grade: '',
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
};

export default function AdminSpinQuestionsPage() {
  const [category, setCategory] = useState<SpinQuestionCategory | 'all'>('all');
  const [grade, setGrade] = useState(ALL_GRADES);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useSpinQuestions({
    category: category === 'all' ? undefined : category,
    // Mantiqiy savollarda sinf yo'q — sinf filtri ularga qo'llanmaydi
    grade: category === 'logic' || grade === ALL_GRADES ? undefined : Number(grade),
    page,
    limit: PAGE_SIZE,
  });
  const createQuestion = useCreateSpinQuestion();
  const updateQuestion = useUpdateSpinQuestion();
  const deleteQuestion = useDeleteSpinQuestion();

  const [importOpen, setImportOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpinQuestion | null>(null);
  const saving = createQuestion.isPending || updateQuestion.isPending;

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: EMPTY_FORM,
  });

  const formCategory = form.watch('category');

  function openCreate() {
    setEditing(null);
    // Filtrda tanlangan sinf uchun qo'shish qulay bo'lsin
    form.reset({
      ...EMPTY_FORM,
      category: category === 'logic' ? 'logic' : 'knowledge',
      grade: grade === ALL_GRADES ? '' : grade,
    });
    setDialogOpen(true);
  }

  function openEdit(item: SpinQuestion) {
    setEditing(item);
    form.reset({
      category: item.category ?? 'knowledge',
      grade: item.grade == null ? '' : String(item.grade),
      question: item.question,
      options: OPTION_LETTERS.map((_, i) => item.options[i] ?? ''),
      correctIndex: item.correctIndex,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: QuestionFormValues) {
    const payload = {
      ...values,
      grade: values.category === 'logic' ? null : Number(values.grade),
    };
    const close = { onSuccess: () => setDialogOpen(false) };
    if (editing) updateQuestion.mutate({ id: editing._id, ...payload }, close);
    else createQuestion.mutate(payload, close);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Baraban savollari"
        description="Kunlik barabandan keyin o'quvchiga sinfiga mos savol beriladi"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="lg" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> Fayldan yuklash
            </Button>
            <Button size="lg" onClick={openCreate}>
              <Plus className="size-4" /> Savol qo&apos;shish
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterPills
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Barchasi' },
            { value: 'knowledge', label: 'Bilim savollari' },
            { value: 'logic', label: 'Mantiqiy savollar' },
          ]}
        />
        {category !== 'logic' && (
          <div className="w-48">
            <Select
              value={grade}
              onValueChange={(value) => {
                setGrade(value ?? ALL_GRADES);
                setPage(1);
              }}
              items={[{ value: ALL_GRADES, label: 'Barcha sinflar' }, ...GRADE_ITEMS]}
            >
              <SelectTrigger aria-label="Sinf bo'yicha filtr" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GRADES}>Barcha sinflar</SelectItem>
                {GRADE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={CircleHelp}
          title={
            category === 'logic'
              ? "Hali mantiqiy savol yo'q"
              : grade === ALL_GRADES
                ? "Hali savol qo'shilmagan"
                : `${grade}-sinf uchun savol yo'q`
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-[13px] text-muted-foreground">
                  <th className="px-5 py-3.5 font-semibold">Savol</th>
                  <th className="px-3 py-3.5 font-semibold">Toifa</th>
                  <th className="px-3 py-3.5 font-semibold">To&apos;g&apos;ri javob</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id} className="border-t border-muted">
                    <td className="max-w-md px-5 py-3 font-semibold wrap-break-word">
                      {item.question}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.category === 'logic' ? (
                        <StatusPill tone="warning">Mantiqiy · barcha sinflar</StatusPill>
                      ) : (
                        <StatusPill tone="primary">{item.grade}-sinf</StatusPill>
                      )}
                    </td>
                    <td className="px-3 py-3 wrap-break-word text-secondary-foreground">
                      {OPTION_LETTERS[item.correctIndex]}) {item.options[item.correctIndex]}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" /> Tahrir
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="O'chirish" />
                            }
                          >
                            <Trash2 className="size-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Savolni o&apos;chirasizmi?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &quot;{item.question}&quot; savollar bankidan o&apos;chiriladi. Bu
                                amalni bekor qilib bo&apos;lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => deleteQuestion.mutate(item._id)}
                              >
                                O&apos;chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <PaginationBar
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              itemLabel="savol"
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* Har ochilganda joriy filtrdagi toifa va sinf tanlangan bo'ladi */}
      {importOpen && (
        <ImportSpinQuestionsDialog
          open
          onOpenChange={setImportOpen}
          categoryOptions={CATEGORY_OPTIONS}
          gradeItems={GRADE_ITEMS}
          initialCategory={category === 'logic' ? 'logic' : 'knowledge'}
          initialGrade={grade === ALL_GRADES ? '' : grade}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Savolni tahrirlash' : 'Yangi savol'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toifa</FormLabel>
                    <FilterPills
                      value={field.value}
                      onChange={field.onChange}
                      options={CATEGORY_OPTIONS}
                    />
                    {field.value === 'logic' && (
                      <p className="text-sm text-muted-foreground">
                        Mantiqiy savol sinfdan qat&apos;i nazar barcha o&apos;quvchilarga tushadi.
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {formCategory === 'knowledge' && (
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinf</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value ?? '')}
                        items={GRADE_ITEMS}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Sinfni tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_ITEMS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savol</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Variantlar{' '}
                  <span className="font-normal text-muted-foreground">
                    (to&apos;g&apos;ri javob harfini bosing)
                  </span>
                </p>
                <FormField
                  control={form.control}
                  name="correctIndex"
                  render={({ field: correct }) => (
                    <>
                      {OPTION_LETTERS.map((letter, index) => (
                        <FormField
                          key={letter}
                          control={form.control}
                          name={`options.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`${letter} — to'g'ri javob`}
                                  aria-pressed={correct.value === index}
                                  onClick={() => correct.onChange(index)}
                                  className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors',
                                    correct.value === index
                                      ? 'bg-success text-white'
                                      : 'bg-muted text-secondary-foreground hover:bg-primary-soft'
                                  )}
                                >
                                  {correct.value === index ? <Check className="size-4" /> : letter}
                                </button>
                                <FormControl>
                                  <Input className="h-11" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" size="lg" disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
