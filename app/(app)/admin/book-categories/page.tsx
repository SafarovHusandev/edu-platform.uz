"use client"

import { useState } from "react"
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
import {
  useBookCategories,
  useCreateBookCategory,
  useUpdateBookCategory,
  useDeleteBookCategory,
} from "@/hooks/use-book-categories"
import type { BookCategory } from "@/types"

export default function AdminBookCategoriesPage() {
  const { data: categories, isLoading } = useBookCategories()
  const createCategory = useCreateBookCategory()
  const updateCategory = useUpdateBookCategory()
  const deleteCategory = useDeleteBookCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BookCategory | null>(null)
  const [form, setForm] = useState({ name: "", description: "", icon: "" })

  function openCreate() {
    setEditing(null)
    setForm({ name: "", description: "", icon: "" })
    setDialogOpen(true)
  }

  function openEdit(category: BookCategory) {
    setEditing(category)
    setForm({
      name: category.name,
      description: category.description ?? "",
      icon: category.icon ?? "",
    })
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    const payload = {
      name: form.name,
      description: form.description || undefined,
      icon: form.icon || undefined,
    }
    if (editing) {
      updateCategory.mutate(
        { id: editing._id, ...payload },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      createCategory.mutate(payload, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Kitob kategoriyalari
          </h1>
          <p className="mt-1 text-muted-foreground">Kutubxona kategoriyalarini boshqaring</p>
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
          <Library className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Hali kategoriya qo&apos;shilmagan</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category._id}>
              <CardContent className="flex items-start justify-between gap-3 pt-2">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                    {category.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={category.icon} alt="" className="size-full object-cover" />
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
            <Input
              placeholder="Icon URL (ixtiyoriy)"
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
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
