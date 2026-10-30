'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateQuiz } from '@/hooks/use-quizzes';
import { useCourses } from '@/hooks/use-courses';
import { useCourseLessons } from '@/hooks/use-lessons';
import { useAuthStore } from '@/store/auth-store';
import { tashkentLocalToIso } from '@/lib/format';
import {
  ALL_LETTERS_VALUE,
  TargetGradesEditor,
  type TargetGradeEntry,
} from '@/components/quizzes/target-grades-editor';

const schema = z
  .object({
    title: z.string().min(3, { error: 'Kamida 3 ta belgi' }),
    description: z.string().optional(),
    targetType: z.enum(['standalone', 'course', 'lesson']),
    course: z.string().optional(),
    lesson: z.string().optional(),
    passingScore: z.coerce.number().min(0).max(100),
    maxAttempts: z.coerce.number().min(1),
    timeLimit: z.coerce.number().min(1, { error: 'Vaqt chegarasini kiriting (kamida 1 daqiqa)' }),
    availableFrom: z.string().optional(),
    availableUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetType === 'course' && !data.course) {
      ctx.addIssue({ code: 'custom', path: ['course'], message: 'Kursni tanlang' });
    }
    if (data.targetType === 'lesson' && !data.lesson) {
      ctx.addIssue({ code: 'custom', path: ['lesson'], message: 'Darsni tanlang' });
    }
  });

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export default function NewQuizPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.tarif === 'premium';
  const createQuiz = useCreateQuiz();
  const { data: courses } = useCourses({ page: 1, limit: 100 });

  const myCourses = courses?.items.filter((course) => {
    const teacherId = typeof course.teacher === 'object' ? course.teacher?._id : course.teacher;
    return teacherId === user?._id;
  });

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      targetType: 'standalone',
      course: '',
      lesson: '',
      passingScore: 60,
      maxAttempts: 3,
      timeLimit: undefined,
      availableFrom: '',
      availableUntil: '',
    },
  });

  const targetType = form.watch('targetType');
  const courseForLessons = targetType === 'lesson' ? form.watch('course') : undefined;
  const { data: courseLessons } = useCourseLessons(courseForLessons);
  const [limitAvailability, setLimitAvailability] = useState(false);
  const [targetGrades, setTargetGrades] = useState<TargetGradeEntry[]>([]);
  const [targetGradesError, setTargetGradesError] = useState<string | null>(null);

  function onSubmit(values: FormValues) {
    if (targetGrades.length === 0) {
      setTargetGradesError("Kamida bitta sinf qo'shing");
      return;
    }
    setTargetGradesError(null);

    const targetId =
      values.targetType === 'course'
        ? values.course
        : values.targetType === 'lesson'
          ? values.lesson
          : undefined;

    if (limitAvailability) {
      if (!values.availableFrom || !values.availableUntil) {
        if (!values.availableFrom)
          form.setError('availableFrom', { message: 'Boshlanish vaqtini kiriting' });
        if (!values.availableUntil)
          form.setError('availableUntil', { message: 'Tugash vaqtini kiriting' });
        return;
      }
      if (values.availableUntil <= values.availableFrom) {
        form.setError('availableUntil', {
          message: "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak",
        });
        return;
      }
    }

    createQuiz.mutate(
      {
        title: values.title,
        description: values.description,
        targetType: values.targetType,
        targetId,
        passingScore: values.passingScore,
        maxAttempts: values.maxAttempts,
        timeLimit: values.timeLimit,
        targetGrades: targetGrades.map((entry) => ({
          number: Number(entry.number),
          letter: entry.letter === ALL_LETTERS_VALUE ? undefined : entry.letter,
          availableFrom: entry.availableFrom ? tashkentLocalToIso(entry.availableFrom) : undefined,
          availableUntil: entry.availableUntil
            ? tashkentLocalToIso(entry.availableUntil)
            : undefined,
          maxAttempts: entry.maxAttempts ? Number(entry.maxAttempts) : undefined,
          timeLimit: entry.timeLimit ? Number(entry.timeLimit) : undefined,
        })),
        availableFrom: limitAvailability ? tashkentLocalToIso(values.availableFrom!) : undefined,
        availableUntil: limitAvailability ? tashkentLocalToIso(values.availableUntil!) : undefined,
      },
      { onSuccess: (quiz) => router.push(`/teacher/quizzes/${quiz._id}`) }
    );
  }
  // yangi
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <nav aria-label="Yo'l" className="text-sm text-muted-foreground">
                <Link href="/teacher/quizzes" className="hover:text-foreground">
                  Testlarim
                </Link>{' '}
                / Yangi test
              </nav>
              <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-[26px]">
                Yangi test
              </h1>
            </div>
            <Button type="submit" size="lg" disabled={createQuiz.isPending}>
              {createQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
              Saqlash va savollarga o&apos;tish
            </Button>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              <section className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-bold">1. Asosiy sozlamalar</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-semibold">Test nomi</FormLabel>
                        <FormControl>
                          <Input placeholder="Matematika testi" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-semibold">Biriktirish</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { value: 'course', label: 'Kursga' },
                              { value: 'lesson', label: 'Darsga' },
                              { value: 'standalone', label: 'Mustaqil' },
                            ] as const
                          ).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={field.value === option.value}
                              onClick={() => {
                                field.onChange(option.value);
                                form.setValue('course', '');
                                form.setValue('lesson', '');
                              }}
                              className={
                                field.value === option.value
                                  ? 'rounded-xl border-[1.5px] border-primary bg-primary-soft px-4 py-2.5 font-bold text-primary'
                                  : 'rounded-xl border border-input bg-card px-4 py-2.5 font-semibold hover:bg-muted'
                              }
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="font-semibold">Tavsif (ixtiyoriy)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(targetType === 'course' || targetType === 'lesson') && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="course"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-semibold">Kurs</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              form.setValue('lesson', '');
                            }}
                            items={
                              myCourses?.map((course) => ({
                                value: course._id,
                                label: course.title,
                              })) ?? []
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 w-full">
                                <SelectValue placeholder="Kursni tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {myCourses?.map((course) => (
                                <SelectItem key={course._id} value={course._id}>
                                  {course.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {targetType === 'lesson' && courseForLessons && (
                      <FormField
                        control={form.control}
                        name="lesson"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-semibold">Dars</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              items={
                                courseLessons?.map((lesson) => ({
                                  value: lesson._id,
                                  label: lesson.title,
                                })) ?? []
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 w-full">
                                  <SelectValue placeholder="Darsni tanlang" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courseLessons?.map((lesson) => (
                                  <SelectItem key={lesson._id} value={lesson._id}>
                                    {lesson.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-bold">Baholash (umumiy)</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-semibold">O&apos;tish balli (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            {...field}
                            value={field.value as number}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxAttempts"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-semibold">Umumiy urinishlar</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            value={field.value as number}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                        {!isPremium && Number(field.value) > 1 && (
                          <p className="flex items-start gap-1.5 text-xs text-gold-foreground">
                            <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                            Ajoyib! Endi bu sonni ishga tushirish uchun Premium kerak bo&apos;ladi —{' '}
                            <Link
                              href="/premium"
                              className="font-medium underline underline-offset-2"
                            >
                              batafsil
                            </Link>
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="font-semibold">
                        Umumiy vaqt chegarasi (daqiqa) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="15"
                          {...field}
                          value={(field.value as number | undefined) ?? ''}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            </div>

            <div className="flex flex-col gap-5">
              <section className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-bold">2. Sinflar</h2>
                <p className="text-sm text-muted-foreground">
                  Test qaysi sinf(lar)ga tayinlanishini tanlang. Har bir sinf uchun
                  &quot;Kengaytirilgan sozlamalar&quot;da alohida vaqt/urinish belgilash mumkin —
                  bo&apos;sh qoldirilsa, yuqoridagi umumiy qiymatlar ishlatiladi.
                </p>
                <div>
                  <TargetGradesEditor
                    value={targetGrades}
                    onChange={setTargetGrades}
                    isPremium={isPremium}
                  />
                </div>
                {targetGradesError && (
                  <p className="text-[16px] font-medium text-destructive">{targetGradesError}</p>
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-bold">3. Vaqt</h2>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="limit-availability"
                    checked={limitAvailability}
                    onCheckedChange={(checked) => setLimitAvailability(checked === true)}
                  />
                  <Label
                    htmlFor="limit-availability"
                    className="cursor-pointer text-[16px] font-normal"
                  >
                    Testni boshlash uchun vaqt belgilash
                  </Label>
                </div>
                {limitAvailability && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="availableFrom"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-semibold">Boshlanish vaqti</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="datetime-local" className="h-11 pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="availableUntil"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-semibold">Tugash vaqti</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="datetime-local" className="h-11 pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vaqtlar Toshkent vaqti (GMT+5) bo&apos;yicha kiritiladi
                    </p>
                  </div>
                )}
                {!limitAvailability && (
                  <p className="text-sm text-muted-foreground">
                    Belgilanmasa, test istalgan vaqtda boshlanishi mumkin
                  </p>
                )}
              </section>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Savollarni test yaratilgandan keyin qo&apos;shasiz — qo&apos;lda yoki Word fayldan.
          </p>
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base sm:w-auto sm:self-end"
            disabled={createQuiz.isPending}
          >
            {createQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
            Saqlash va savollarga o&apos;tish
          </Button>
        </form>
      </Form>
    </div>
  );
}
