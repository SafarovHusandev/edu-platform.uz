'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2, Send, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useTelegramWebAppLogin } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api-client';
import { getTokenCookie } from '@/lib/cookies';
import { TELEGRAM_BOT_USERNAME } from '@/lib/config';
import { getTelegramInitData, getTelegramWebApp, openTelegramLink } from '@/lib/telegram-webapp';

const AUTH_PATHS = ['/', '/login', '/register'];

const subscribeNoop = () => () => {};

// Sayt Telegram Mini App sifatida ochilganda login/parol formasini ko'rsatmay,
// initData orqali avtomatik kiritadi. Oddiy brauzerda hech narsa render qilmaydi.
export function TelegramWebAppGate() {
  const router = useRouter();
  const initData = useSyncExternalStore(subscribeNoop, getTelegramInitData, () => '');
  const hasToken = useSyncExternalStore(
    subscribeNoop,
    () => !!getTokenCookie(),
    () => true
  );
  const login = useTelegramWebAppLogin();
  const startedRef = useRef(false);

  function authenticate() {
    login.mutate(initData, {
      onSuccess: () => {
        const { pathname, search } = window.location;
        if (AUTH_PATHS.includes(pathname)) {
          router.replace(new URLSearchParams(search).get('redirect') || '/dashboard');
        } else {
          router.refresh();
        }
      },
    });
  }

  useEffect(() => {
    if (!initData) return;
    const webApp = getTelegramWebApp();
    webApp?.ready?.();
    webApp?.expand?.();
    if (hasToken || startedRef.current) return;
    startedRef.current = true;
    authenticate();
    // authenticate faqat bir marta, initData aniqlanganda chaqiriladi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData, hasToken]);

  const redirecting =
    login.isSuccess &&
    typeof window !== 'undefined' &&
    AUTH_PATHS.includes(window.location.pathname);

  if (!initData || (hasToken && !login.isPending && !redirecting)) return null;

  const status = login.error instanceof ApiError ? login.error.status : null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <Logo />

        {status === 404 ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Send className="size-7" />
            </span>
            <h1 className="font-heading text-xl font-semibold">Avval botga o&apos;ting</h1>
            <p className="text-sm text-muted-foreground">
              Hisobingiz hali Telegram bilan bog&apos;lanmagan. Botni oching va{' '}
              <span className="font-semibold text-foreground">/start</span> tugmasini bosing,
              so&apos;ng ilovani qayta oching.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => openTelegramLink(`https://t.me/${TELEGRAM_BOT_USERNAME}`)}
            >
              <Send className="size-4" /> Botga o&apos;tish
            </Button>
          </>
        ) : status === 401 ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold-foreground">
              <Clock className="size-7" />
            </span>
            <h1 className="font-heading text-xl font-semibold">Sessiya eskirgan</h1>
            <p className="text-sm text-muted-foreground">
              Ilova uzoq vaqt ochiq turgani sababli kirish ma&apos;lumotlari eskirdi. Ilovani yopib,
              qaytadan oching.
            </p>
            {getTelegramWebApp()?.close && (
              <Button size="lg" className="w-full" onClick={() => getTelegramWebApp()?.close?.()}>
                Ilovani yopish
              </Button>
            )}
          </>
        ) : login.isError ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <TriangleAlert className="size-7" />
            </span>
            <h1 className="font-heading text-xl font-semibold">Kirib bo&apos;lmadi</h1>
            <p className="text-sm text-muted-foreground">
              {login.error instanceof Error
                ? login.error.message
                : 'Telegram orqali kirishda xatolik yuz berdi'}
            </p>
            <Button size="lg" className="w-full" onClick={authenticate}>
              Qayta urinish
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Telegram orqali kirilmoqda...</p>
          </>
        )}
      </div>
    </div>
  );
}
