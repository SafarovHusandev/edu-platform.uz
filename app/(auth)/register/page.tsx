"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, GraduationCap, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import { useRegister } from "@/hooks/use-auth"

const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1))
const GRADE_LETTERS = ["A", "B", "C", "D", "E", "F"]

const schema = z
  .object({
    name: z.string().min(2, { error: "Ism kamida 2 ta belgidan iborat bo'lsin" }),
    phone: z
      .string()
      .min(9, { error: "Telefon raqamni to'liq kiriting" })
      .regex(/^[0-9]{9,12}$/, { error: "Faqat raqamlardan iborat bo'lsin" }),
    password: z.string().min(6, { error: "Kamida 6 ta belgi" }),
    role: z.enum(["student", "teacher"]),
    gradeNumber: z.string().optional(),
    gradeLetter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student") {
      if (!data.gradeNumber) {
        ctx.addIssue({ code: "custom", path: ["gradeNumber"], message: "Sinfni tanlang" })
      }
      if (!data.gradeLetter) {
        ctx.addIssue({ code: "custom", path: ["gradeLetter"], message: "Sinfni tanlang" })
      }
    }
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const register = useRegister()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      role: "student",
      gradeNumber: "",
      gradeLetter: "",
    },
  })

  const role = form.watch("role")

  function onSubmit(values: FormValues) {
    register.mutate(
      {
        name: values.name,
        phone: values.phone,
        password: values.password,
        role: values.role,
        grade:
          values.role === "student"
            ? { number: Number(values.gradeNumber), letter: values.gradeLetter! }
            : undefined,
      },
      { onSuccess: () => router.push("/dashboard") }
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Ro&apos;yxatdan o&apos;tish</CardTitle>
        <CardDescription>Bepul hisob yarating va o&apos;rganishni boshlang</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kim sifatida qo&apos;shilasiz?</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: "student", label: "O'quvchi", icon: GraduationCap },
                          { value: "teacher", label: "O'qituvchi", icon: Presentation },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border border-input px-3 py-3 text-sm font-medium transition-colors",
                            field.value === option.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <option.icon className="size-4.5" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To&apos;liq ism</FormLabel>
                  <FormControl>
                    <Input placeholder="Ali Valiyev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon raqam</FormLabel>
                  <FormControl>
                    <Input placeholder="998901234567" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parol</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="gradeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinf</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Raqam" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_NUMBERS.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guruh</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Harf" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_LETTERS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending && <Loader2 className="size-4 animate-spin" />}
              Ro&apos;yxatdan o&apos;tish
            </Button>
          </form>
        </Form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Kiring
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
