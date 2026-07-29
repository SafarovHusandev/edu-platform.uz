"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Xatolik yuz berdi</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Kutilmagan xatolik ro&apos;y berdi. Iltimos, qaytadan urinib ko&apos;ring.
        </p>
      </div>
      <Button onClick={() => reset()}>Qayta urinish</Button>
    </div>
  )
}
