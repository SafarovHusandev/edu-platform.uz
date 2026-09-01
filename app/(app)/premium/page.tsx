'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Check,
  CircleAlert,
  Crown,
  Loader2,
  Lock,
  Repeat,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/error-state';
import { useAuthStore } from '@/store/auth-store';
import { useCreatePayment, usePremiumPlans } from '@/hooks/use-payment';
import { usePromoPreview } from '@/hooks/use-promo-codes';
import { daysUntil, formatDate, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PremiumPlanKey } from '@/types';

// Reja nomini backenddan kelgan kun sonidan hosil qiladi — kalit nomi yoki
// muddat o'zgarsa ham (masalan backend narx jadvalini yangilasa) label to'g'ri
// chiqaveradi, hardcoded matnga bog'liq bo'lmaydi.
function planLabel(days: number) {
  if (days === 30) return '1 oylik';
  if (days === 90) return '3 oylik';
  if (days === 180) return '6 oylik';
  if (days === 365) return '1 yillik';
  if (days > 0 && days % 30 === 0) return `${days / 30} oylik`;
  return `${days} kunlik`;
}

const PLAN_ORDER: PremiumPlanKey[] = ['30d', '90d', '180d', '365d'];
const POPULAR_PLAN: PremiumPlanKey = '180d';

const STUDENT_BENEFITS = [
  { icon: 'diamond' as const, label: 'Har bir test/dars uchun olmos', value: '1.5× ko’proq' },
  { icon: RotateCw, label: 'Kunlik barabon', value: 'kuniga 3 martagacha' },
  { icon: Lock, label: "Premium sovg'alar", value: 'ochiladi' },
];

