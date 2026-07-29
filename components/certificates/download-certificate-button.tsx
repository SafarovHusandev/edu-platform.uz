"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { API_URL } from "@/lib/config"
import { getTokenCookie } from "@/lib/cookies"

export function DownloadCertificateButton({
  certificateId,
  fileName,
}: {
  certificateId: string
  fileName?: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const token = getTokenCookie()
      const res = await fetch(`${API_URL}/certificates/${certificateId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error("Yuklab olishda xatolik")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName ?? `sertifikat-${certificateId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Sertifikatni yuklab olishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Yuklab olish
    </Button>
  )
}
