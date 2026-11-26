'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { cssVarHex, getTelegramWebApp, supportsNativeButtons } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';

const subscribeNoop = () => () => {};

// Zaxira ranglar: faqat oklch'ni bilmaydigan eski WebView uchun (globals.css bilan bir xil)
const FALLBACK = {
  light: { bg: '#2B44D6', text: '#FFFFFF', offBg: '#EEF0F5', offText: '#5B6474' },
  dark: { bg: '#7B8CF0', text: '#10131B', offBg: '#252A36', offText: '#A8AEBC' },
} as const;

// Dizayndagi ikkinchi amal tugmasi (TgMain.html: "Qoralama", "O'tkazish")
export function TgSecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-12.5 rounded-xl bg-primary-soft px-4 text-[15px] font-bold text-primary transition-opacity active:opacity-80 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// Dizayndagi asosiy amal tugmasi (TgMain.html). Telegram ichida — native MainButton,
// oddiy brauzerda (dev/test) — ekran pastiga yopishgan oddiy tugma.
// Sahifada bir vaqtda faqat bitta TgMainButton bo'lishi kerak.
export function TgMainButton({
  text,
  onClick,
  disabled,
  loading,
  hidden,
  secondary,
}: {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
  // Ikkinchi amal (TgSecondaryButton). Native rejimda sahifa oxirida, brauzerda — yonida.
  secondary?: React.ReactNode;
}) {
  const native = useSyncExternalStore(subscribeNoop, supportsNativeButtons, () => false);
  const { resolvedTheme } = useTheme();
  const onClickRef = useRef(onClick);
  const blockedRef = useRef(false);

  useEffect(() => {
    onClickRef.current = onClick;
    blockedRef.current = !!disabled || !!loading;
  });

  useEffect(() => {
    if (!native) return;
    const mainButton = getTelegramWebApp()?.MainButton;
    if (!mainButton) return;
    const handler = () => {
      if (!blockedRef.current) onClickRef.current();
    };
    mainButton.onClick(handler);
    return () => {
      mainButton.offClick(handler);
      mainButton.hideProgress();
      mainButton.hide();
    };
  }, [native]);

  useEffect(() => {
    if (!native) return;
    const mainButton = getTelegramWebApp()?.MainButton;
    if (!mainButton) return;
    mainButton.setText(text);
    if (disabled || loading) mainButton.disable();
    else mainButton.enable();
    if (loading) mainButton.showProgress(false);
    else mainButton.hideProgress();
    if (hidden) mainButton.hide();
    else mainButton.show();
  }, [native, text, disabled, loading, hidden]);

  // Rang mavzuga bog'liq: .dark klassi qo'yilgach (keyingi kadrda) tokenlardan o'qiladi
  useEffect(() => {
    if (!native) return;
    const mainButton = getTelegramWebApp()?.MainButton;
    if (!mainButton?.setParams) return;
    const frame = requestAnimationFrame(() => {
      const fb = FALLBACK[resolvedTheme === 'dark' ? 'dark' : 'light'];
      const off = !!disabled && !loading;
      mainButton.setParams?.({
        color: off ? cssVarHex('--muted', fb.offBg) : cssVarHex('--primary', fb.bg),
        text_color: off
          ? cssVarHex('--muted-foreground', fb.offText)
          : cssVarHex('--primary-foreground', fb.text),
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [native, disabled, loading, resolvedTheme]);

  if (native || hidden) {
    return secondary ? <div className="flex flex-col">{secondary}</div> : null;
  }

  return (
    <>
      <div aria-hidden className="h-18" />
      <div
        // Tab sahifalarida pastki menyu ustida turadi (TgShell --tg-nav-h ni beradi)
        style={{ bottom: 'var(--tg-nav-h, 0px)' }}
        className="fixed inset-x-0 z-40 border-t border-border bg-card px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),18px)]"
      >
        <div className="mx-auto flex max-w-xl gap-2 *:flex-1">
          {secondary}
          <button
            type="button"
            disabled={disabled || loading}
            onClick={onClick}
            className={cn(
              'inline-flex h-12.5 flex-2! items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition-colors',
              disabled && !loading
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground active:opacity-90'
            )}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            <span className="truncate">{text}</span>
          </button>
        </div>
      </div>
    </>
  );
}
