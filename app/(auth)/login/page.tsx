'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  // https://edu-platform.uz/login?tg_code=... — Telegram botdan yuborilgan
  // havola bosilganda kodni qo'lda kiritmasdan avtomatik login qilinadi.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tgCode]);

  if (tgCode && !autoLoginFailed) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{
          backgroundImage:
            'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 35%), linear-gradient(135deg, #f8fbff 0%, #eef3ff 35%, #f7f4ff 100%)',
        }}
      >
        <Card className="w-full max-w-md border-0 bg-background/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <p className="text-xl font-semibold text-foreground">Telegram orqali kirilmoqda...</p>
            <p className="text-base text-muted-foreground">Iltimos, bir necha soniya kuting</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    login.mutate(
      { ...values, phone: `998${values.phone}` },
      {
        onSuccess: () => {
          router.push(searchParams.get('redirect') || '/dashboard');
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
    <div className="max-w-120 w-full ">
      <Card className="relative w-full border-0 bg-background/90 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl ring-1 ring-border/60">
        <CardHeader className=" space-y-3 pb-5  text-center">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tizimga kirish
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Hisobingizga kirish uchun ma&apos;lumotlarni kiriting
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-7 sm:px-7">
          <Tabs defaultValue={tgCode ? 'telegram' : 'password'} className="space-y-5">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/80 p-1">
              <TabsTrigger
                value="password"
                className="rounded-xl text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Telefon
              </TabsTrigger>
              <TabsTrigger
                value="telegram"
                className="rounded-xl text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Telegram
              </TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="mt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-base font-medium text-foreground">
                          Telefon raqam
                        </FormLabel>
                        <FormControl>
                          <PhoneInput {...field} className="h-12 text-base" />
                        </FormControl>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-base font-medium text-foreground">
                          Parol
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 pr-11 text-base"
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                    disabled={login.isPending}
                  >
                    {login.isPending && <Loader2 className="size-4 animate-spin" />}
                    Kirish
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="telegram" className="mt-0">
              <p className="mb-4 text-base leading-6 text-muted-foreground">
                Telegram botimizga{' '}
                <a
                  href="https://t.me/edu_platform_uz_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  @edu_platform_bot
                </a>{' '}
                <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm">/start</code> yuboring,
                u sizga bir martalik kodni yuboradi.
              </p>
              <Form {...telegramForm}>
                <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-5">
                  <FormField
                    control={telegramForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-base font-medium text-foreground">
                          Tasdiqlash kodi
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123456"
                            inputMode="numeric"
                            {...field}
                            className="h-12 text-base"
                          />
                        </FormControl>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                    disabled={telegramLogin.isPending}
                  >
                    {telegramLogin.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Tasdiqlash
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-center text-base text-muted-foreground">
            Hisobingiz yo&apos;qmi?{' '}
            <Link
              href="/register"
              className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </p>
        </CardContent>
      </Card>
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
