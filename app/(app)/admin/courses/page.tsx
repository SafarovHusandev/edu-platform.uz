"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCourses, useUpdateCourse, useDeleteCourse } from "@/hooks/use-courses"
import { formatPrice } from "@/lib/format"

const PAGE_SIZE = 15

export default function AdminCoursesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const { data, isLoading } = useCourses({ page, limit: PAGE_SIZE, search: search || undefined })
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Kurslar</h1>
        <p className="mt-1 text-muted-foreground">Platformadagi barcha kurslar</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Kurs nomi bo'yicha qidirish..."
          className="h-10 pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Kurs topilmadi</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kurs</TableHead>
                <TableHead>O&apos;qituvchi</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Narx</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((course) => {
                const teacher = typeof course.teacher === "object" ? course.teacher : undefined
                const category = typeof course.category === "object" ? course.category?.name : undefined
                return (
                  <TableRow key={course._id}>
                    <TableCell>
                      <Link href={`/courses/${course._id}`} className="font-medium hover:underline">
                        {course.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {course.studentsCount ?? 0} o&apos;quvchi · {course.lessonsCount ?? 0} dars
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{teacher?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{category ?? "—"}</TableCell>
                    <TableCell>{formatPrice(course.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={course.isPublished ?? false}
                          onCheckedChange={(checked) =>
                            updateCourse.mutate({ id: course._id, isPublished: checked })
                          }
                        />
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Nashr etilgan" : "Qoralama"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <Trash2 className="size-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Kursni o&apos;chirasizmi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{course.title}&quot; va unga bog&apos;liq darslar butunlay o&apos;chib
                              ketadi. Bu amalni bekor qilib bo&apos;lmaydi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCourse.mutate(course._id)}>
                              O&apos;chirish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Jami {data.total} ta kurs</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
