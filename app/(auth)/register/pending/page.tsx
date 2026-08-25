"use client"

import Link from "next/link"
import { Hourglass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function RegisterPendingPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Hourglass className="size-7" />
        </span>
        <CardTitle className="text-xl">Hisobingiz tasdiqlanishi kutilmoqda</CardTitle>
        <CardDescription>
          Ro&apos;yxatdan muvaffaqiyatli o&apos;tdingiz. Administrator hisobingizni tasdiqlagach
          tizimga kira olasiz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" render={<Link href="/login" />}>
          Kirish sahifasiga qaytish
        </Button>
      </CardContent>
    </Card>
  )
}
