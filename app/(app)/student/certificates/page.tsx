'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Award, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DownloadCertificateButton } from '@/components/certificates/download-certificate-button';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useMyCertificates } from '@/hooks/use-certificates';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

// Sertifikat sarlavhasi uchun navbatma-navbat ranglar (dizayn: oltin / yashil)
const CERT_TONES = [
  {
    head: 'bg-gold-soft/60 border-gold/30',
    label: 'text-gold-foreground',
  },
  {
    head: 'bg-success-soft/60 border-success/25',
    label: 'text-success',
  },
];

async function copyVerifyLink(certificateNumber: string) {
  const url = `${window.location.origin}/certificates/verify/${encodeURIComponent(certificateNumber)}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Tekshirish havolasi nusxalandi');
  } catch {
    toast.error("Havolani nusxalab bo'lmadi");
  }
}

export default function StudentCertificatesPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useMyCertificates(1, 50);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Sertifikatlarim"
        actions={
          <Link href="/certificates/verify" className="font-semibold text-primary hover:underline">
            Sertifikatni tekshirish sahifasi →
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-[22px] bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Hali sertifikatlaringiz yo'q"
          description="Kursni yakunlab, birinchi sertifikatingizni oling!"
          action={
            <Button variant="outline" render={<Link href="/student/courses" />}>
              Kurslarimga o&apos;tish
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.items.map((certificate, index) => {
            const course = typeof certificate.course === 'object' ? certificate.course : null;
            const teacher = course && typeof course.teacher === 'object' ? course.teacher : null;
            const tone = CERT_TONES[index % CERT_TONES.length];
            return (
              <article
                key={certificate._id}
                className="overflow-hidden rounded-[22px] border border-border bg-card"
              >
                <div
                  className={cn(
                    'relative flex min-h-[170px] flex-col gap-2 border-b p-6 sm:p-7',
                    tone.head
                  )}
                >
                  <span className={cn('text-xs font-bold tracking-[0.14em]', tone.label)}>
                    SERTIFIKAT
                  </span>
                  <span className="max-w-[80%] font-heading text-xl font-bold leading-tight sm:text-2xl">
                    {course?.title ?? 'Kurs sertifikati'}
                  </span>
                  <span className="text-muted-foreground">
                    {[
                      user?.name,
                      formatDate(certificate.issuedAt),
                      teacher?.name ? `O'qituvchi: ${teacher.name}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <span
                    aria-hidden
                    className="absolute right-6 top-6 flex size-14 items-center justify-center rounded-full bg-gold"
                  >
                    <DiamondIcon className="size-7" />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 px-5 py-4">
                  <span className="min-w-0 flex-1 truncate font-heading text-[13px] text-muted-foreground">
                    {certificate.certificateNumber}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => copyVerifyLink(certificate.certificateNumber)}
                  >
                    <Link2 className="size-4" /> Havolani nusxalash
                  </Button>
                  <DownloadCertificateButton
                    certificateId={certificate._id}
                    fileName={`sertifikat-${certificate.certificateNumber}.pdf`}
                    label="PDF yuklab olish"
                    variant="default"
                    size="default"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
