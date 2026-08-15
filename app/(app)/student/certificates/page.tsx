"use client"

import { Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadCertificateButton } from "@/components/certificates/download-certificate-button"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import { useMyCertificates } from "@/hooks/use-certificates"
import { formatDate } from "@/lib/format"

export default function StudentCertificatesPage() {
  const { data, isLoading, isError, refetch } = useMyCertificates(1, 24)

  return (
    <div>
      <PageHeader title="Sertifikatlarim" description="Yakunlagan kurslaringiz uchun sertifikatlar" />

      {isLoading ? (
        <SkeletonCardGrid count={3} itemClassName="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Hali sertifikatlaringiz yo'q"
          description="Kursni yakunlab, birinchi sertifikatingizni oling!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((certificate) => {
            const course = typeof certificate.course === "object" ? certificate.course : null
            return (
              <Card key={certificate._id}>
                <CardContent className="flex flex-col gap-3 pt-2">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                    <Award className="size-5" />
                  </span>
                  <div>
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {course?.title ?? "Kurs sertifikati"}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      № {certificate.certificateNumber} · {formatDate(certificate.issuedAt)}
                    </p>
                  </div>
                  <DownloadCertificateButton certificateId={certificate._id} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
