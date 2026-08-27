'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, ClipboardList, Layers, ListChecks, Loader2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <div className="mx-auto max-w-8xl">
      <Card className="overflow-hidden rounded-2xl shadow-md ring-1 ring-border/60 p-0!">
        <CardHeader className="items-center space-y-1 pt-8 text-center">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-5">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="size-7" />
            </span>
            Yangi test yaratish
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground sm:text-lg">
            Test ma&apos;lumotlarini kiriting, savollarni keyingi bosqichda qo&apos;shasiz
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-6 sm:px-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <ListChecks className="size-4" /> Asosiy ma&apos;lumotlar
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[16px] font-medium text-foreground">
                              Test nomi
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Matematika testi"
                                {...field}
                                className="h-11 rounded-md text-[16px]!"
                              />
                            </FormControl>
                            <FormMessage className="text-[16px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="targetType"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[16px] font-medium text-foreground">
                              Test turi
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                form.setValue('course', '');
                                form.setValue('lesson', '');
                              }}
                              items={[
                                { value: 'standalone', label: 'Mustaqil' },
                                { value: 'course', label: 'Kurs' },
                                { value: 'lesson', label: 'Dars' },
                              ]}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 w-full rounded-md text-[16px]!">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="standalone">Mustaqil</SelectItem>
                                <SelectItem value="course">Kurs</SelectItem>
                                <SelectItem value="lesson">Dars</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[16px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[16px] font-medium text-foreground">
                            Tavsif (ixtiyoriy)
                          </FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-20 rounded-md text-[16px]!" />
                          </FormControl>
                          <FormMessage className="text-[16px]" />
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
                              <FormLabel className="text-[16px] font-medium text-foreground">
                                Kurs
                              </FormLabel>
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
                                  <SelectTrigger className="h-11 w-full rounded-md text-[16px]!">
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
                              <FormMessage className="text-[16px]" />
                            </FormItem>
                          )}
                        />
                        {targetType === 'lesson' && courseForLessons && (
                          <FormField
                            control={form.control}
                            name="lesson"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[16px] font-medium text-foreground">
                                  Dars
                                </FormLabel>
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
                                    <SelectTrigger className="h-11 w-full rounded-md text-[16px]!">
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
                                <FormMessage className="text-[16px]" />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Target className="size-4" /> Baholash sozlamalari (umumiy)
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="passingScore"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[16px] font-medium text-foreground">
                              O&apos;tish balli (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                value={field.value as number}
                                className="h-11 rounded-md text-[16px]!"
                              />
                            </FormControl>
                            <FormMessage className="text-[16px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxAttempts"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[16px] font-medium text-foreground">
                              Umumiy urinishlar
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                value={field.value as number}
                                className="h-11 rounded-md text-[16px]!"
                              />
                            </FormControl>
                            <FormMessage className="text-[16px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[16px] font-medium text-foreground">
                            Umumiy vaqt chegarasi (daqiqa) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="15"
                              {...field}
                              value={(field.value as number | undefined) ?? ''}
                              className="h-11 rounded-md text-[16px]!"
                            />
                          </FormControl>
                          <FormMessage className="text-[16px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Layers className="size-4" /> Sinflar *
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Test qaysi sinf(lar)ga tayinlanishini tanlang. Har bir sinf uchun
                      &quot;Kengaytirilgan sozlamalar&quot;da alohida vaqt/urinish belgilash mumkin
                      — bo&apos;sh qoldirilsa, yuqoridagi umumiy qiymatlar ishlatiladi.
                    </p>
                    <div className="rounded-lg border border-input bg-background p-3 sm:p-4">
                      <TargetGradesEditor value={targetGrades} onChange={setTargetGrades} />
                    </div>
                    {targetGradesError && (
                      <p className="text-[16px] font-medium text-destructive">
                        {targetGradesError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
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
                                <FormLabel className="text-[16px] font-medium text-foreground">
                                  Boshlanish vaqti
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="datetime-local"
                                      className="h-11 rounded-md pl-9 text-[16px]!"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[16px]" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="availableUntil"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[16px] font-medium text-foreground">
                                  Tugash vaqti
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="datetime-local"
                                      className="h-11 rounded-md pl-9 text-[16px]!"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[16px]" />
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
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-md text-[16px]! font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                disabled={createQuiz.isPending}
              >
                {createQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
                Testni yaratish
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
