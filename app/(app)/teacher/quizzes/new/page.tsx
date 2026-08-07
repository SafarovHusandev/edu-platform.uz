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
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Yangi test yaratish</CardTitle>
          <CardDescription>
            Test ma&apos;lumotlarini kiriting, savollarni keyingi bosqichda qo&apos;shasiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test nomi</FormLabel>
                    <FormControl>
                      <Input placeholder="Matematika testi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test turi</FormLabel>
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
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standalone">Mustaqil</SelectItem>
                        <SelectItem value="course">Kurs</SelectItem>
                        <SelectItem value="lesson">Dars</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(targetType === 'course' || targetType === 'lesson') && (
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurs</FormLabel>
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
                          <SelectTrigger className="w-full">
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
              )}
              {targetType === 'lesson' && courseForLessons && (
                <FormField
                  control={form.control}
                  name="lesson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dars</FormLabel>
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
                          <SelectTrigger className="w-full">
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O&apos;tish balli (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          value={field.value as number}
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
                    <FormItem>
                      <FormLabel>Urinishlar soni</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaqt chegarasi (daqiqa) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="15"
                          {...field}
                          value={(field.value as number | undefined) ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinf *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={GRADE_NUMBERS.map((n) => ({ value: n, label: `${n}-sinf` }))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                        <p className="text-xs text-muted-foreground">
                          Bu sinf uchun kamida {getMinQuestions(Number(selectedGrade))} ta savol
                          kerak bo&apos;ladi
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-3 rounded-lg border border-input p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="limit-availability"
                    checked={limitAvailability}
                    onCheckedChange={(checked) => setLimitAvailability(checked === true)}
                  />
                  <Label htmlFor="limit-availability" className="cursor-pointer font-normal">
                    Testni boshlash uchun vaqt oynasi belgilash
                  </Label>
                </div>
                {limitAvailability && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="availableFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boshlanish vaqti</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="datetime-local" className="pl-9" {...field} />
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
                          <FormItem>
                            <FormLabel>Tugash vaqti</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="datetime-local" className="pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vaqtlar Toshkent vaqti (GMT+5) bo&apos;yicha kiritiladi
                    </p>
                  </div>
                )}
                {!limitAvailability && (
                  <p className="text-xs text-muted-foreground">
                    Belgilanmasa, test istalgan vaqtda boshlanishi mumkin
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={createQuiz.isPending}>
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
