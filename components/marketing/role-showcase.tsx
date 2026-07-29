import {
  GraduationCap,
  Presentation,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ROLES = [
  {
    icon: GraduationCap,
    title: "O'quvchi",
    description: "Kurslarni o'rganing, testdan o'ting va mukofot yig'ing.",
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
    points: [
      "Foydalanuvchilar va kategoriyalarni boshqarish",
      "Mukofotlar va promo kodlarni sozlash",
      "Yutuqlarni tasdiqlash va yetkazib berish",
      "Platforma bo'ylab to'liq nazorat",
    ],
  },
]

export function RoleShowcase() {
  return (
    <div className="border-b border-border/60 bg-muted/30 py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Har bir rol uchun alohida tajriba
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tizimga kirganingizdan so&apos;ng, platforma sizning rolingizga mos
            boshqaruv panelini avtomatik taqdim etadi.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {ROLES.map((role) => (
            <Card key={role.title} className="h-full">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <role.icon className="size-5" />
                </span>
                <CardTitle className="mt-3 text-lg">{role.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  )
}
