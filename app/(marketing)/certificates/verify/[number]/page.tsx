import { Check, X } from 'lucide-react';
import { VerifyShell } from '@/components/certificates/verify-shell';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { CertificateVerifyResult } from '@/hooks/use-certificates';

interface PageProps {
  params: Promise<{ number: string }>;
}

async function getCertificate(number: string) {
  try {
    return await api.get<CertificateVerifyResult>(
      `/certificates/verify/${encodeURIComponent(number)}`,
      undefined,
      { skipAuth: true }
    );
  } catch {
    return null;
  }
}

export default async function CertificateVerifyResultPage({ params }: PageProps) {
  const { number: rawNumber } = await params;
  const number = decodeURIComponent(rawNumber);
  const result = await getCertificate(number);

  return (
    <VerifyShell defaultValue={number}>
      {result?.valid ? (
        <section
          role="status"
          className="overflow-hidden rounded-3xl border-[1.5px] border-success/40 bg-card"
        >
          <div className="flex items-center gap-2.5 bg-success-soft px-6 py-4 text-lg font-bold text-success">
            <span className="flex size-8 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check className="size-5" />
            </span>
            Sertifikat haqiqiy
          </div>
          <dl className="grid gap-4 p-6 sm:grid-cols-2">
            {[
              { label: 'Egasi', value: result.studentName },
              { label: 'Kurs', value: result.courseTitle },
              {
                label: 'Berilgan sana',
                value: result.issuedAt ? formatDate(result.issuedAt) : undefined,
              },
              { label: 'Raqam', value: result.certificateNumber ?? number, mono: true },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.label}>
                  <dt className="text-[13px] text-muted-foreground">{row.label}</dt>
                  <dd
                    className={row.mono ? 'mt-0.5 font-heading font-semibold' : 'mt-0.5 font-bold'}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ) : (
        <section
          role="status"
          className="flex items-start gap-3.5 rounded-3xl border-[1.5px] border-destructive/35 bg-destructive-soft p-5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-white">
            <X className="size-5" />
          </span>
          <div>
            <div className="font-bold text-destructive">Sertifikat topilmadi</div>
            <div className="mt-0.5 text-secondary-foreground">
              &quot;{number}&quot; raqamli sertifikat mavjud emas. Raqamni qayta tekshiring.
            </div>
          </div>
        </section>
      )}
    </VerifyShell>
  );
}
