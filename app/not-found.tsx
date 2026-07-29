import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-7" />
      </span>
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">404</h1>
        <p className="mt-2 text-muted-foreground">
          Siz izlagan sahifa topilmadi yoki ko&apos;chirilgan.
        </p>
      </div>
      <Button render={<Link href="/" />}>Bosh sahifaga qaytish</Button>
    </div>
  )
}
