import { cn } from '@/lib/utils';

// Ishtirokchi ismi yonidagi ikonka. Serverga faqat `key` yuboriladi —
// doska va telefon shu ro'yxatdan bir xil rasm/rangni chizadi.
// Kalitlar backend bilan kelishilgan — o'zgartirilmaydi, faqat rasmi almashadi.
// Rasmlar: Microsoft Fluent Emoji 3D (MIT), public/avatars/live/ (LICENSE.txt shu yerda).
export const LIVE_AVATARS: { key: string; label: string; bg: string }[] = [
  { key: 'cat', label: 'Mushuk', bg: 'bg-[#E8590C]' },
  { key: 'dog', label: 'Kuchuk', bg: 'bg-[#9C6644]' },
  { key: 'rabbit', label: 'Quyon', bg: 'bg-[#C2255C]' },
  { key: 'panda', label: 'Panda', bg: 'bg-[#495057]' },
  { key: 'bird', label: "Jo'ja", bg: 'bg-[#1971C2]' },
  { key: 'fish', label: 'Baliq', bg: 'bg-[#0C8599]' },
  { key: 'turtle', label: 'Toshbaqa', bg: 'bg-[#2B8A3E]' },
  { key: 'squirrel', label: 'Olmaxon', bg: 'bg-[#D9480F]' },
  { key: 'snail', label: 'Shilliqqurt', bg: 'bg-[#862E9C]' },
  { key: 'bug', label: 'Xonqizi', bg: 'bg-[#C92A2A]' },
  { key: 'rocket', label: 'Raketa', bg: 'bg-[#5F3DC4]' },
  { key: 'ghost', label: 'Arvoh', bg: 'bg-[#364FC7]' },
  { key: 'crown', label: 'Toj', bg: 'bg-[#B07800]' },
  { key: 'star', label: 'Yulduz', bg: 'bg-[#E67700]' },
  { key: 'zap', label: 'Chaqmoq', bg: 'bg-[#5C940D]' },
  { key: 'flame', label: 'Olov', bg: 'bg-[#E03131]' },
  // 2-to'plam (yangi kalitlar — backend avatar ro'yxatini tekshirsa, unga ham qo'shilishi kerak)
  { key: 'lion', label: 'Sher', bg: 'bg-[#E67700]' },
  { key: 'tiger', label: "Yo'lbars", bg: 'bg-[#D9480F]' },
  { key: 'fox', label: 'Tulki', bg: 'bg-[#C2410C]' },
  { key: 'unicorn', label: 'Yakkashox', bg: 'bg-[#9C36B5]' },
  { key: 'penguin', label: 'Pingvin', bg: 'bg-[#1864AB]' },
  { key: 'koala', label: 'Koala', bg: 'bg-[#5C7080]' },
  { key: 'monkey', label: 'Maymun', bg: 'bg-[#8B5E34]' },
  { key: 'frog', label: 'Qurbaqa', bg: 'bg-[#2F9E44]' },
  { key: 'owl', label: 'Boyqush', bg: 'bg-[#6741D9]' },
  { key: 'dino', label: 'Dinozavr', bg: 'bg-[#087F5B]' },
  { key: 'dragon', label: 'Ajdar', bg: 'bg-[#C92A2A]' },
  { key: 'octopus', label: 'Sakkizoyoq', bg: 'bg-[#A61E4D]' },
  { key: 'dolphin', label: 'Delfin', bg: 'bg-[#0B7285]' },
  { key: 'butterfly', label: 'Kapalak', bg: 'bg-[#3B5BDB]' },
  { key: 'robot', label: 'Robot', bg: 'bg-[#495057]' },
  { key: 'alien', label: 'Musofir', bg: 'bg-[#5F3DC4]' },
];

// Birinchi 16 ta kalit — backend boshidan qabul qiladi. Yangilari rad etilsa,
// o'yinga kirish standart ikonka bilan qayta urinadi (app/live/page.tsx).
export const LEGACY_AVATAR_KEYS = new Set(LIVE_AVATARS.slice(0, 16).map((a) => a.key));

export const DEFAULT_AVATAR = LIVE_AVATARS[0].key;

export function avatarSrc(key: string) {
  return `/avatars/live/${key}.png`;
}

export function findAvatar(key?: string | null) {
  return key ? LIVE_AVATARS.find((a) => a.key === key) : undefined;
}

// Faqat rasmning o'zi (fonsiz) — tanlash tugmalari uchun
export function AvatarArt({ avatarKey, className }: { avatarKey: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarSrc(avatarKey)}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('pointer-events-none object-contain drop-shadow-sm select-none', className)}
    />
  );
}

// Noma'lum yoki bo'sh kalit — hech narsa chizilmaydi (eski backend avatar yubormasa)
export function PlayerAvatar({ avatar, className }: { avatar?: string | null; className?: string }) {
  const item = findAvatar(avatar);
  if (!item) return null;
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
        item.bg,
        className
      )}
      title={item.label}
    >
      <AvatarArt avatarKey={item.key} className="size-[72%]" />
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
