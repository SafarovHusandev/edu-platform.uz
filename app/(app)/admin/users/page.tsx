"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, Pencil, Search, ShieldBan, ShieldCheck, Trash2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useUsers, useToggleUserBlock, useUpdateUser, useDeleteUser } from "@/hooks/use-users"
import { useAuthStore } from "@/store/auth-store"
import { ROLE_LABELS } from "@/lib/roles"
import { resolveAssetUrl } from "@/lib/config"
import { formatDateTime, formatRelativeTime, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Role, Tarif, User } from "@/types"

const PAGE_SIZE = 15
const ROLES: Role[] = ["student", "teacher", "admin", "superadmin"]
const TARIFS: Tarif[] = ["standart", "premium"]
const TARIF_LABELS: Record<Tarif, string> = { standart: "Standart", premium: "Premium" }
const GRADE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1))
const GRADE_LETTERS = ["A", "B", "C", "D", "E", "F"]

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const { data, isLoading } = useUsers({ page, limit: PAGE_SIZE, search: search || undefined })
  const toggleBlock = useToggleUserBlock()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const currentUser = useAuthStore((s) => s.user)
  const isSuperadmin = currentUser?.role === "superadmin"

  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "student" as Role,
    tarif: "standart" as Tarif,
    gradeNumber: "",
    gradeLetter: "",
  })

  function openEdit(user: User) {
    setEditing(user)
    setForm({
      name: user.name,
      phone: user.phone,
      role: user.role,
      tarif: user.tarif ?? "standart",
      gradeNumber: user.grade?.number ? String(user.grade.number) : "",
      gradeLetter: user.grade?.letter ?? "",
    })
  }

  function handleUpdateSubmit() {
    if (!editing) return
    if (!form.name.trim() || !form.phone.trim()) return
    if (form.role === "student" && (!form.gradeNumber || !form.gradeLetter)) return

    updateUser.mutate(
      {
        id: editing._id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        tarif: form.tarif,
        ...(form.role === "student"
          ? { grade: { number: Number(form.gradeNumber), letter: form.gradeLetter } }
          : {}),
      },
      { onSuccess: () => setEditing(null) }
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Foydalanuvchilar</h1>
        <p className="mt-1 text-muted-foreground">Barcha ro&apos;yxatdan o&apos;tgan foydalanuvchilar</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
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
          <Users className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Foydalanuvchi topilmadi</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Ro&apos;yxatdan o&apos;tgan</TableHead>
                <TableHead>Oxirgi kirish</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => {
                const isSelf = item._id === currentUser?._id
                return (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarImage src={resolveAssetUrl(item.avatar)} alt={item.name} />
                          <AvatarFallback>{initials(item.name)}</AvatarFallback>
                        </Avatar>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[item.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.isBlocked ? (
                        <Badge variant="destructive">Bloklangan</Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Faol</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" title={item.createdAt ? formatDateTime(item.createdAt) : undefined}>
                      {item.createdAt ? formatRelativeTime(item.createdAt) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-sm",
                        item.lastLogin ? "text-muted-foreground" : "text-muted-foreground/60 italic"
                      )}
                      title={item.lastLogin ? formatDateTime(item.lastLogin) : undefined}
                    >
                      {item.lastLogin ? formatRelativeTime(item.lastLogin) : "Hech qachon"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {isSuperadmin && (
                          <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => openEdit(item)}>
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                            {item.isBlocked ? (
                              <>
                                <ShieldCheck className="size-4" /> Blokdan chiqarish
                              </>
                            ) : (
                              <>
                                <ShieldBan className="size-4" /> Bloklash
                              </>
                            )}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {item.isBlocked
                                  ? `${item.name}ni blokdan chiqarasizmi?`
                                  : `${item.name}ni bloklaysizmi?`}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {item.isBlocked
                                  ? "Foydalanuvchi tizimga qayta kira oladi."
                                  : "Foydalanuvchi tizimga kira olmay qoladi."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  toggleBlock.mutate({ id: item._id, isBlocked: !item.isBlocked })
                                }
                              >
                                Tasdiqlash
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {isSuperadmin && !isSelf && (
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={<Button variant="ghost" size="icon-sm" aria-label="O'chirish" />}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {item.name}ni butunlay o&apos;chirmoqchimisiz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu amalni orqaga qaytarib bo&apos;lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser.mutate(item._id)}>
                                  O&apos;chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Jami {data.total} ta foydalanuvchi
            </p>
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Ism</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="998901234567"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, role: v as Role }))}
                  items={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tarif</Label>
                <Select
                  value={form.tarif}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, tarif: v as Tarif }))}
                  items={TARIFS.map((t) => ({ value: t, label: TARIF_LABELS[t] }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARIFS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TARIF_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Sinf</Label>
                  <Select
                    value={form.gradeNumber}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, gradeNumber: v ?? "" }))}
                    items={GRADE_NUMBERS.map((n) => ({ value: n, label: n }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Raqam" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_NUMBERS.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Guruh</Label>
                  <Select
                    value={form.gradeLetter}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, gradeLetter: v ?? "" }))}
                    items={GRADE_LETTERS.map((l) => ({ value: l, label: l }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Harf" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LETTERS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSubmit} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="size-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
