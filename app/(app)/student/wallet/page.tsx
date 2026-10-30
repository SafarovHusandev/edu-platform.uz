'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PaymentsHistory } from '@/components/payments/payments-history';
import { useCreatePayment } from '@/hooks/use-payment';
import { useAuthStore } from '@/store/auth-store';
import { formatNumber, formatPrice, toTiyin } from '@/lib/format';
import { cn } from '@/lib/utils';

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000];
const MIN_AMOUNT = 1000;

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const createPayment = useCreatePayment();
  const [amount, setAmount] = useState(50000);
  const [custom, setCustom] = useState('');

  const effectiveAmount = custom ? Number(custom) : amount;
  const valid = Number.isFinite(effectiveAmount) && effectiveAmount >= MIN_AMOUNT;

  function handleTopUp() {
    if (!valid) return;
    createPayment.mutate(
      {
        purpose: 'wallet',
        amount: toTiyin(effectiveAmount),
        returnUrl: `${window.location.origin}/student/wallet`,
      },
      {
        onSuccess: (invoice) => {
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl;
          } else {
            router.push(`/student/payment/${invoice.invoiceId}`);
          }
        },
      }
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageHeader title="Hamyon" className="mb-0" />

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="flex flex-col justify-between gap-2.5 rounded-[22px] bg-primary p-6 text-primary-foreground">
          <span className="text-primary-foreground/80">Joriy balans</span>
          <span className="font-heading text-3xl font-bold sm:text-[34px]">
            {formatPrice(user?.balance ?? 0)}
          </span>
          <span className="text-sm text-primary-foreground/80">
            Kurs va Premium xaridida &quot;Hamyon balansidan&quot; usulini tanlasangiz, darhol
            to&apos;lanadi.
          </span>
        </section>

        <section className="flex flex-col gap-3 rounded-[22px] border border-border bg-card p-5 sm:p-[22px]">
          <label htmlFor="amount" className="font-bold">
            Balansni to&apos;ldirish
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => {
              const active = !custom && amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setAmount(value);
                    setCustom('');
                  }}
                  className={cn(
                    'rounded-[10px] px-4 py-2.5 font-semibold transition-colors',
                    active
                      ? 'border-[1.5px] border-primary bg-primary-soft font-bold text-primary'
                      : 'border border-input bg-card hover:bg-muted'
                  )}
                >
                  {formatNumber(value)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              min={MIN_AMOUNT}
              step={1000}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Boshqa summa, so'm"
              className="h-12 flex-[1_1_220px]"
            />
            <Button
              size="lg"
              className="h-12"
              onClick={handleTopUp}
              disabled={createPayment.isPending || !valid}
            >
              {createPayment.isPending && <Loader2 className="size-4 animate-spin" />}
              Multicard orqali to&apos;ldirish
            </Button>
          </div>
          {custom && !valid && (
            <span className="text-[13px] text-destructive">
              Eng kam summa: {formatNumber(MIN_AMOUNT)} so&apos;m
            </span>
          )}
        </section>
      </div>

      <PaymentsHistory title="To'lovlar tarixi" />
    </div>
  );
}
