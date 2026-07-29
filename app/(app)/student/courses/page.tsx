"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMyEnrollments } from "@/hooks/use-enrollment"
import { resolveAssetUrl } from "@/lib/config"

export default function MyCoursesPage() {
  const { data, isLoading } = useMyEnrollments(1, 24)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Mening kurslarim</h1>
        <p className="mt-1 text-muted-foreground">Yozilgan kurslaringiz va o&apos;rganish jarayoni</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="font-medium">Hali hech qanday kursga yozilmagansiz</p>
          <Button render={<Link href="/courses" />}>Kurslarni ko&apos;rish</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((enrollment) => {
            const course = typeof enrollment.course === "object" ? enrollment.course : null
            if (!course) return null
            const thumbnail = resolveAssetUrl(course.thumbnail)
            return (
              <Link key={enrollment._id} href={`/student/courses/${enrollment._id}`}>
                <Card className="h-full py-0 transition-shadow hover:shadow-lg">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={course.title} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 to-accent/40">
                        <GraduationCap className="size-8 text-primary/50" />
                      </div>
                    )}
                    {enrollment.isCompleted && (
                      <Badge className="absolute right-2.5 top-2.5 bg-success text-success-foreground">
                        Yakunlangan
                      </Badge>
                    )}
                  </div>
                  <CardContent className="flex flex-col gap-3 pt-4">
                    <h3 className="line-clamp-2 text-sm font-semibold">{course.title}</h3>
                    <div>
                      <Progress value={enrollment.progress ?? 0} />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {Math.round(enrollment.progress ?? 0)}% bajarildi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
