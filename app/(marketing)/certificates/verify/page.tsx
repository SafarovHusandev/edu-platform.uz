"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Search } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CertificateVerifyPage() {
  const router = useRouter()
  const [value, setValue] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    router.push(`/certificates/verify/${encodeURIComponent(value.trim())}`)
  }

  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck className="size-7" />
      </span>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Sertifikatni tekshirish
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Sertifikat raqamini kiriting va uning haqiqiyligini bir zumda
        tasdiqlang.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-sm gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Sertifikat raqami"
          className="h-11"
        />
        <Button type="submit" size="lg" className="h-11">
          <Search className="size-4" />
          Tekshirish
        </Button>
      </form>
    </Container>
  )
}
