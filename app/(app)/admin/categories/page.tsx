"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories"
import type { Category } from "@/types"

const categorySchema = z.object({
  name: z.string().min(2, { error: "Kamida 2 ta belgi" }),
  description: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ name: "", description: "" })
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    form.reset({ name: category.name, description: category.description ?? "" })
    setDialogOpen(true)
  }

  function onSubmit(values: CategoryFormValues) {
    if (editing) {
      updateCategory.mutate({ id: editing._id, ...values }, { onSuccess: () => setDialogOpen(false) })
    } else {
      createCategory.mutate(values, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div>
      <PageHeader
        title="Kategoriyalar"
        description="Kurs kategoriyalarini boshqaring"
        actions={
          <Button onClick={openCreate} size="lg" className="h-10 rounded-md px-5 shadow-sm">
            <Plus className="size-4" /> Yangi kategoriya
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCardGrid count={6} itemClassName="h-24 rounded-md" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !categories || categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="Hali kategoriya qo'shilmagan" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category._id}
              className="rounded-md shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-start gap-3 pt-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FolderTree className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{category.name}</h3>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-md"
                    aria-label="Tahrirlash"
                    onClick={() => openEdit(category)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md"
                          aria-label="O'chirish"
                        />
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kategoriyani o&apos;chirasizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu amalni bekor qilib bo&apos;lmaydi.
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
        <DialogContent className="rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FolderTree className="size-4.5" />
              </span>
              {editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Kurslarni guruhlash uchun kategoriya nomi va tavsifini kiriting
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Kategoriya nomi</FormLabel>
                    <FormControl>
                      <Input className="h-11 rounded-md text-base" {...field} />
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
                    <FormLabel className="text-sm font-medium">Tavsif (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea className="rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full rounded-md text-base sm:w-fit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
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
