import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
