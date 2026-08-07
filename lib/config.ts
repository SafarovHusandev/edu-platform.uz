export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://server.maktab16.uz/api/v1';

export const ASSET_URL = process.env.NEXT_PUBLIC_ASSET_URL ?? 'https://server.maktab16.uz';

// Backend deepLink qaytarmagan holatlar uchun zaxira (bot username sozlanmagan bo'lsa)
export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'client_register_bot';

export function resolveAssetUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${ASSET_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// GET /books/:id/download faylni to'g'ridan-to'g'ri qaytaradi (JSON emas),
// shuning uchun lib/api-client orqali emas, oddiy link/window.open bilan ochiladi.
export function bookDownloadUrl(id: string) {
  return `${API_URL}/books/${id}/download`;
}
