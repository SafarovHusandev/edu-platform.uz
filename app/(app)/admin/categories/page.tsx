"use client"

import { useState } from "react"
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories"
import type { Category } from "@/types"

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", description: "" })

  function openCreate() {
    setEditing(null)
    setForm({ name: "", description: "" })
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setForm({ name: category.name, description: category.description ?? "" })
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    if (editing) {
      updateCategory.mutate(
        { id: editing._id, ...form },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      createCategory.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Kategoriyalar</h1>
          <p className="mt-1 text-muted-foreground">Kurs kategoriyalarini boshqaring</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Yangi kategoriya
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <FolderTree className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hali kategoriya qo&apos;shilmagan</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category._id}>
              <CardContent className="flex items-start justify-between gap-3 pt-2">
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(category)}>
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <Trash2 className="size-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Kategoriya nomi"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Textarea
              placeholder="Tavsif (ixtiyoriy)"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
