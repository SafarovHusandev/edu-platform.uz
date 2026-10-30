'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuthTabs } from '@/components/auth/auth-tabs';
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
  const [tab, setTab] = useState<'login' | 'telegram'>(
    tgCode || searchParams.get('tab') === 'telegram' ? 'telegram' : 'login'
  );
  const redirect = searchParams.get('redirect');
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
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Loader2 className="size-8 animate-spin" />
        </div>
        <div>
          <p className="font-heading text-xl font-bold">Telegram orqali kirilmoqda...</p>
          <p className="mt-1 text-sm text-muted-foreground">Iltimos, bir necha soniya kuting</p>
        </div>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    setLoginError(null);
    login.mutate(
      { ...values, phone: `998${values.phone}` },
      {
        onSuccess: () => {
          router.push(redirect || '/dashboard');
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
        router.push(redirect || '/dashboard');
      },
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTabs
        active={tab}
        redirect={redirect}
        onSelect={(next) => {
          if (next === 'register') return false;
          setTab(next);
          return true;
        }}
      />

      {tab === 'login' ? (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-[28px] font-bold">Xush kelibsiz</h2>
            <p className="mt-1 text-secondary-foreground">
              Telefon raqam va parolingiz bilan kiring.
            </p>
          </div>

          {loginError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{loginError}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                          className="pr-11"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
                {login.isPending ? <Loader2 className="size-5 animate-spin" /> : 'Kirish'}
              </Button>
            </form>
          </Form>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            yoki
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => setTab('telegram')}
          >
            <Send className="size-4" /> Telegram kod bilan kirish
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-[28px] font-bold">Telegram orqali</h2>
            <p className="mt-1 text-secondary-foreground">
              Botdan olingan tasdiqlash kodini kiriting.
            </p>
          </div>

          <ol className="flex flex-col gap-2.5 rounded-[18px] border border-border bg-card p-4 text-[15px]">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                1
              </span>
              <span>
                Botni oching:{' '}
                <a
                  href="https://t.me/edu_platform_uz_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  @edu_platform_uz_bot
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                2
              </span>
              <span>
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] font-semibold">
                  /start
                </code>{' '}
                buyrug&apos;ini yuboring
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                3
              </span>
              <span>Olingan 6 xonali kodni quyida kiriting</span>
            </li>
          </ol>

          <Form {...telegramForm}>
            <form
              onSubmit={telegramForm.handleSubmit(onTelegramSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={telegramForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasdiqlash kodi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        inputMode="numeric"
                        autoComplete="one-time-code"
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
                        className="text-center font-heading text-lg tracking-[0.3em]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={telegramLogin.isPending}>
                {telegramLogin.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" /> Tasdiqlash
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Hisobingiz yo&apos;qmi?{' '}
        <Link
          href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
          className="font-semibold text-primary hover:underline"
        >
          Ro&apos;yxatdan o&apos;ting
        </Link>
      </p>
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
