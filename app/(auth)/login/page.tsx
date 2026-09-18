'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLogin, useTelegramLogin } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api-client';

const schema = z.object({
  phone: z
    .string()
    .length(9, { error: "Telefon raqamni to'liq kiriting" })
    .regex(/^[0-9]{9}$/, { error: "Faqat raqamlardan iborat bo'lsin" }),
  password: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
});

type FormValues = z.infer<typeof schema>;

const telegramSchema = z.object({
  code: z.string().min(4, { error: "Kodni to'liq kiriting" }),
});

type TelegramFormValues = z.infer<typeof telegramSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const telegramLogin = useTelegramLogin();

  const tgCode = searchParams.get('tg_code');
  const autoLoginAttempted = useRef(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', password: '' },
  });

  const telegramForm = useForm<TelegramFormValues>({
    resolver: zodResolver(telegramSchema),
    defaultValues: { code: '' },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!tgCode || autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;
    telegramLogin.mutate(
      { code: tgCode },
      {
        onSuccess: () => router.push(searchParams.get('redirect') || '/dashboard'),
        onError: () => setAutoLoginFailed(true),
      }
    );
  }, [tgCode, router, searchParams, telegramLogin]);

  if (tgCode && !autoLoginFailed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md border-primary/20 shadow-2xl">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <div className="relative flex size-20 items-center justify-center rounded-3xl bg-linear-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/30">
              <Loader2 className="size-10 animate-spin" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">Telegram orqali kirilmoqda...</p>
              <p className="mt-1 text-sm text-muted-foreground">Iltimos, bir necha soniya kuting</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    setLoginError(null);
    login.mutate(
      { ...values, phone: `998${values.phone}` },
      {
        onSuccess: () => {
          router.push(searchParams.get('redirect') || '/dashboard');
        },
        onError: (error) => {
          setLoginError(error instanceof ApiError ? error.message : 'Kirishda xatolik yuz berdi');
        },
      }
    );
  }

  function onTelegramSubmit(values: TelegramFormValues) {
    telegramLogin.mutate(values, {
      onSuccess: () => {
        router.push(searchParams.get('redirect') || '/dashboard');
      },
    });
  }

  return (
    <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-8 items-start">
      {/* Left visual showcase (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Bilim sari qadam qo&apos;ying</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            O&apos;quvchi va Ustozlar uchun yagona makon
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Darslarni o&apos;zlashtiring, testlar yeching, ballar va sertifikatlarga ega
            bo&apos;ling yoki o&apos;z darslaringizni minglab o&apos;quvchilarga taqdim eting!
          </p>
        </div>

        {/* Feature badges */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/90 p-4 backdrop-blur-md shadow-xs transition-transform hover:-translate-y-0.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Sifatli video darslar va testlar</p>
              <p className="text-xs text-muted-foreground">Maktab darsliklari va maxsus kurslar</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/90 p-4 backdrop-blur-md shadow-xs transition-transform hover:-translate-y-0.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Olmoslar & Mukofotlar</p>
              <p className="text-xs text-muted-foreground">
                Kunlik baraban va qiziqarli sovg&apos;alar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/90 p-4 backdrop-blur-md shadow-xs transition-transform hover:-translate-y-0.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Award className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Rasmiy Sertifikatlar</p>
              <p className="text-xs text-muted-foreground">Kurs yakunida tasdiqlangan sertifikat</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-2">
          <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
          <span>Xavfsiz va tezkor kirish tizimi</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="lg:col-span-7 w-full max-w-md mx-auto pt-12">
        <div className="glass-card relative rounded-3xl p-6 sm:p-8 shadow-2xl border border-border/80 backdrop-blur-2xl">
          {/* Top badge */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Tizimga kirish
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Hisobingizga kirish uchun usulni tanlang
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary">
              <GraduationCap className="size-6" />
            </div>
          </div>

          <Tabs defaultValue={tgCode ? 'telegram' : 'password'} className="space-y-5 ">
            <TabsList className="grid w-full grid-cols-2  rounded-xl bg-muted/80 dark:bg-muted/50  h-11!">
              <TabsTrigger
                value="password"
                className="flex items-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm cursor-pointer"
              >
                <Phone className="size-3.5" />
                <span>Telefon</span>
              </TabsTrigger>
              <TabsTrigger
                value="telegram"
                className="flex items-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm cursor-pointer"
              >
                <MessageSquare className="size-3.5 text-sky-500" />
                <span>Telegram</span>
              </TabsTrigger>
            </TabsList>

            {/* Phone & Password Tab */}
            <TabsContent value="password" className="mt-0 space-y-4">
              {loginError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{loginError}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            className="h-12 text-base rounded-xl border-border/80 bg-background/70 focus-within:ring-2 focus-within:ring-primary/30"
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
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Parol
                          </FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 pr-11 text-base rounded-xl border-border/80 bg-background/70 focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground p-1 rounded-md cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-linear-to-r from-primary to-indigo-600 text-base font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 transition-all duration-200 cursor-pointer"
                    disabled={login.isPending}
                  >
                    {login.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      'Tizimga kirish'
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Telegram Tab */}
            <TabsContent value="telegram" className="mt-0 space-y-4">
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 dark:bg-sky-500/15 p-4 text-xs text-foreground leading-relaxed">
                <p className="font-bold text-sky-600 dark:text-sky-400 mb-1.5 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="size-4 shrink-0" /> Telegram orqali tezkor kirish
                </p>
                Telegram botimizga{' '}
                <a
                  href="https://t.me/edu_platform_uz_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-600 dark:text-sky-400 underline"
                >
                  @edu_platform_bot
                </a>{' '}
                <code className="rounded-md bg-sky-500/20 px-1.5 py-0.5 font-mono text-[11px] font-bold">
                  /start
                </code>{' '}
                yuboring va olingan tasdiqlash kodini kiriting.
              </div>

              <Form {...telegramForm}>
                <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-4">
                  <FormField
                    control={telegramForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Tasdiqlash kodi
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masalan: 123456"
                            inputMode="numeric"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                              // 6 ta belgi kiritilishi bilan avtomatik yuborish —
                              // foydalanuvchi "Tasdiqlash" tugmasini bosishi shart emas.
                              if (value.length === 6 && !telegramLogin.isPending) {
                                telegramForm.handleSubmit(onTelegramSubmit)();
                              }
                            }}
                            className="h-12 text-center text-lg font-mono tracking-widest rounded-xl border-border/80 bg-background/70"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-linear-to-r from-sky-600 to-indigo-600 text-base font-bold text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all duration-200 cursor-pointer"
                    disabled={telegramLogin.isPending}
                  >
                    {telegramLogin.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="size-4 mr-1.5" />
                        Tasdiqlash
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <p className="text-sm text-muted-foreground">
              Hisobingiz yo&apos;qmi?{' '}
              <Link
                href="/register"
                className="font-bold text-primary transition-colors hover:underline"
              >
                Ro&apos;yxatdan o&apos;ting
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
