'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera,
  CheckCircle2,
  Crown,
  KeyRound,
  Loader2,
  Send,
  ShieldCheck,
  Unlink,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusCard } from '@/components/layout/status-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/store/auth-store';
import {
  useChangePassword,
  useLinkTelegram,
  useUnlinkTelegram,
  useUpdateProfile,
  useUploadAvatar,
} from '@/hooks/use-users';
import { refreshCurrentUser } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api-client';
import { ROLE_LABELS } from '@/lib/roles';
import { resolveAssetUrl, TELEGRAM_BOT_USERNAME } from '@/lib/config';
import { daysUntil, formatDate, formatNumber, formatPrice, initials } from '@/lib/format';

const TELEGRAM_POLL_INTERVAL_MS = 2500;
const TELEGRAM_POLL_TIMEOUT_MS = 60_000;

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    confirmPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  });

const profileSchema = z.object({
  name: z.string().min(2, { error: "Ism kamida 2 ta belgidan iborat bo'lsin" }),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    newPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
    confirmPassword: z.string().min(6, { error: 'Kamida 6 ta belgi' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  });

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const linkTelegram = useLinkTelegram();
  const unlinkTelegram = useUnlinkTelegram();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const setPasswordForm = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const [telegramState, setTelegramState] = useState<'idle' | 'waiting' | 'timeout'>('idle');
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTelegramPolling() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollIntervalRef.current = null;
    pollTimeoutRef.current = null;
  }

  useEffect(() => stopTelegramPolling, []);

  function handleLinkTelegram() {
    linkTelegram.mutate(undefined, {
      onSuccess: ({ token, deepLink }) => {
        const finalLink = deepLink ?? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
        window.open(finalLink, '_blank');

        stopTelegramPolling();
        setTelegramState('waiting');
        pollIntervalRef.current = setInterval(async () => {
          await refreshCurrentUser();
          if (useAuthStore.getState().user?.telegramId) {
            stopTelegramPolling();
            setTelegramState('idle');
            toast.success('Telegram muvaffaqiyatli ulandi!');
          }
        }, TELEGRAM_POLL_INTERVAL_MS);
        pollTimeoutRef.current = setTimeout(() => {
          stopTelegramPolling();
          setTelegramState((s) => (s === 'waiting' ? 'timeout' : s));
        }, TELEGRAM_POLL_TIMEOUT_MS);
      },
    });
  }

  function handleUnlinkTelegram() {
    unlinkTelegram.mutate(undefined, {
      onError: (error) => {
        if (error instanceof ApiError && error.message.includes("parol o'rnating")) {
          setSetPasswordOpen(true);
        }
      },
    });
  }

  if (!user) return null;

  const premiumDaysLeft = user.premiumExpiresAt ? daysUntil(user.premiumExpiresAt) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Profil" description="Shaxsiy ma'lumotlaringizni boshqaring" />

      {user.role === 'student' && <StatusCard />}

      <Card className="overflow-hidden rounded-2xl border-none pt-0 shadow-md ring-1 ring-border/60">
        <div className="h-20 bg-linear-to-r from-primary via-primary/80 to-gold/50 sm:h-28" />
        <CardContent className="flex flex-col items-center gap-5 pt-0 sm:flex-row sm:gap-6">
          <div className="relative -mt-16 shrink-0 sm:-mt-24">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group/avatar relative block cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Profil rasmini o'zgartirish"
            >
              <Avatar
                size="xl"
                className="size-44 shadow-lg ring-4 ring-background transition-transform group-hover/avatar:scale-[1.03] sm:size-72"
              >
                <AvatarImage src={resolveAssetUrl(user.avatar)} alt={user.name} />
                <AvatarFallback className="text-5xl font-semibold sm:text-6xl">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              {/* <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <Camera className="size-7 text-white" />
              </span> */}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                const file = e.target.files?.[0];
                if (file) uploadAvatar.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {user.name}
            </h2>
            <p className="mt-1 text-base text-muted-foreground">{user.phone}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                {ROLE_LABELS[user.role]}
              </Badge>
              {user.tarif === 'premium' && (
                <Badge className="rounded-full bg-gold px-3 py-1 text-sm text-gold-foreground">
                  <ShieldCheck className="size-3.5" />
                  Premium
                  {user.premiumExpiresAt ? `: ${formatDate(user.premiumExpiresAt)} gacha` : ''}
                </Badge>
              )}
            </div>
            {user.tarif === 'premium' && premiumDaysLeft !== null && premiumDaysLeft <= 5 && (
              <Link
                href="/premium"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-foreground hover:underline"
              >
                <Crown className="size-4" />
                Muddat {premiumDaysLeft <= 0 ? 'tugadi' : `${premiumDaysLeft} kundan keyin tugaydi`}
                — Premiumni uzaytiring
              </Link>
            )}
          </div>
          {user.role === 'student' && (
            <div className="flex w-full gap-3 border-t pt-5 sm:w-auto sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
              <div className="flex-1 rounded-xl bg-gold/10 px-4 py-3 text-center ring-1 ring-gold/15 sm:flex-none">
                <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-gold-foreground">
                  <Image src="/diamond.png" alt="" width={32} height={32} className="size-5" />{' '}
                  {formatNumber(user.diamonds ?? 0)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">Olmoslar</p>
              </div>
              <div className="flex-1 rounded-xl bg-primary/10 px-4 py-3 text-center ring-1 ring-primary/15 sm:flex-none">
                <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-primary">
                  <Wallet className="size-5" /> {formatPrice(user.balance ?? 0)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">Hamyon</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* <Card>
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
      </Card> */}

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <KeyRound className="size-5" />
            </span>
            <div>
              <CardTitle className="text-lg">Parolni o&apos;zgartirish</CardTitle>
              <CardDescription className="text-sm">
                Xavfsizlik uchun kuchli parol tanlang
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit((values) => {
                changePassword.mutate(
                  { oldPassword: values.oldPassword, newPassword: values.newPassword },
                  { onSuccess: () => passwordForm.reset() }
                );
              })}
              className="grid gap-4 sm:grid-cols-3"
            >
              <FormField
                control={passwordForm.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Joriy parol</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
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
                    <FormLabel className="text-sm font-medium">Yangi parol</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
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
                    <FormLabel className="text-sm font-medium">Yangi parolni tasdiqlang</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="h-11 rounded-md px-6 text-base sm:col-span-3 sm:w-fit"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                Parolni yangilash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Send className="size-5" />
            </span>
            <div>
              <CardTitle className="text-lg">Telegram</CardTitle>
              <CardDescription className="text-sm">
                Ulasangiz, barcha bildirishnomalar (to&apos;lov, kursga yozilish, test natijasi,
                mukofot) Telegram botga ham keladi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user.telegramId ? (
            <div className="flex flex-col items-start justify-between gap-3 rounded-md bg-success/10 px-4 py-3 sm:flex-row sm:items-center">
              <span className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" />
                Telegram ulangan{user.telegramUsername ? ` (@${user.telegramUsername})` : ''}
              </span>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline" size="sm" className="rounded-lg" />}
                >
                  <Unlink className="size-4" /> Uzish
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Telegramni uzasizmi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Telegram orqali bildirishnomalar kelmay qo&apos;yadi. Davom etasizmi?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnlinkTelegram}>Uzish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : telegramState === 'waiting' ? (
            <div className="flex flex-col items-start gap-3 rounded-md bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Telegram botida ulanishni yakunlang, bu yerda avtomatik yangilanadi...
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  stopTelegramPolling();
                  setTelegramState('idle');
                }}
              >
                Bekor qilish
              </Button>
            </div>
          ) : telegramState === 'timeout' ? (
            <div className="flex flex-col items-start gap-3 rounded-md bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Ulanmadi, qayta urinib ko&apos;ring
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={handleLinkTelegram}
              >
                <Send className="size-4" /> Qayta urinish
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="h-11 rounded-md px-6 text-base"
              onClick={handleLinkTelegram}
              disabled={linkTelegram.isPending}
            >
              {linkTelegram.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Telegramni ulash
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <KeyRound className="size-4.5" />
              </span>
              Parol o&apos;rnating
            </DialogTitle>
            <DialogDescription className="text-sm">
              Telegram orqali ro&apos;yxatdan o&apos;tgansiz, sizda hali parol yo&apos;q. Telegramni
              uzishdan oldin parol o&apos;rnating — aks holda hisobingizga kira olmay qolasiz.
            </DialogDescription>
          </DialogHeader>
          <Form {...setPasswordForm}>
            <form
              onSubmit={setPasswordForm.handleSubmit((values) => {
                changePassword.mutate(
                  { newPassword: values.newPassword },
                  {
                    onSuccess: () => {
                      setPasswordForm.reset();
                      setSetPasswordOpen(false);
                      toast.success("Parol o'rnatildi. Endi Telegramni uzishingiz mumkin");
                    },
                  }
                );
              })}
              className="space-y-4"
            >
              <FormField
                control={setPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Yangi parol</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={setPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Parolni tasdiqlang</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-11 rounded-md text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 rounded-md px-6 text-base"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                  Parolni o&apos;rnatish
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
