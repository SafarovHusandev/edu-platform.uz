"use client"

import { Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadCertificateButton } from "@/components/certificates/download-certificate-button"
import { useMyCertificates } from "@/hooks/use-certificates"
import { formatDate } from "@/lib/format"

export default function StudentCertificatesPage() {
  const { data, isLoading } = useMyCertificates(1, 24)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sertifikatlarim</h1>
        <p className="mt-1 text-muted-foreground">Yakunlagan kurslaringiz uchun sertifikatlar</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <Award className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Hali sertifikatlaringiz yo&apos;q. Kursni yakunlab, birinchi sertifikatingizni oling!
          </p>
        </div>
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
