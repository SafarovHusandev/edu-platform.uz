import Link from "next/link"
import { ArrowRight, FolderOpen } from "lucide-react"
import { Hero } from "@/components/marketing/hero"
import { RoleShowcase } from "@/components/marketing/role-showcase"
import { GamificationSection } from "@/components/marketing/gamification-section"
import { CtaSection } from "@/components/marketing/cta-section"
import { Container } from "@/components/layout/container"
import { CourseCard } from "@/components/courses/course-card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import type { Category, Course, Paginated } from "@/types"

async function getLandingData() {
  const [categories, courses] = await Promise.all([
    api
      .get<Paginated<Category>>("/categories", { limit: 100 }, { skipAuth: true })
      .then((res) => res.items)
      .catch(() => [] as Category[]),
    api
      .get<Paginated<Course>>("/courses", { page: 1, limit: 8 }, { skipAuth: true })
      .catch(() => null),
  ])

  return { categories, courses: courses?.items ?? [] }
}

export default async function HomePage() {
  const { categories, courses } = await getLandingData()

  return (
    <>
      <Hero />

      {categories.length > 0 && (
        <div className="border-b border-border/60 py-16">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Kategoriyalar bo&apos;yicha o&apos;rganing
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Sizga qiziq bo&apos;lgan sohani tanlang
                </p>
              </div>
              <Button variant="ghost" render={<Link href="/courses" />} className="hidden sm:flex">
                Barchasi <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category._id}
                  href={`/courses?category=${category._id}`}
                  className="group flex flex-col gap-3 rounded-xl border border-border p-5 transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <FolderOpen className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </div>
      )}

      {courses.length > 0 && (
        <div className="border-b border-border/60 py-16">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ommabop kurslar
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Eng so&apos;nggi qo&apos;shilgan kurslarni ko&apos;ring
                </p>
              </div>
              <Button variant="ghost" render={<Link href="/courses" />} className="hidden sm:flex">
                Barchasi <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </Container>
        </div>
      )}

      <RoleShowcase />
      <GamificationSection />
      <CtaSection />
    </>
  )
}
