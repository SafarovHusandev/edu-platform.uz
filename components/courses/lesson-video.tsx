'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCw, Video, VideoOff } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/config';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { getTokenCookie } from '@/lib/cookies';
import type { Lesson } from '@/types';

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

export function isVideoFile(path: string) {
  return VIDEO_EXT.test(path);
}

// Dars fayllari imzolangan havola bilan keladi:
// /api/v1/media/lessons/<fayl>?exp=...&uid=...&sig=... (10 daqiqa amal qiladi).
// Imzo har so'rovda o'zgaradi, shuning uchun faylni imzosiz yo'li bo'yicha taniymiz.
export function mediaKey(url: string) {
  return url.split('?')[0];
}

// Havoladan foydalanuvchiga ko'rsatiladigan fayl nomi (imzosiz, decode qilingan)
export function mediaFileName(url: string) {
  const last = mediaKey(url).split('/').pop() ?? url;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export function mediaExtension(url: string) {
  const name = mediaFileName(url);
  return name.includes('.') ? (name.split('.').pop() ?? '').toUpperCase().slice(0, 4) : '';
}

// Suv belgisi joylari (foizda); har WATERMARK_MOVE_MS da tasodifiy biriga ko'chadi
const WATERMARK_SPOTS = [
  { top: 8, left: 6 },
  { top: 8, left: 58 },
  { top: 42, left: 30 },
  { top: 70, left: 6 },
  { top: 70, left: 55 },
  { top: 25, left: 70 },
  { top: 55, left: 12 },
];
const WATERMARK_MOVE_MS = 6_000;

// O'quvchi ma'lumotli harakatlanuvchi suv belgisi: ekrandan yozilgan video
// tarqalsa, kim yozgani bilinadi. Faylni yuklab olishdan himoya qilmaydi —
// bu backenddagi imzolangan havolalar vazifasi.
function VideoWatermark() {
  const user = useAuthStore((s) => s.user);
  const [spot, setSpot] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpot((prev) => {
        let next = Math.floor(Math.random() * WATERMARK_SPOTS.length);
        if (next === prev) next = (next + 1) % WATERMARK_SPOTS.length;
        return next;
      });
    }, WATERMARK_MOVE_MS);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;
  const position = WATERMARK_SPOTS[spot];
  const label = `${user.name} · ID ${user._id.slice(-6)}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 max-w-[60%] select-none truncate text-sm font-semibold text-white/45 transition-all duration-1000 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)] sm:text-base"
      style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
      {label}
    </div>
  );
}

const MAX_VIDEO_RETRIES = 3;

function videoErrorText(status: number | null) {
  if (status === 403) return 'Havola rad etildi (403) — kirish huquqi yoki imzo muddati muammosi.';
  if (status === 404) return 'Video fayl serverda topilmadi (404).';
  if (status === 0) return "Serverga ulanib bo'lmadi — internetni tekshiring.";
  if (status && status >= 200 && status < 300)
    return "Fayl keldi, lekin brauzer uni o'ynata olmadi — video formati qo'llab-quvvatlanmaydi.";
  if (status) return `Server xatosi (${status}).`;
  return 'Sabab aniqlanmoqda...';
}

// Yuklangan video uchun pleyer. Brauzerning o'z "to'liq ekran" tugmasi faqat
// <video> elementini kattalashtiradi va suv belgisi yo'qoladi — shuning uchun
// to'liq ekran o'rab turgan blokka ko'chiriladi.
//
// Imzolangan havola: dars ma'lumoti fonda yangilanib turadi va src har safar
// yangi imzo bilan keladi. Ko'rish jarayoni uzilmasligi uchun pleyer joriy
// havolada qoladi; havola eskirib xato bersa (403) — eng yangi havolaga o'tib,
// to'xtagan joydan davom etadi.
function UploadedVideo({
  src,
  watermark,
  onExpired,
}: {
  src?: string;
  watermark: boolean;
  onExpired?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const [activeSrc, setActiveSrc] = useState(src);
  const [awaitingFresh, setAwaitingFresh] = useState(false);
  // Ketma-ket muvaffaqiyatsiz yuklashlar: cheksiz qayta so'rashning oldini oladi
  const [failures, setFailures] = useState(0);
  const [failedStatus, setFailedStatus] = useState<number | null>(null);
  const gaveUp = failures >= MAX_VIDEO_RETRIES;

  // Boshqa fayl kelsa — darhol almashtiramiz; xatodan keyin yangi imzo kelsa — o'tamiz
  if (src !== activeSrc) {
    const otherFile = !src || !activeSrc || mediaKey(src) !== mediaKey(activeSrc);
    if (otherFile || awaitingFresh) {
      setActiveSrc(src);
      if (awaitingFresh) setAwaitingFresh(false);
    }
  }

  function handleError() {
    const video = videoRef.current;
    if (!video || awaitingFresh) return;
    const nextFailures = failures + 1;
    setFailures(nextFailures);
    if (nextFailures >= MAX_VIDEO_RETRIES) {
      // Sababini ko'rsatish uchun server javob kodini olamiz (CORS ochiq)
      if (activeSrc) {
        fetch(activeSrc, { headers: { Range: 'bytes=0-0' } })
          .then((res) => setFailedStatus(res.status))
          .catch(() => setFailedStatus(0));
      }
      return;
    }
    resumeRef.current = { time: video.currentTime, playing: !video.paused };
    if (src && src !== activeSrc) {
      setActiveSrc(src);
    } else {
      setAwaitingFresh(true);
      onExpired?.();
    }
  }

  function handleLoadedMetadata() {
    if (failures) setFailures(0);
    const video = videoRef.current;
    const resume = resumeRef.current;
    if (!video || !resume) return;
    resumeRef.current = null;
    video.currentTime = resume.time;
    if (resume.playing) video.play().catch(() => undefined);
  }

  useEffect(() => {
    if (!watermark) return;
    function onFullscreenChange() {
      const wrapper = wrapperRef.current;
      if (wrapper && document.fullscreenElement === videoRef.current) {
        document
          .exitFullscreen()
          .then(() => wrapper.requestFullscreen())
          .catch(() => undefined);
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [watermark]);

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-2xl bg-admin [&:fullscreen]:rounded-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={activeSrc}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className="aspect-video h-full w-full"
      >
        Brauzeringiz videoni qo&apos;llab-quvvatlamaydi.
      </video>
      {watermark && <VideoWatermark />}
      {gaveUp && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-admin/95 p-6 text-center text-admin-foreground">
          <VideoOff className="size-9 text-admin-muted" />
          <div>
            <p className="font-semibold">Videoni yuklab bo&apos;lmadi</p>
            <p className="mt-1 text-sm text-admin-muted">{videoErrorText(failedStatus)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFailures(0);
              setFailedStatus(null);
              setAwaitingFresh(true);
              onExpired?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <RotateCw className="size-4" /> Qayta urinish
          </button>
        </div>
      )}
    </div>
  );
}

export function LessonVideo({
  url,
  watermark = false,
  onExpired,
}: {
  url: string;
  // O'quvchiga ko'rsatilganda true: ism va ID bilan suv belgisi
  watermark?: boolean;
  // Imzolangan havola eskirganda yangisini olish (odatda darsni refetch qilish)
  onExpired?: () => void;
}) {
  const embed = youtubeEmbedUrl(url);
  if (embed) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-admin">
        <iframe
          src={embed}
          title="Video dars"
          className="aspect-video w-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {watermark && <VideoWatermark />}
      </div>
    );
  }
  // Serverga yuklangan fayl (POST /lessons/:id/video yoki material) — nisbiy yo'l
  if (isVideoFile(url) || !/^https?:\/\//i.test(url)) {
    return <UploadedVideo src={resolveAssetUrl(url)} watermark={watermark} onExpired={onExpired} />;
  }
  return (
    <a
      href={resolveAssetUrl(url)}
      target="_blank"
      rel="noopener"
      className={cn(
        'flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-admin text-admin-foreground'
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-primary">
        <Video className="size-7" />
      </span>
      <span className="font-semibold">Videoni ochish</span>
    </a>
  );
}

// To'liq ekran o'rab turgan blokka ko'chiriladi, aks holda suv belgisi yo'qoladi
function useWrapperFullscreen(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    function onFullscreenChange() {
      const wrapper = wrapperRef.current;
      if (wrapper && document.fullscreenElement === videoRef.current) {
        document
          .exitFullscreen()
          .then(() => wrapper.requestFullscreen())
          .catch(() => undefined);
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [wrapperRef, videoRef, enabled]);
}

function VideoErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-admin/95 p-6 text-center text-admin-foreground">
      <VideoOff className="size-9 text-admin-muted" />
      <div>
        <p className="font-semibold">Videoni yuklab bo&apos;lmadi</p>
        <p className="mt-1 text-sm text-admin-muted">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <RotateCw className="size-4" /> Qayta urinish
      </button>
    </div>
  );
}

// HLS kalit so'rovi (…/media/hls/<lessonId>/key) — faqat shunga token qo'shiladi
const HLS_KEY_URL = /\/media\/hls\/[^?]+\/key(\?|$)/;

// Shifrlangan HLS video (hls.js). Playlist va bo'laklar imzolangan (10 daqiqa),
// kalit esa faqat Authorization token bilan beriladi — havolani nusxalab boshqa
// joyda ochib bo'lmaydi. Imzo eskirib 403 bo'lsa: yangi havola olinib, to'xtagan
// joydan davom etiladi.
function HlsVideo({
  src,
  watermark,
  onExpired,
}: {
  src: string;
  watermark: boolean;
  onExpired?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const fatalRef = useRef<(status: number | null) => void>(() => undefined);
  const [activeSrc, setActiveSrc] = useState(src);
  const [awaitingFresh, setAwaitingFresh] = useState(false);
  const [failures, setFailures] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const gaveUp = errorText !== null;

  useWrapperFullscreen(wrapperRef, videoRef, watermark);

  // Boshqa dars — darhol; xatodan keyin yangi imzo kelsa — o'tamiz
  if (src !== activeSrc && (mediaKey(src) !== mediaKey(activeSrc) || awaitingFresh)) {
    setActiveSrc(src);
    if (awaitingFresh) setAwaitingFresh(false);
  }

  function handleFatal(status: number | null) {
    if (awaitingFresh || gaveUp) return;
    const video = videoRef.current;
    if (video) resumeRef.current = { time: video.currentTime, playing: !video.paused };
    const nextFailures = failures + 1;
    setFailures(nextFailures);
    if (nextFailures >= MAX_VIDEO_RETRIES) {
      setErrorText(videoErrorText(status));
      return;
    }
    if (src !== activeSrc) {
      setActiveSrc(src);
    } else {
      setAwaitingFresh(true);
      onExpired?.();
    }
  }

  useEffect(() => {
    fatalRef.current = handleFatal;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let hls: import('hls.js').default | null = null;

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls({
          xhrSetup: (xhr, url) => {
            if (!HLS_KEY_URL.test(url)) return;
            const token = getTokenCookie();
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          },
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          fatalRef.current(data.response?.code ?? null);
        });
        hls.loadSource(activeSrc);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Eski iOS: MediaSource yo'q, native HLS kalit so'roviga token qo'sha olmaydi
        video.src = activeSrc;
      } else {
        setErrorText("Brauzeringiz bu videoni qo'llab-quvvatlamaydi — boshqa brauzerda oching.");
      }
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [activeSrc]);

  function handleLoadedMetadata() {
    const video = videoRef.current;
    const resume = resumeRef.current;
    if (!video || !resume) return;
    resumeRef.current = null;
    video.currentTime = resume.time;
    if (resume.playing) video.play().catch(() => undefined);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-2xl bg-admin [&:fullscreen]:rounded-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        onError={() => fatalRef.current(null)}
        onLoadedMetadata={handleLoadedMetadata}
        onPlaying={() => failures && setFailures(0)}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className="aspect-video h-full w-full"
      />
      {watermark && <VideoWatermark />}
      {gaveUp && (
        <VideoErrorOverlay
          message={errorText}
          onRetry={() => {
            setFailures(0);
            setErrorText(null);
            setAwaitingFresh(true);
            onExpired?.();
          }}
        />
      )}
    </div>
  );
}

function VideoPlaceholder({
  icon: Icon,
  spin,
  title,
  text,
}: {
  icon: typeof Video;
  spin?: boolean;
  title: string;
  text: string;
}) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-admin p-6 text-center text-admin-foreground">
      <Icon className={cn('size-9 text-admin-muted', spin && 'animate-spin')} />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-admin-muted">{text}</p>
      </div>
    </div>
  );
}

type MainVideoLesson = Pick<Lesson, 'videoUrl' | 'videoStatus' | 'video'>;

// Darsda asosiy video bormi (tayyor, tayyorlanayotgan yoki tashqi havola)
export function hasMainVideo(lesson: MainVideoLesson) {
  return Boolean(
    lesson.videoUrl ||
    lesson.video?.url ||
    lesson.videoStatus === 'processing' ||
    lesson.videoStatus === 'failed'
  );
}

// Darsning asosiy videosi: HLS (ready) / tayyorlanmoqda / xato / tashqi havola (YouTube)
export function LessonMainVideo({
  lesson,
  watermark = false,
  onExpired,
}: {
  lesson: MainVideoLesson;
  watermark?: boolean;
  onExpired?: () => void;
}) {
  if (lesson.videoStatus === 'processing') {
    return (
      <VideoPlaceholder
        icon={Loader2}
        spin
        title="Video tayyorlanmoqda..."
        text="Odatda bir necha daqiqa davom etadi — sahifa o'zi yangilanadi."
      />
    );
  }
  if (lesson.videoStatus === 'failed') {
    return (
      <VideoPlaceholder
        icon={VideoOff}
        title="Videoni tayyorlab bo'lmadi"
        text="Videoni qayta yuklang yoki administratorga xabar bering."
      />
    );
  }
  if (lesson.videoStatus === 'ready' && lesson.video?.url) {
    return (
      <HlsVideo
        src={resolveAssetUrl(lesson.video.url) ?? lesson.video.url}
        watermark={watermark}
        onExpired={onExpired}
      />
    );
  }
  if (lesson.videoUrl) {
    return <LessonVideo url={lesson.videoUrl} watermark={watermark} onExpired={onExpired} />;
  }
  return null;
}
