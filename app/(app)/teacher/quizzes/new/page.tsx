'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, Loader2 } from 'lucide-react';
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
import { getMinQuestions } from '@/lib/quiz-rules';

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
    grade: z.string().min(1, { error: 'Sinfni tanlang' }),
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

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1));

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
      grade: '',
      availableFrom: '',
      availableUntil: '',
    },
  });

  const targetType = form.watch('targetType');
  const courseForLessons = targetType === 'lesson' ? form.watch('course') : undefined;
  const { data: courseLessons } = useCourseLessons(courseForLessons);
  const [limitAvailability, setLimitAvailability] = useState(false);
  const selectedGrade = form.watch('grade');

  function onSubmit(values: FormValues) {
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
        grade: Number(values.grade),
        availableFrom: limitAvailability ? tashkentLocalToIso(values.availableFrom!) : undefined,
        availableUntil: limitAvailability ? tashkentLocalToIso(values.availableUntil!) : undefined,
      },
      { onSuccess: (quiz) => router.push(`/teacher/quizzes/${quiz._id}`) }
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-none ">
        <CardHeader className="space-y-3  pt-2 text-center">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Yangi test yaratish
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground sm:text-lg">
            Test ma&apos;lumotlarini kiriting, savollarni keyingi bosqichda qo&apos;shasiz
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-2 sm:px-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                        className="h-12 text-[16px]!"
                      />
                    </FormControl>
                    <FormMessage className="text-[16px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[16px] font-medium text-foreground">
                      Tavsif (ixtiyoriy)
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-24 text-[16px]!" />
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
                        <SelectTrigger className="h-12 w-full text-[16px]!">
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
              {(targetType === 'course' || targetType === 'lesson') && (
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
                          <SelectTrigger className="h-12 w-full text-[16px]!">
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
              )}
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
                          <SelectTrigger className="h-12 w-full text-[16px]!">
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
                          className="h-12 text-[16px]!"
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
                        Urinishlar soni
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          value={field.value as number}
                          className="h-12 text-[16px]!"
                        />
                      </FormControl>
                      <FormMessage className="text-[16px]" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[16px] font-medium text-foreground">
                        Vaqt chegarasi (daqiqa) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="15"
                          {...field}
                          value={(field.value as number | undefined) ?? ''}
                          className="h-12 text-[16px]!"
                        />
                      </FormControl>
                      <FormMessage className="text-[16px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[16px] font-medium text-foreground">
                        Sinf *
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` }))}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 w-full text-[16px]!">
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_NUMBERS.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}-sinf
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedGrade && (
                        <p className="text-[16px] text-muted-foreground">
                          Bu sinf uchun kamida {getMinQuestions(Number(selectedGrade))} ta savol
                          kerak bo&apos;ladi
                        </p>
                      )}
                      <FormMessage className="text-[16px]" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-3 rounded-lg border border-input p-3 sm:p-4">
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
                                  className="h-12 pl-9 text-[16px]!"
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
                                  className="h-12 pl-9 text-[16px]!"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[16px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-[16px] text-muted-foreground">
                      Vaqtlar Toshkent vaqti (GMT+5) bo&apos;yicha kiritiladi
                    </p>
                  </div>
                )}
                {!limitAvailability && (
                  <p className="text-[16px] text-muted-foreground">
                    Belgilanmasa, test istalgan vaqtda boshlanishi mumkin
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-[16px]! font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
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
