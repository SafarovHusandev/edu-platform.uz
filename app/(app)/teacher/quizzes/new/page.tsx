"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useCreateQuiz } from "@/hooks/use-quizzes"
import { useCourses } from "@/hooks/use-courses"
import { useAuthStore } from "@/store/auth-store"

const schema = z.object({
  title: z.string().min(3, { error: "Kamida 3 ta belgi" }),
  description: z.string().optional(),
  targetType: z.enum(["standalone", "course", "lesson"]),
  course: z.string().optional(),
  passingScore: z.coerce.number().min(0).max(100),
  maxAttempts: z.coerce.number().min(1),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export default function NewQuizPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const createQuiz = useCreateQuiz()
  const { data: courses } = useCourses({ page: 1, limit: 100 })

  const myCourses = courses?.items.filter((course) => {
    const teacherId = typeof course.teacher === "object" ? course.teacher?._id : course.teacher
    return teacherId === user?._id
  })

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      targetType: "standalone",
      course: "",
      passingScore: 60,
      maxAttempts: 3,
    },
  })

  const targetType = form.watch("targetType")

  function onSubmit(values: FormValues) {
    const { course, ...rest } = values
    createQuiz.mutate(
      {
        ...rest,
        targetId: values.targetType === "course" ? course : undefined,
      },
      { onSuccess: (quiz) => router.push(`/teacher/quizzes/${quiz._id}`) }
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Yangi test yaratish</CardTitle>
          <CardDescription>Test ma&apos;lumotlarini kiriting, savollarni keyingi bosqichda qo&apos;shasiz</CardDescription>
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
                      onValueChange={field.onChange}
                      items={[
                        { value: "standalone", label: "Mustaqil test" },
                        { value: "course", label: "Kursga bog'liq" },
                      ]}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standalone">Mustaqil test</SelectItem>
                        <SelectItem value="course">Kursga bog&apos;liq</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {targetType === "course" && (
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurs</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={myCourses?.map((course) => ({ value: course._id, label: course.title })) ?? []}
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O&apos;tish balli (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} value={field.value as number} />
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
              <Button type="submit" className="w-full" disabled={createQuiz.isPending}>
                {createQuiz.isPending && <Loader2 className="size-4 animate-spin" />}
                Testni yaratish
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
