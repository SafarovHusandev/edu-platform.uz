'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTelegramWebApp, supportsNativeButtons } from '@/lib/telegram-webapp';
import { cn } from '@/lib/utils';

const subscribeNoop = () => () => {};

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
  // Native rejimda MainButton yonida sahifa ichida ko'rsatiladigan ikkinchi tugma
  secondary?: React.ReactNode;
}) {
  const native = useSyncExternalStore(subscribeNoop, supportsNativeButtons, () => false);
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
    mainButton.setParams?.({
      color: disabled ? '#9AA3B5' : '#2B44D6',
      text_color: '#FFFFFF',
    });
    if (disabled || loading) mainButton.disable();
    else mainButton.enable();
    if (loading) mainButton.showProgress(false);
    else mainButton.hideProgress();
    if (hidden) mainButton.hide();
    else mainButton.show();
  }, [native, text, disabled, loading, hidden]);

  if (native) {
    return secondary ? <div className="flex flex-col gap-2">{secondary}</div> : null;
  }
  if (hidden) return secondary ? <div className="flex flex-col gap-2">{secondary}</div> : null;

  return (
    <>
      <div aria-hidden className="h-20" />
      <div
        // Tab sahifalarida pastki menyu ustida turadi (TgShell --tg-nav-h ni beradi)
        style={{ bottom: 'var(--tg-nav-h, 0px)' }}
        className="fixed inset-x-0 z-40 border-t border-border bg-card/95 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] backdrop-blur">
        <div className={cn('mx-auto flex max-w-xl gap-2.5', secondary && '[&>*]:flex-1')}>
          {secondary}
          <Button
            size="lg"
            className="h-12 flex-1 rounded-[14px] text-[15px] font-bold"
            disabled={disabled || loading}
            onClick={onClick}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {text}
          </Button>
        </div>
      </div>
    </>
  );
}
