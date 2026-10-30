import { CertificateVerifyForm } from '@/components/certificates/certificate-verify-form';

// Sertifikat tekshirish sahifalarining umumiy qobig'i (edu-platform-dizayn: Verify)
export function VerifyShell({
  defaultValue,
  children,
}: {
  defaultValue?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pt-12 pb-16 sm:px-6">
      <div>
        <h1 className="font-heading text-3xl font-bold sm:text-[34px]">Sertifikatni tekshirish</h1>
        <p className="mt-2 text-muted-foreground">
          Sertifikat raqamini kiriting — haqiqiyligini ma&apos;lumotlar bazasidan darhol
          tasdiqlaymiz.
        </p>
      </div>
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        {/* key — boshqa raqamga o'tilganda maydon yangi qiymat bilan ochiladi */}
        <CertificateVerifyForm key={defaultValue} defaultValue={defaultValue} />
      </section>
      {children}
    </div>
  );
}
