import {
  Bird,
  Bug,
  Cat,
  Crown,
  Dog,
  Fish,
  Flame,
  Ghost,
  Panda,
  Rabbit,
  Rocket,
  Snail,
  Squirrel,
  Star,
  Turtle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Ishtirokchi ismi yonidagi ikonka. Serverga faqat `key` yuboriladi —
// doska va telefon shu ro'yxatdan bir xil ikonka/rangni chizadi.
export const LIVE_AVATARS: { key: string; label: string; icon: LucideIcon; bg: string }[] = [
  { key: 'cat', label: 'Mushuk', icon: Cat, bg: 'bg-[#E8590C]' },
  { key: 'dog', label: 'Kuchuk', icon: Dog, bg: 'bg-[#9C6644]' },
  { key: 'rabbit', label: 'Quyon', icon: Rabbit, bg: 'bg-[#C2255C]' },
  { key: 'panda', label: 'Panda', icon: Panda, bg: 'bg-[#495057]' },
  { key: 'bird', label: 'Qush', icon: Bird, bg: 'bg-[#1971C2]' },
  { key: 'fish', label: 'Baliq', icon: Fish, bg: 'bg-[#0C8599]' },
  { key: 'turtle', label: 'Toshbaqa', icon: Turtle, bg: 'bg-[#2B8A3E]' },
  { key: 'squirrel', label: 'Olmaxon', icon: Squirrel, bg: 'bg-[#D9480F]' },
  { key: 'snail', label: 'Shilliqqurt', icon: Snail, bg: 'bg-[#862E9C]' },
  { key: 'bug', label: "Qo'ng'iz", icon: Bug, bg: 'bg-[#C92A2A]' },
  { key: 'rocket', label: 'Raketa', icon: Rocket, bg: 'bg-[#5F3DC4]' },
  { key: 'ghost', label: 'Arvoh', icon: Ghost, bg: 'bg-[#364FC7]' },
  { key: 'crown', label: 'Toj', icon: Crown, bg: 'bg-[#B07800]' },
  { key: 'star', label: 'Yulduz', icon: Star, bg: 'bg-[#E67700]' },
  { key: 'zap', label: 'Chaqmoq', icon: Zap, bg: 'bg-[#5C940D]' },
  { key: 'flame', label: 'Olov', icon: Flame, bg: 'bg-[#E03131]' },
];

export const DEFAULT_AVATAR = LIVE_AVATARS[0].key;

export function findAvatar(key?: string | null) {
  return key ? LIVE_AVATARS.find((a) => a.key === key) : undefined;
}

// Noma'lum yoki bo'sh kalit — hech narsa chizilmaydi (eski backend avatar yubormasa)
export function PlayerAvatar({ avatar, className }: { avatar?: string | null; className?: string }) {
  const item = findAvatar(avatar);
  if (!item) return null;
  const Icon = item.icon;
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-white',
        item.bg,
        className
      )}
      title={item.label}
    >
      <Icon className="size-[55%]" aria-hidden />
    </span>
  );
}

const STORAGE_KEY = 'live:avatar';

// Oxirgi tanlangan ikonka — keyingi o'yinda oldindan belgilanadi
export function readSavedAvatar() {
  try {
    const key = localStorage.getItem(STORAGE_KEY);
    return findAvatar(key) ? key! : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function saveAvatar(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // saqlab bo'lmasa — keyingi safar standart ikonka
  }
}
