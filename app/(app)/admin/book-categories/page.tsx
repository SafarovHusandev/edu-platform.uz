"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Library, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import {
  useBookCategories,
  useCreateBookCategory,
  useUpdateBookCategory,
  useDeleteBookCategory,
} from "@/hooks/use-book-categories"
import type { BookCategory } from "@/types"

const bookCategorySchema = z.object({
  name: z.string().min(2, { error: "Kamida 2 ta belgi" }),
  description: z.string().optional(),
  icon: z.string().optional(),
})

type BookCategoryFormValues = z.infer<typeof bookCategorySchema>

export default function AdminBookCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useBookCategories()
  const createCategory = useCreateBookCategory()
  const updateCategory = useUpdateBookCategory()
  const deleteCategory = useDeleteBookCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BookCategory | null>(null)

  const form = useForm<BookCategoryFormValues>({
    resolver: zodResolver(bookCategorySchema),
    defaultValues: { name: "", description: "", icon: "" },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ name: "", description: "", icon: "" })
    setDialogOpen(true)
  }

  function openEdit(category: BookCategory) {
    setEditing(category)
    form.reset({
      name: category.name,
      description: category.description ?? "",
      icon: category.icon ?? "",
    })
    setDialogOpen(true)
  }

  function onSubmit(values: BookCategoryFormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      icon: values.icon || undefined,
    }
    if (editing) {
      updateCategory.mutate({ id: editing._id, ...payload }, { onSuccess: () => setDialogOpen(false) })
    } else {
      createCategory.mutate(payload, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitob kategoriyalari"
        description="Kutubxona kategoriyalarini boshqaring"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Yangi kategoriya
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={6} itemClassName="h-24" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !categories || categories.length === 0 ? (
        <EmptyState icon={Library} title="Hali kategoriya qo'shilmagan" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category._id}>
              <CardContent className="flex items-start justify-between gap-3 pt-2">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                    {category.icon ? (
                      <Image src={category.icon} alt="" width={36} height={36} unoptimized className="size-full object-cover" />
                    ) : (
                      <Library className="size-4.5" />
                    )}
                  </span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Tahrirlash"
                    onClick={() => openEdit(category)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}>
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kategoriyani o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Kategoriyada kitoblar mavjud bo&apos;lsa, o&apos;chirilmaydi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCategory.mutate(category._id)}>
                          O&apos;chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoriya nomi</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon URL (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {(createCategory.isPending || updateCategory.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
