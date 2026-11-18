import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveAssetUrl } from '@/lib/config';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RosterStudent } from '@/lib/class-roster';

// Doska uchun o'quvchi avatari: rasm bo'lmasa — ism bosh harflari
export function StudentAvatar({
  student,
  className,
  fallbackClassName,
}: {
  student: RosterStudent;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={cn('size-8 after:hidden', className)}>
      {student.avatar && <AvatarImage src={resolveAssetUrl(student.avatar)} alt="" />}
      <AvatarFallback className={cn('bg-white/20 font-bold text-white', fallbackClassName)}>
        {initials(student.name)}
      </AvatarFallback>
    </Avatar>
  );
}
