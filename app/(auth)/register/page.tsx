"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, GraduationCap, Presentation, Sparkles, UserCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
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
      .length(9, { error: "Telefon raqamni to'liq kiriting" })
      .regex(/^[0-9]{9}$/, { error: "Faqat raqamlardan iborat bo'lsin" }),
    password: z.string().min(6, { error: "Kamida 6 ta belgi" }),
    role: z.enum(["student", "teacher"]),
    gradeNumber: z.string().optional(),
    gradeLetter: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student") {
      if (!data.gradeNumber) {
        ctx.addIssue({ code: "custom", path: ["gradeNumber"], message: "Sinf raqamini tanlang" })
      }
      if (!data.gradeLetter) {
        ctx.addIssue({ code: "custom", path: ["gradeLetter"], message: "Guruh harfini tanlang" })
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
        phone: `998${values.phone}`,
        password: values.password,
        role: values.role,
        grade:
          values.role === "student"
            ? { number: Number(values.gradeNumber), letter: values.gradeLetter! }
            : undefined,
      },
      { onSuccess: () => router.push("/register/pending") }
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="glass-card relative rounded-3xl p-6 sm:p-8 shadow-2xl border border-border/80 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Ro&apos;yxatdan o&apos;tish
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Bepul hisob yarating va o&apos;rganish yoki o&apos;qitishni boshlang
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary">
            <Sparkles className="size-6" />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Picker */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kim sifatida qo&apos;shilasiz?
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("student")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-all duration-200 cursor-pointer",
                          field.value === "student"
                            ? "border-primary bg-primary/10 dark:bg-primary/20 text-primary shadow-md shadow-primary/10 ring-2 ring-primary/30"
                            : "border-border/80 bg-card/60 dark:bg-card/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-xl transition-colors",
                          field.value === "student" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <GraduationCap className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">O&apos;quvchi</p>
                          <p className="text-[11px] text-muted-foreground">Darslar & Testlar</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange("teacher")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-all duration-200 cursor-pointer",
                          field.value === "teacher"
                            ? "border-primary bg-primary/10 dark:bg-primary/20 text-primary shadow-md shadow-primary/10 ring-2 ring-primary/30"
                            : "border-border/80 bg-card/60 dark:bg-card/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-xl transition-colors",
                          field.value === "teacher" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Presentation className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">O&apos;qituvchi</p>
                          <p className="text-[11px] text-muted-foreground">Kurslar & Dars berish</p>
                        </div>
                      </button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    To&apos;liq ism familiyangiz
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masalan: Ali Valiyev"
                      {...field}
                      className="h-12 rounded-xl border-border/80 bg-background/70 text-base focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Telefon raqam
                  </FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      className="h-12 rounded-xl border-border/80 bg-background/70 text-base focus-within:ring-2 focus-within:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Parol
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="h-12 rounded-xl border-border/80 bg-background/70 text-base focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {role === "student" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <FormField
                  control={form.control}
                  name="gradeNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sinf raqami
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-border/80 bg-background/70 w-full text-base">
                            <SelectValue placeholder="Sinfni tanlang" />
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
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLetter"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Guruh harfi
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-border/80 bg-background/70 w-full text-base">
                            <SelectValue placeholder="Harf" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_LETTERS.map((l) => (
                            <SelectItem key={l} value={l}>
                              &quot;{l}&quot; guruhi
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-linear-to-r from-primary to-indigo-600 text-base font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 transition-all duration-200 mt-2 cursor-pointer"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <UserCheck className="size-4 mr-1.5" />
                  Ro&apos;yxatdan o&apos;tish
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 pt-4 border-t border-border/60 text-center">
          <p className="text-sm text-muted-foreground">
            Hisobingiz bormi?{" "}
            <Link
              href="/login"
              className="font-bold text-primary transition-colors hover:underline"
            >
              Tizimga kiring
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