const TEACHER_BENEFITS = [
  {
    icon: Repeat,
    label: 'Testlarda urinishlar soni',
    value: 'siz belgilagan darajada (cheklanmaydi)',
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: plans, isLoading, isError, refetch } = usePremiumPlans();
  const createPayment = useCreatePayment();

  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanKey>(POPULAR_PLAN);
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);

  const promoPreview = usePromoPreview({
    code: appliedCode,
    purpose: 'premium',
    plan: selectedPlan,
  });
  // Promo kod faqat "Tekshirish" bosilganda so'ralsin — input o'zgarishi bilan
  // amaldagi natija eskirgan bo'lib qoladi, shu bilan qayta ko'rsatilmaydi.
  const codeMatchesApplied = !!appliedCode && appliedCode === promoCode.trim();

  function handleCheckPromo() {
    setAppliedCode(promoCode.trim() || undefined);
  }

  const isPremium = user?.tarif === 'premium';
  const selected = plans?.[selectedPlan];

  const daysLeft = user?.premiumExpiresAt ? daysUntil(user.premiumExpiresAt) : null;

  function handleCheckout() {
    createPayment.mutate(
      {
        purpose: 'premium',
        plan: selectedPlan,
        promoCode: promoCode.trim() || undefined,
        returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/premium` : '',
      },
      {
        onSuccess: (invoice) => {
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl;
          } else {
            router.push(
              user?.role === 'student'
                ? `/student/payment/${invoice.invoiceId}`
                : `/payment/${invoice.invoiceId}`
            );
          }
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Premium a'zolik"
        description="Istalgan reja bilan sotib oling — muddat mavjud premiumingiz ustiga qo'shiladi"
      />

      {isPremium && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-gold/30 bg-linear-to-r from-gold/15 to-transparent p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
              <Crown className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gold-foreground">
                Premium faol
                {user.premiumExpiresAt ? ` — ${formatDate(user.premiumExpiresAt)} gacha` : ''}
              </p>
              <p className="mt-0.5 text-xs text-gold-foreground/80">
                {daysLeft !== null && daysLeft <= 5
                  ? `Muddatingiz ${daysLeft <= 0 ? 'tugadi' : `${daysLeft} kundan keyin tugaydi`} — pastdan yangi reja tanlab uzaytiring`
                  : 'Xohlasangiz, pastdan yana reja tanlab muddatni uzaytirishingiz mumkin'}
              </p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'student' ? (
        <BenefitsCard title="O'quvchi uchun imkoniyatlar" benefits={STUDENT_BENEFITS} />
      ) : user?.role === 'teacher' ? (
        <BenefitsCard title="O'qituvchi uchun imkoniyatlar" benefits={TEACHER_BENEFITS} />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="flex items-start gap-3 pt-5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4.5 shrink-0 text-gold-foreground" />
            <p>
              Premium imtiyozlari asosan o&apos;quvchi va o&apos;qituvchi rollari uchun
              mo&apos;ljallangan (ko&apos;proq olmos, kunlik barabon, qo&apos;shimcha urinishlar).
              Sizning rolingiz uchun alohida funksional cheklov yo&apos;q, lekin xohlasangiz sotib
              olishingiz mumkin.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : isError || !plans ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLAN_ORDER.map((key) => {
              const plan = plans[key];
              if (!plan) return null;
              const isSelected = key === selectedPlan;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-3 py-4 text-center shadow-sm transition-all',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border/70 hover:border-primary/40'
                  )}
                >
                  {key === POPULAR_PLAN && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-primary-foreground shadow-sm">
                      Eng ommabop
                    </span>
                  )}
                  <span className="mt-1 text-sm font-semibold">{planLabel(plan.days)}</span>
                  <span className="text-lg font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-xs text-muted-foreground">
                    oyiga ~{formatPrice(plan.pricePerMonth)}
                  </span>
                  {plan.discountPercent > 0 && (
                    <Badge className="mt-1 rounded-full bg-success/15 text-success">
                      {plan.discountPercent}% tejang
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-4 pt-5">
              <div className="flex items-center gap-2">
                <Tag className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckPromo();
                    }
                  }}
                  placeholder="Promo kod (ixtiyoriy)"
                  className="h-10 rounded-md"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 rounded-md"
                  onClick={handleCheckPromo}
                  disabled={!promoCode.trim() || promoPreview.isFetching}
                >
                  {promoPreview.isFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Tekshirish
                </Button>
              </div>

              {codeMatchesApplied && promoPreview.isError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <CircleAlert className="size-3.5" /> Promo kod topilmadi yoki amal qilmaydi
                </p>
              )}
              {codeMatchesApplied && promoPreview.data && (
                <p className="flex items-center gap-1.5 text-xs text-success">
                  <Sparkles className="size-3.5" /> {promoPreview.data.discountPercent}% chegirma
                  qo&apos;llandi
                </p>
              )}

              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {selected ? planLabel(selected.days) : ''} reja jami
                </span>
                <span className="text-xl font-bold">
                  {formatPrice(
                    (codeMatchesApplied ? promoPreview.data?.finalAmount : undefined) ??
                      selected?.price ??
                      0
                  )}
                </span>
              </div>

              <Button
                size="lg"
                className="h-12 w-full rounded-md text-base font-semibold"
                onClick={handleCheckout}
                disabled={createPayment.isPending || !selected}
              >
                {createPayment.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crown className="size-4" />
                )}
                Premiumga o&apos;tish
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function BenefitsCard({
  title,
  benefits,
}: {
  title: string;
  benefits: {
    icon: 'diamond' | React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }[];
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-gold/40 bg-linear-to-b from-gold/10 to-transparent">
      <CardContent className="pt-5">
        <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold text-gold-foreground">
          <Crown className="size-4" /> {title}
        </h2>
        <ul className="mt-3.5 space-y-3">
          {benefits.map((benefit) => (
            <li key={benefit.label} className="flex items-center gap-2.5 text-sm font-medium">
              {benefit.icon === 'diamond' ? (
                <Image
                  src="/diamond.png"
                  alt=""
                  width={32}
                  height={32}
                  className="size-4 shrink-0"
                />
              ) : (
                <Check className="size-4 shrink-0 text-gold-foreground" />
              )}
              <span>
                {benefit.label} <span className="text-gold-foreground">— {benefit.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
