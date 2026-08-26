import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"

const display = Bricolage_Grotesque({
  variable: "--font-marketing-display",
  subsets: ["latin", "latin-ext"],
})

const body = Plus_Jakarta_Sans({
  variable: "--font-marketing-body",
  subsets: ["latin", "latin-ext"],
})

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} flex min-h-svh flex-col`}
      style={
        {
          "--font-sans": "var(--font-marketing-body)",
          "--font-heading": "var(--font-marketing-display)",
        } as React.CSSProperties
      }
    >
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
