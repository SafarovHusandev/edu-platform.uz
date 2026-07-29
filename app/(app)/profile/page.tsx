"use client"

import { useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera, Gem, Loader2, ShieldCheck, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuthStore } from "@/store/auth-store"
import { useChangePassword, useUpdateProfile, useUploadAvatar } from "@/hooks/use-users"
import { ROLE_LABELS } from "@/lib/roles"
import { resolveAssetUrl } from "@/lib/config"
import { formatNumber, formatPrice, initials } from "@/lib/format"

const profileSchema = z.object({
  name: z.string().min(2, { error: "Ism kamida 2 ta belgidan iborat bo'lsin" }),
})

const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, { error: "Kamida 6 ta belgi" }),
    newPassword: z.string().min(6, { error: "Kamida 6 ta belgi" }),
    confirmPassword: z.string().min(6, { error: "Kamida 6 ta belgi" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  })

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "" },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  })

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-muted-foreground">Shaxsiy ma&apos;lumotlaringizni boshqaring</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
          <div className="relative">
            <Avatar size="lg" className="size-20">
              <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
              <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
              aria-label="Rasm yuklash"
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadAvatar.mutate(file)
                e.target.value = ""
              }}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
              {user.tarif === "premium" && (
                <Badge className="bg-gold text-gold-foreground">
                  <ShieldCheck /> Premium
                </Badge>
              )}
            </div>
          </div>
          {user.role === "student" && (
            <div className="flex gap-4 border-t pt-4 text-sm sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 font-semibold text-gold-foreground">
                  <Gem className="size-4 text-gold" /> {formatNumber(user.diamonds ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Olmoslar</p>
              </div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 font-semibold">
                  <Wallet className="size-4" /> {formatPrice(user.balance ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Hamyon</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shaxsiy ma&apos;lumotlar</CardTitle>
          <CardDescription>Ismingizni yangilang</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>To&apos;liq ism</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                Saqlash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parolni o&apos;zgartirish</CardTitle>
          <CardDescription>Xavfsizlik uchun kuchli parol tanlang</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit((values) => {
                changePassword.mutate(
                  { oldPassword: values.oldPassword, newPassword: values.newPassword },
                  { onSuccess: () => passwordForm.reset() }
                )
              })}
              className="grid gap-4 sm:grid-cols-3"
            >
              <FormField
                control={passwordForm.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joriy parol</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yangi parol</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yangi parolni tasdiqlang</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="sm:col-span-3 sm:w-fit" disabled={changePassword.isPending}>
                {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                Parolni yangilash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
