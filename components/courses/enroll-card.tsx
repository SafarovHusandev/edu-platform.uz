'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseCover } from '@/components/courses/enrollment-card';
import { useAuthStore } from '@/store/auth-store';
import { useEnroll } from '@/hooks/use-enrollment';
import { useCreatePayment } from '@/hooks/use-payment';
import { usePromoPreview } from '@/hooks/use-promo-codes';
import { refreshCurrentUser } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/format';
import { ROLE_HOME } from '@/lib/roles';
import type { Course } from '@/types';

// Kurs sahifasining o'ng paneli (edu-platform-dizayn: Course)
export function EnrollCard({
  course,
  lessonsCount,
  quizzesCount,
}: {
  course: Course;
  lessonsCount: number;
  quizzesCount?: number;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const enroll = useEnroll();
  const createPayment = useCreatePayment();
  const [promoCode, setPromoCode] = useState('');
  const [useBalance, setUseBalance] = useState(false);
  const isPaid = course.price > 0;
  const canBuy = !user || user.role === 'student';
  const promoPreview = usePromoPreview({
    code: isPaid ? promoCode.trim() : undefined,
    purpose: 'course',
    courseId: course._id,
  });

  const price = promoPreview.data?.finalAmount ?? course.price;
  const balanceEnough = (user?.balance ?? 0) >= price;

  function handleEnroll() {
    if (!user) {
      router.push(`/login?redirect=/courses/${course._id}`);
      return;
    }
    if (!isPaid) {
      enroll.mutate(course._id, { onSuccess: () => router.push('/student/courses') });
      return;
    }
    const payWithBalance = useBalance && balanceEnough;
    createPayment.mutate(
      {
        purpose: 'course',
        courseId: course._id,
        promoCode: promoCode.trim() || undefined,
        useBalance: payWithBalance,
        returnUrl: payWithBalance ? undefined : `${window.location.origin}/student/courses`,
      },
      {
        onSuccess: async (invoice) => {
          if (invoice.paidWithBalance) {
            await refreshCurrentUser();
            toast.success('Kurs sotib olindi!');
            router.push('/student/courses');
          } else if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl;
          } else {
            router.push(`/student/payment/${invoice.invoiceId}`);
          }
        },
      }
    );
  }

  const isPending = enroll.isPending || createPayment.isPending;

  return (
    <aside className="overflow-hidden rounded-[22px] border border-border bg-card lg:sticky lg:top-24">
      <CourseCover
        course={course}
        index={0}
        className="h-44 items-center justify-center text-6xl"
      />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className={
              isPaid
                ? 'font-heading text-3xl font-bold'
                : 'font-heading text-3xl font-bold text-success'
            }
          >
            {isPaid ? formatPrice(price) : 'Bepul'}
          </span>
          {promoPreview.data?.discountPercent ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(course.price)}
            </span>
          ) : null}
        </div>

        {isPaid && canBuy && (
          <div className="flex flex-col gap-1.5">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Promokod (ixtiyoriy)"
              aria-label="Promokod"
              className="h-11"
            />
            {promoPreview.data?.discountPercent ? (
              <span className="text-[13px] font-semibold text-success">
                −{promoPreview.data.discountPercent}% chegirma qo&apos;llandi
              </span>
            ) : null}
          </div>
        )}

        {isPaid && user?.role === 'student' && (
          <label
            className={
              balanceEnough
                ? 'flex cursor-pointer items-center gap-2.5 text-sm'
                : 'flex items-center gap-2.5 text-sm text-muted-foreground'
            }
          >
            <input
              type="checkbox"
              checked={useBalance && balanceEnough}
              disabled={!balanceEnough}
              onChange={(e) => setUseBalance(e.target.checked)}
              className="size-4 accent-primary"
            />
            Hamyon balansidan to&apos;lash ({formatPrice(user.balance ?? 0)})
          </label>
        )}

        {canBuy ? (
          <Button
            size="lg"
            className="h-[52px] text-base"
            onClick={handleEnroll}
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPaid ? 'Sotib olish' : 'Yozilish'}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="h-[52px]"
            render={<Link href={ROLE_HOME[user!.role]} />}
          >
            Boshqaruv paneliga o&apos;tish
          </Button>
        )}

        {isPaid && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Multicard orqali yoki hamyon balansidan to&apos;lash mumkin.
          </p>
        )}

        <div className="h-px bg-border" />

        <ul className="flex flex-col gap-2.5 text-[15px]">
          <li className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            {lessonsCount} dars{quizzesCount ? `, ${quizzesCount} ta test` : ''}
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> Yakunda sertifikat
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> Darslar va testlardan olmos
          </li>
        </ul>
      </div>
    </aside>
  );
}
