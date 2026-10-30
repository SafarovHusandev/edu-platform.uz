'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { usePaymentStatus } from '@/hooks/use-payment';
import { refreshCurrentUser } from '@/hooks/use-auth';
import { formatDateTime, formatPrice } from '@/lib/format';
import { getPaymentStatusConfig, PAYMENT_PURPOSE_LABELS } from '@/lib/payment-status';
import { cn } from '@/lib/utils';
import type { PaymentPurpose } from '@/types';

const PURPOSE_LINKS: Partial<Record<PaymentPurpose, { href: string; label: string }>> = {
  course: { href: '/student/courses', label: "Kurslarimga o'tish" },
  wallet: { href: '/student/wallet', label: 'Hamyonga qaytish' },
  premium: { href: '/premium', label: 'Premium sahifasi' },
};

// To'lov holati: invoys tugaguncha so'rov qilinadi (usePaymentStatus polling)
export function PaymentStatusView({
  invoiceId,
  homeHref,
  homeLabel = 'Bosh sahifaga qaytish',
  purposeLinks = true,
}: {
  invoiceId: string;
  homeHref: string;
  homeLabel?: string;
  // Kurs/hamyon/premium uchun tegishli sahifaga havola (faqat tizimdagi foydalanuvchiga)
  purposeLinks?: boolean;
}) {
  const { data: invoice, isLoading, isError, refetch } = usePaymentStatus(invoiceId, true);
  const refreshed = useRef(false);

  useEffect(() => {
    if (invoice?.status === 'success' && !refreshed.current) {
      refreshed.current = true;
      refreshCurrentUser();
    }
  }, [invoice?.status]);

  if (isError) {
    return <ErrorState title="To'lov holatini tekshirib bo'lmadi" onRetry={() => refetch()} />;
  }

  if (isLoading || !invoice) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-20 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">To&apos;lov holati tekshirilmoqda...</p>
      </div>
    );
  }

  const config = getPaymentStatusConfig(invoice.status);
  const Icon = config.icon;
  const success = invoice.status === 'success';
  const pending = !success && invoice.status !== 'error' && invoice.status !== 'revert';
  const purposeLink = purposeLinks && success ? PURPOSE_LINKS[invoice.purpose] : undefined;

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-border bg-card p-6 text-center sm:p-8">
        <span
          className={cn('flex size-16 items-center justify-center rounded-2xl', config.className)}
        >
          <Icon className="size-8" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold">{config.label}</h1>
          <p className="mt-1 text-secondary-foreground">
            {PAYMENT_PURPOSE_LABELS[invoice.purpose]}
          </p>
        </div>
        <div className="font-heading text-3xl font-bold">{formatPrice(invoice.amount)}</div>

        {success && invoice.purpose === 'premium' && (
          <p className="flex items-center gap-2 rounded-[14px] bg-gold-soft px-4 py-3 text-left text-sm">
            <Star className="size-4 shrink-0 text-gold" /> Premium faollashtirildi! Yangi
            imkoniyatlar profilingizda faol.
          </p>
        )}
        {success && invoice.purpose === 'donation' && (
          <p className="flex items-center gap-2 rounded-[14px] bg-destructive-soft px-4 py-3 text-left text-sm">
            <Heart className="size-4 shrink-0 fill-current text-destructive" /> Homiyligingiz uchun
            rahmat! Yordamingiz platformani rivojlantirishda muhim.
          </p>
        )}

        <dl className="w-full divide-y divide-border rounded-[14px] border border-border text-sm">
          <div className="flex justify-between gap-3 px-4 py-2.5">
            <dt className="text-muted-foreground">Invoys</dt>
            <dd className="min-w-0 font-medium break-all">{invoice.invoiceId}</dd>
          </div>
          {invoice.createdAt && (
            <div className="flex justify-between gap-3 px-4 py-2.5">
              <dt className="text-muted-foreground">Sana</dt>
              <dd className="font-medium">{formatDateTime(invoice.createdAt)}</dd>
            </div>
          )}
        </dl>

        {pending && (
          <p className="text-sm text-muted-foreground">
            Holat avtomatik yangilanadi — sahifani yopmang.
          </p>
        )}

        <div className="flex w-full flex-col gap-2.5 pt-1">
          {purposeLink && (
            <Button size="lg" className="w-full" render={<Link href={purposeLink.href} />}>
              {purposeLink.label}
            </Button>
          )}
          <Button
            size="lg"
            variant={purposeLink ? 'outline' : 'default'}
            className="w-full"
            render={<Link href={homeHref} />}
          >
            {homeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
