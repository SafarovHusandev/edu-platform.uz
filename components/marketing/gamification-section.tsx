import Link from "next/link"
import { Gem, Trophy, Gift, Award } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const ITEMS = [
  {
    icon: Gem,
    title: "Olmoslar",
    description: "Har bir tugatilgan dars uchun olmos qo'lga kiriting.",
  },
  {
    icon: Gift,
    title: "Mukofotlar",
    description: "To'plangan olmoslarni real sovg'alarga almashtiring.",
  },
  {
    icon: Trophy,
    title: "Reyting",
    description: "Eng faol o'quvchilar orasida top o'rinlarni egallang.",
  },
  {
    icon: Award,
    title: "Sertifikatlar",
    description: "Kursni yakunlab, tasdiqlangan sertifikat oling.",
  },
]

export function GamificationSection() {
  return (
    <div className="border-b border-border/60 py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            O&apos;rganish qiziqarli bo&apos;lishi kerak
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Gamifikatsiya orqali o&apos;quv jarayonini o&apos;yinga aylantiramiz —
            har bir qadam mukofotlanadi.
          </p>
          <Button className="mt-6" render={<Link href="/register" />}>
            Hoziroq boshlash
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {ITEMS.map((item) => (
            <Card key={item.title} className="bg-muted/40">
              <CardContent className="flex flex-col gap-2 pt-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-gold/20 text-gold-foreground">
                  <item.icon className="size-4.5" />
                </span>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  )
}
