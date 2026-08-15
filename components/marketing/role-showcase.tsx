import {
  GraduationCap,
  Presentation,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ROLE_ACCENTS = {
  primary: {
    border: "border-t-primary",
    badge: "bg-primary/10 text-primary",
    check: "text-primary",
    glow: "bg-primary/15",
  },
  gold: {
    border: "border-t-gold",
    badge: "bg-gold/15 text-gold-foreground",
    check: "text-gold-foreground",
    glow: "bg-gold/20",
  },
  success: {
    border: "border-t-success",
    badge: "bg-success/15 text-success",
    check: "text-success",
    glow: "bg-success/15",
  },
} as const

const ROLES = [
  {
    icon: GraduationCap,
    title: "O'quvchi",
    description: "Kurslarni o'rganing, testdan o'ting va mukofot yig'ing.",
    accent: "primary",
    points: [
      "Kurslarga yozilish va darslarni bosqichma-bosqich o'rganish",
      "Interaktiv testlar va natijalarni kuzatish",
      "Olmoslar to'plab mukofotlarga almashtirish",
      "Sertifikat yuklab olish va reytingda ko'rinish",
    ],
  },
  {
    icon: Presentation,
    title: "O'qituvchi",
    description: "Kurs va testlar yarating, o'quvchilar rivojini kuzating.",
    accent: "gold",
    points: [
      "Kurs, dars va materiallarni boshqarish",
      "Test va savollar bankini tuzish",
      "O'quvchilar natijalarini baholash",
      "Statistika va daromad hisobotlari",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Administrator",
    description: "Platformani nazorat qiling va o'sishni ta'minlang.",
    accent: "success",
    points: [
      "Foydalanuvchilar va kategoriyalarni boshqarish",
      "Mukofotlar va promo kodlarni sozlash",
      "Yutuqlarni tasdiqlash va yetkazib berish",
      "Platforma bo'ylab to'liq nazorat",
    ],
  },
] as const

export function RoleShowcase() {
  return (
    <div className="border-b border-border/60 bg-muted/30 py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Rollar
          </p>
          <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Har bir rol uchun alohida tajriba
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tizimga kirganingizdan so&apos;ng, platforma sizning rolingizga mos
            boshqaruv panelini avtomatik taqdim etadi.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {ROLES.map((role) => {
            const accent = ROLE_ACCENTS[role.accent]
            return (
              <Card
                key={role.title}
                className={cn(
                  "h-full border-t-4 py-0 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg",
                  accent.border
                )}
              >
                <CardHeader className="pt-6">
                  <span className="relative flex size-11 items-center justify-center rounded-xl">
                    <span
                      className={cn(
                        "absolute inset-0 rounded-xl blur-md",
                        accent.glow
                      )}
                    />
                    <span
                      className={cn(
                        "relative flex size-11 items-center justify-center rounded-xl",
                        accent.badge
                      )}
                    >
                      <role.icon className="size-5" />
                    </span>
                  </span>
                  <CardTitle className="mt-3 text-lg">{role.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardHeader>
                <CardContent className="pb-6">
                  <ul className="space-y-2.5">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className={cn("mt-0.5 size-4 shrink-0", accent.check)}
                        />
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
