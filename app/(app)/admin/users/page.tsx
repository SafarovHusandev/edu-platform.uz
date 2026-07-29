"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, ShieldBan, ShieldCheck, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useUsers, useToggleUserBlock } from "@/hooks/use-users"
import { ROLE_LABELS } from "@/lib/roles"
import { resolveAssetUrl } from "@/lib/config"
import { initials } from "@/lib/format"

const PAGE_SIZE = 15

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const { data, isLoading } = useUsers({ page, limit: PAGE_SIZE, search: search || undefined })
  const toggleBlock = useToggleUserBlock()

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
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
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
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="outline" size="sm" />}
                      >
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
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  )
}
