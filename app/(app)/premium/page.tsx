'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState } from '@/components/ui/error-state';
import { useCreatePayment, usePremiumPlans } from '@/hooks/use-payment';
import { usePromoPreview } from '@/hooks/use-promo-codes';
import { refreshCurrentUser } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { daysUntil, formatDate, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PremiumPlanKey } from '@/types';

const PLAN_ORDER: PremiumPlanKey[] = ['30d', '90d', '180d', '365d'];
const POPULAR_PLAN: PremiumPlanKey = '180d';

const BENEFITS: Record<string, string[]> = {
  student: ['1.5x olmos', 'Premium mukofotlar', '3x barabon'],
  teacher: ["Testlarda to'liq urinishlar soni", "Testlarda to'liq vaqt limiti"],
};

type PayMethod = 'card' | 'balance';

export default function PremiumPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: plans, isLoading, isError, refetch } = usePremiumPlans();
  const createPayment = useCreatePayment();

  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanKey>(POPULAR_PLAN);
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
  const [method, setMethod] = useState<PayMethod>('card');

  const promoPreview = usePromoPreview({
    code: appliedCode,
    purpose: 'premium',
    plan: selectedPlan,
  });
  // Promo kod faqat "Qo'llash" bosilganda so'raladi — input o'zgarsa natija eskiradi
  const codeMatchesApplied = !!appliedCode && appliedCode === promoCode.trim();
  const promoApplied = codeMatchesApplied && !!promoPreview.data;

  const isPremium = user?.tarif === 'premium';
  const daysLeft = user?.premiumExpiresAt ? daysUntil(user.premiumExpiresAt) : null;
  const selected = plans?.[selectedPlan];
  const total = (promoApplied ? promoPreview.data?.finalAmount : undefined) ?? selected?.price ?? 0;
  const balance = user?.balance ?? 0;
  const balanceEnough = balance >= total;
  const benefits = BENEFITS[user?.role ?? ''] ?? [];

  function handleCheckout() {
    const useBalance = method === 'balance';
    createPayment.mutate(
      {
        purpose: 'premium',
        plan: selectedPlan,
        promoCode: promoApplied ? promoCode.trim() : undefined,
        useBalance,
        returnUrl: useBalance ? undefined : `${window.location.origin}/premium`,
      },
      {
        onSuccess: async (invoice) => {
          if (invoice.paidWithBalance) {
            await refreshCurrentUser();
            toast.success('Premium faollashtirildi!');
            return;
          }
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl;
            return;
          }
          router.push(
            user?.role === 'student'
              ? `/student/payment/${invoice.invoiceId}`
              : `/payment/${invoice.invoiceId}`
          );
        },
      }
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="flex flex-wrap items-center gap-5 rounded-[22px] bg-primary px-6 py-6 text-primary-foreground sm:px-7">
        <div className="min-w-0 flex-[1_1_320px]">
          <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-admin">
            {isPremium ? 'PREMIUM FAOL' : 'PREMIUM'}
          </span>
          <h1 className="mt-2.5 mb-1 font-heading text-2xl font-semibold sm:text-[26px]">
            {isPremium && user?.premiumExpiresAt
              ? `${formatDate(user.premiumExpiresAt)} gacha`
              : "Premium a'zolik"}
          </h1>
          <p className="text-primary-foreground/80">
            {isPremium
              ? daysLeft !== null && daysLeft <= 5
                ? `Muddat ${daysLeft <= 0 ? 'tugadi' : `${daysLeft} kundan keyin tugaydi`} — yangi reja bilan uzaytiring.`
                : "Yangi reja joriy muddat ustiga qo'shiladi — almashtirmaydi."
              : "Ko'proq olmos, premium mukofotlar va ko'proq imkoniyatlar."}
          </p>
        </div>
        {benefits.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {benefits.map((benefit) => (
              <span key={benefit} className="rounded-xl bg-white/15 px-3.5 py-2.5 font-semibold">
                {benefit}
              </span>
            ))}
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-[20px] bg-muted" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-[22px] bg-muted" />
        </div>
      ) : isError || !plans ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {PLAN_ORDER.map((key) => {
              const plan = plans[key];
              if (!plan) return null;
              const isSelected = key === selectedPlan;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedPlan(key)}
                  className={cn(
                    'relative flex flex-col gap-2 rounded-[20px] border-2 p-4 text-left transition-colors sm:p-5',
                    isSelected
                      ? 'border-primary bg-primary-soft'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  {(isSelected || key === POPULAR_PLAN) && (
                    <span
                      className={cn(
                        'absolute -top-3 right-4 rounded-full px-2.5 py-1 text-[11px] font-bold',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-gold text-admin'
                      )}
                    >
                      {isSelected ? 'TANLANDI' : 'OMMABOP'}
                    </span>
                  )}
                  <span className="font-heading text-xl font-bold sm:text-[22px]">
                    {plan.days} kun
                  </span>
                  <span className="text-base font-bold sm:text-lg">{formatPrice(plan.price)}</span>
                  <span className="text-[13px] text-muted-foreground">
                    oyiga {formatPrice(plan.pricePerMonth)}
                    {plan.discountPercent > 0 ? ` · −${plan.discountPercent}%` : ' · standart'}
                  </span>
                </button>
              );
            })}
          </div>

          <aside
            aria-label="To'lov"
            className="flex flex-col gap-3.5 rounded-[22px] border border-border bg-card p-5 sm:p-[22px]"
          >
            <h2 className="text-lg font-bold">To&apos;lov</h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="promo" className="text-sm font-semibold">
                Promokod
              </label>
              <div className="flex gap-2">
                <Input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setAppliedCode(promoCode.trim() || undefined);
                    }
                  }}
                  placeholder="Ixtiyoriy"
                  className={cn('h-11', promoApplied && 'border-success')}
                />
                <Button
                  type="button"
                  variant={promoApplied ? 'secondary' : 'outline'}
                  className={cn('h-11 shrink-0', promoApplied && 'bg-success-soft text-success')}
                  onClick={() => setAppliedCode(promoCode.trim() || undefined)}
                  disabled={!promoCode.trim() || promoPreview.isFetching}
                >
                  {promoPreview.isFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : promoApplied ? (
                    <Check className="size-4" />
                  ) : null}
                  {promoApplied ? "Qo'llandi" : "Qo'llash"}
                </Button>
              </div>
              {codeMatchesApplied && promoPreview.isError && (
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-destructive">
                  <CircleAlert className="size-3.5" /> Promokod topilmadi yoki amal qilmaydi
                </span>
              )}
              {promoApplied && (
                <span className="text-[13px] font-semibold text-success">
                  −{promoPreview.data!.discountPercent}% chegirma qo&apos;llandi
                </span>
              )}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">To&apos;lov usuli</legend>
              {(
                [
                  {
                    value: 'card',
                    title: 'Multicard',
                    note: "Karta orqali — to'lov sahifasiga o'tasiz",
                    disabled: false,
                  },
                  {
                    value: 'balance',
                    title: 'Hamyon balansidan',
                    note: `Balans: ${formatPrice(balance)}${balanceEnough ? ' · darhol faollashadi' : ' · yetarli emas'}`,
                    disabled: !balanceEnough,
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-[14px] border-2 p-3.5 transition-colors',
                    method === option.value ? 'border-primary' : 'border-border',
                    option.disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <input
                    type="radio"
                    name="pay-method"
                    value={option.value}
                    checked={method === option.value}
                    disabled={option.disabled}
                    onChange={() => setMethod(option.value)}
                    className="size-[18px] accent-primary"
                  />
                  <span>
                    <span className="block font-bold">{option.title}</span>
                    <span className="block text-[13px] text-muted-foreground">{option.note}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Jami</span>
              <span className="font-heading text-xl font-bold">{formatPrice(total)}</span>
            </div>

            <Button
              size="lg"
              className="h-[52px] w-full text-base font-bold"
              onClick={handleCheckout}
              disabled={
                createPayment.isPending || !selected || (method === 'balance' && !balanceEnough)
              }
            >
              {createPayment.isPending && <Loader2 className="size-4 animate-spin" />}
              To&apos;lash
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
