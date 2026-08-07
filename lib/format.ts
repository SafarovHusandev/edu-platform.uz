// Backend barcha pul summalarini tiyinda saqlaydi/qaytaradi (1 so'm = 100 tiyin,
// Multicard bilan bir xil birlik). formatPrice shu qiymatlarni to'g'ridan-to'g'ri
// qabul qiladi va so'mga o'girib ko'rsatadi.
export function toTiyin(som: number) {
  return Math.round(som * 100);
}

export function fromTiyin(tiyin: number) {
  return tiyin / 100;
}

export function formatPrice(tiyinValue: number) {
  if (!tiyinValue) return 'Bepul';
  return `${new Intl.NumberFormat('uz-UZ').format(fromTiyin(tiyinValue))} so'm`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('uz-UZ').format(value);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// "01.01.2026"
export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

// "10:10 01.01.2026"
export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function formatRelativeTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Hozirgina';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kecha';
  if (diffDay < 7) return `${diffDay} kun oldin`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} hafta oldin`;
  return formatDate(date);
}

const TASHKENT_TZ = 'Asia/Tashkent';

// datetime-local input qiymati ("2026-08-10T09:00", Toshkent devor vaqti) ->
// backend kutgan ISO8601+offset format. Date.toISOString() ISHLATILMAYDI —
// u UTC'ga o'giradi va Toshkent vaqtini noto'g'ri suradi.
export function tashkentLocalToIso(localValue: string) {
  return `${localValue}:00+05:00`;
}

// ISO satr (istalgan offset bilan) -> datetime-local input uchun Toshkent
// devor vaqti qiymati ("2026-08-10T09:00").
export function isoToTashkentLocal(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TASHKENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// Ko'rsatish uchun: "10:10 01.01.2026" (har doim Toshkent vaqtida, ko'ruvchi brauzeridan qat'i nazar)
export function formatTashkentDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TASHKENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('hour')}:${get('minute')} ${get('day')}.${get('month')}.${get('year')}`;
}

// 500 -> "8 daqiqa 20 soniya", 45 -> "45 soniya"
export function formatDuration(durationSeconds: number | null | undefined) {
  if (durationSeconds == null) return null;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return minutes > 0 ? `${minutes} daqiqa ${seconds} soniya` : `${seconds} soniya`;
}

export function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
