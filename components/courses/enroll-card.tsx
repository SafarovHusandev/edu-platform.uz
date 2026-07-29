"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Users, Star, Loader2, CheckCircle2, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/store/auth-store"
import { useEnroll } from "@/hooks/use-enrollment"
import { useCreatePayment } from "@/hooks/use-payment"
import { usePromoPreview } from "@/hooks/use-promo-codes"
import { formatPrice, formatNumber } from "@/lib/format"
import { ROLE_HOME } from "@/lib/roles"
import type { Course } from "@/types"

export function EnrollCard({ course }: { course: Course }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const enroll = useEnroll()
  const createPayment = useCreatePayment()
  const [promoCode, setPromoCode] = useState("")
  const isPaid = course.price > 0
  const promoPreview = usePromoPreview({
    code: isPaid ? promoCode.trim() : undefined,
    purpose: "course",
    courseId: course._id,
  })

  function handleEnroll() {
    if (!user) {
      router.push(`/login?redirect=/courses/${course._id}`)
      return
    }

    if (!isPaid) {
      enroll.mutate(course._id, {
        onSuccess: () => router.push("/student/courses"),
      })
      return
    }

    createPayment.mutate(
      {
        purpose: "course",
        courseId: course._id,
        promoCode: promoCode.trim() || undefined,
        returnUrl: `${window.location.origin}/student/courses`,
      },
      {
        onSuccess: (invoice) => {
          if (invoice.checkoutUrl) {
            window.location.href = invoice.checkoutUrl
          } else {
            router.push(`/student/payment/${invoice.invoiceId}`)
          }
        },
      }
    )
  }

  const isPending = enroll.isPending || createPayment.isPending

  return (
    <Card className="sticky top-20">
      <CardContent className="flex flex-col gap-4 pt-2">
        <div className="flex items-baseline justify-between">
          <span className={course.price ? "text-2xl font-semibold" : "text-2xl font-semibold text-success"}>
            {promoPreview.data?.finalAmount !== undefined
              ? formatPrice(promoPreview.data.finalAmount)
              : formatPrice(course.price)}
          </span>
          {course.rating !== undefined && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-gold text-gold" />
              {course.rating.toFixed(1)} ({formatNumber(course.reviewsCount ?? 0)})
            </span>
          )}
        </div>

        {isPaid && (user?.role === "student" || !user) && (
          <div className="flex items-center gap-2">
            <Tag className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Promo kod (ixtiyoriy)"
              className="h-9"
            />
          </div>
        )}
        {isPaid && promoPreview.data?.discountPercent ? (
          <p className="-mt-2 text-xs text-success">
            {promoPreview.data.discountPercent}% chegirma qo&apos;llandi
          </p>
        ) : null}

        {user?.role === "student" || !user ? (
          <Button size="lg" className="h-11" onClick={handleEnroll} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {course.price ? "Sotib olish" : "Kursga yozilish"}
          </Button>
        ) : (
          <Button size="lg" className="h-11" render={<Link href={ROLE_HOME[user.role]} />} variant="outline">
            Boshqaruv paneliga o&apos;tish
          </Button>
        )}

        <Separator />

        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <BookOpen className="size-4" /> {course.lessonsCount ?? 0} ta dars
          </li>
          <li className="flex items-center gap-2">
            <Users className="size-4" /> {formatNumber(course.studentsCount ?? 0)} o&apos;quvchi
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-4" /> Kurs yakunida sertifikat
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
