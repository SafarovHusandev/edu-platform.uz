'use client';

import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLogout } from '@/hooks/use-auth';

// "Chiqish" tasdig'i: sidebar va foydalanuvchi menyusi uchun umumiy.
// Boshqariladigan (open/onOpenChange) — dropdown yopilganda ham modal ochiq qoladi.
export function LogoutConfirmDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const logout = useLogout();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // So'rov ketayotganda modal yopilib qolmasin
        if (!logout.isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive-soft text-destructive">
            <LogOut />
          </AlertDialogMedia>
          <AlertDialogTitle>Tizimdan chiqasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Platformadan foydalanish uchun hisobingizga qayta kirishingiz kerak bo&apos;ladi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={logout.isPending}>Bekor qilish</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSettled: () => onOpenChange(false) })}
          >
            {logout.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Chiqish
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
