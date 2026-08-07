'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
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
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium">Telegram orqali kirilmoqda...</p>
          <p className="text-sm text-muted-foreground">Iltimos, bir necha soniya kuting</p>
        </CardContent>
      </Card>
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Tizimga kirish</CardTitle>
        <CardDescription>Hisobingizga kirish uchun ma&apos;lumotlarni kiriting</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={tgCode ? 'telegram' : 'password'}>
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1">
              Telefon
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex-1">
              Telegram
            </TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon raqam</FormLabel>
                      <FormControl>
                        <PhoneInput {...field} />
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
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending && <Loader2 className="size-4 animate-spin" />}
                  Kirish
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="telegram" className="mt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Telegram botimizga{' '}
              <a
                href="https://t.me/edu_platform_uz_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                @edu_platform_bot
              </a>{' '}
              <code className="text-xs">/start</code> yuboring, u sizga bir martalik kodni yuboradi.
            </p>
            <Form {...telegramForm}>
              <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-4">
                <FormField
                  control={telegramForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasdiqlash kodi</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={telegramLogin.isPending}>
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
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Hisobingiz yo&apos;qmi?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Ro&apos;yxatdan o&apos;ting
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
