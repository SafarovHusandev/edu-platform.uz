import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <div className="py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,white,transparent)] opacity-10"
          />
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Bugun bilim safariga qadam qo&apos;ying
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Bir necha daqiqada ro&apos;yxatdan o&apos;ting va sizga mos kurslarni
            kashf eting.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-7 h-11 px-6 text-base"
            render={<Link href="/register" />}
          >
            Bepul boshlash
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Container>
    </div>
  )
}
