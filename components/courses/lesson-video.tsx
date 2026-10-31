'use client';

import { Video } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/config';

// YouTube havolasini embed ko'rinishiga o'giradi; boshqa manbalar uchun null
function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return `https://www.youtube.com/embed${parsed.pathname}`;
    if (parsed.hostname.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

// Yuklangan video fayllar (attachments) brauzerda pleyer bilan ochiladi
export const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|$)/i;

export function LessonVideo({ url }: { url: string }) {
  const embed = youtubeEmbedUrl(url);
  if (embed) {
    return (
      <iframe
        src={embed}
        title="Video dars"
        className="aspect-video w-full rounded-2xl bg-admin"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  // Serverga yuklangan fayl (POST /lessons/:id/video yoki material) — nisbiy yo'l
  if (isVideoFile(url) || !/^https?:\/\//i.test(url)) {
    return (
      <video
        src={resolveAssetUrl(url)}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className="aspect-video w-full rounded-2xl bg-admin"
      >
        Brauzeringiz videoni qo&apos;llab-quvvatlamaydi.
      </video>
    );
  }
  return (
    <a
      href={resolveAssetUrl(url)}
      target="_blank"
      rel="noreferrer"
      className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-admin text-admin-foreground"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-primary">
        <Video className="size-7" />
      </span>
      <span className="font-semibold">Videoni ochish</span>
    </a>
  );
}

export function isVideoFile(path: string) {
  return VIDEO_EXT.test(path);
}
