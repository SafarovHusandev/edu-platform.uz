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
import {
  getTelegramInitData,
  getTelegramWebApp,
  openTelegramLink,
  supportsNativeButtons,
} from '@/lib/telegram-webapp';
import { TgMainButton } from '@/components/tg/tg-main-button';

const AUTH_PATHS = ['/', '/login', '/register'];

const subscribeNoop = () => () => {};

const openBot = () => openTelegramLink(`https://t.me/${TELEGRAM_BOT_USERNAME}`);

const REGISTER_STEPS: React.ReactNode[] = [
  <>
    Botni oching va <strong>/start</strong> bosing
  </>,
  'Kontaktingizni ulashing',
  "Mini ilovani qayta oching",
];

function NotRegistered({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const native = useSyncExternalStore(subscribeNoop, supportsNativeButtons, () => false);
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-4.5 px-6 pt-12 pb-[max(env(safe-area-inset-bottom),24px)] text-left">
      <span className="flex size-16 items-center justify-center rounded-[20px] bg-gold-soft text-gold-foreground">
        <Send className="size-7" />
      </span>
      <h1 className="font-heading text-2xl leading-tight font-semibold">
        Avval botdan ro&apos;yxatdan o&apos;ting
      </h1>
      <p className="leading-relaxed text-secondary-foreground">
        Mini ilova orqali yangi hisob ochib bo&apos;lmaydi — telefon raqamingizni faqat bot so&apos;ray
        oladi.
      </p>
      <ol className="flex flex-col gap-2.5">
        {REGISTER_STEPS.map((step, i) => (
          <li key={i} className="flex items-center gap-3 rounded-[14px] bg-background px-3.5 py-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-col gap-2.5 pt-4">
        <Button size="lg" variant="outline" className="h-12 w-full" disabled={retrying} onClick={onRetry}>
          {retrying && <Loader2 className="size-4 animate-spin" />}
          Qayta urinish
        </Button>
        {native ? (
          <TgMainButton text="Botga o'tish" onClick={openBot} />
        ) : (
          <Button size="lg" className="h-12 w-full" onClick={openBot}>
            <Send className="size-4" /> Botga o&apos;tish
          </Button>
        )}
      </div>
    </div>
  );
}

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

  // 404 — telefon raqami faqat bot orqali olinadi: dizayn (MiniApp.html) bo'yicha
  // to'liq ekran yo'riqnoma, "Botga o'tish" — Telegram MainButton'ida
  if (status === 404) {
    return (
      <div className="fixed inset-0 z-100 overflow-y-auto bg-card">
        <NotRegistered onRetry={authenticate} retrying={login.isPending} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <Logo />

        {status === 401 ? (
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
