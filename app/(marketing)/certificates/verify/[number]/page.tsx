import Link from "next/link"
import { BadgeCheck, XCircle, ArrowLeft } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { formatDate } from "@/lib/format"

interface PageProps {
  params: Promise<{ number: string }>
}

interface VerifyResult {
  valid: boolean
  studentName?: string
  courseTitle?: string
  issuedAt?: string
  certificateNumber?: string
}

async function getCertificate(number: string) {
  try {
    return await api.get<VerifyResult>(
      `/certificates/verify/${encodeURIComponent(number)}`,
      undefined,
      { skipAuth: true }
    )
  } catch {
    return null
  }
}

export default async function CertificateVerifyResultPage({ params }: PageProps) {
  const { number } = await params
  const result = await getCertificate(number)
  const isValid = result?.valid ?? false

  return (
    <Container className="flex flex-col items-center py-20 text-center">
      {isValid ? (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 pt-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success">
              <BadgeCheck className="size-7" />
            </span>
            <h1 className="font-heading text-2xl font-semibold">Sertifikat tasdiqlandi</h1>
            <p className="text-sm text-muted-foreground">№ {result?.certificateNumber}</p>
            <div className="mt-4 w-full space-y-2 rounded-lg bg-muted/50 p-4 text-left text-sm">
              {result?.studentName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">O&apos;quvchi</span>
                  <span className="font-medium">{result.studentName}</span>
                </div>
              )}
              {result?.courseTitle && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Kurs</span>
                  <span className="text-right font-medium">{result.courseTitle}</span>
                </div>
              )}
              {result?.issuedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Berilgan sana</span>
                  <span className="font-medium">{formatDate(result.issuedAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 pt-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <XCircle className="size-7" />
            </span>
            <h1 className="font-heading text-2xl font-semibold">Sertifikat topilmadi</h1>
            <p className="text-sm text-muted-foreground">
              &quot;{number}&quot; raqamli sertifikat mavjud emas yoki noto&apos;g&apos;ri
              kiritildi.
            </p>
          </CardContent>
        </Card>
      )}
      <Button variant="ghost" className="mt-6" render={<Link href="/certificates/verify" />}>
        <ArrowLeft className="size-4" /> Qayta tekshirish
      </Button>
    </Container>
  )
}
