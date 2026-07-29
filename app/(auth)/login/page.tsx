'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  phone: z.string().min(9, { error: "Telefon raqamni to'liq kiriting" }),
  // .regex(/^[0-9]{9,12}$/, { error: "Faqat raqamlardan iborat bo'lsin" }),
  password: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
});

type FormValues = z.infer<typeof schema>;

const telegramSchema = z.object({
  telegramId: z.string().min(1, { error: 'Telegram ID kiriting' }),
  code: z.string().min(4, { error: 'Kodni to\'liq kiriting' }),
});

type TelegramFormValues = z.infer<typeof telegramSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const telegramLogin = useTelegramLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', password: '' },
  });

  const telegramForm = useForm<TelegramFormValues>({
    resolver: zodResolver(telegramSchema),
    defaultValues: { telegramId: '', code: '' },
  });

  function onSubmit(values: FormValues) {
    login.mutate(values, {
      onSuccess: () => {
        router.push(searchParams.get('redirect') || '/dashboard');
      },
    });
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
        <Tabs defaultValue="password">
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1">Telefon</TabsTrigger>
            <TabsTrigger value="telegram" className="flex-1">Telegram</TabsTrigger>
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
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending && <Loader2 className="size-4 animate-spin" />}
                  Kirish
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="telegram" className="mt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Telegram botimizga (@edu_platform_bot) <code className="text-xs">/start</code> yuboring,
              u sizga Telegram ID va bir martalik kodni yuboradi.
            </p>
            <Form {...telegramForm}>
              <form onSubmit={telegramForm.handleSubmit(onTelegramSubmit)} className="space-y-4">
                <FormField
                  control={telegramForm.control}
                  name="telegramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
