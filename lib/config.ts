export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://server.maktab16.uz/api/v1';

export const ASSET_URL = process.env.NEXT_PUBLIC_ASSET_URL ?? 'https://server.maktab16.uz';

export function resolveAssetUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${ASSET_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
