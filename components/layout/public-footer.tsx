import Link from "next/link"
import { Logo } from "@/components/logo"
import { Container } from "@/components/layout/container"

const COLUMNS = [
  {
    title: "Platforma",
    links: [
      { label: "Kurslar", href: "/courses" },
      { label: "Reyting", href: "/leaderboard" },
      { label: "Sertifikat tekshirish", href: "/certificates/verify" },
      { label: "Homiylik", href: "/donate" },
    ],
  },
  {
    title: "Hisob",
    links: [
      { label: "Kirish", href: "/login" },
      { label: "Ro'yxatdan o'tish", href: "/register" },
    ],
  },
  {
    title: "Huquqiy",
    links: [
      { label: "Ommaviy oferta", href: "/oferta" },
      { label: "Maxfiylik siyosati", href: "/maxfiylik-siyosati" },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-5">
        <div className="sm:col-span-2 md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Zamonaviy o&apos;quv platformasi — kurslar, testlar, sertifikatlar va
            mukofotlar orqali bilim olishni qiziqarli qiling.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-border/60 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Edu Platform. Barcha huquqlar himoyalangan.</p>
          <p>edu-platform.uz</p>
        </Container>
      </div>
    </footer>
  )
}
