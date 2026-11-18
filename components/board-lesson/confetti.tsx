'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#FF9F1C', '#C77DFF', '#4CC9F0', '#FFFFFF'];
// Oq fonli oynalar uchun: oq rang ko'rinmaydi, oltin/yorqin ranglar ko'proq
const COLORS_LIGHT = ['#FFC233', '#FF5C8A', '#06D6A0', '#3A86FF', '#FF9F1C', '#B388FF', '#2EC4B6', '#FFD166'];

type Shape = 'rect' | 'circle' | 'star' | 'ribbon';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  // Havoda "varaqlanish" (qog'oz aylanishi) va chayqalish
  flip: number;
  vflip: number;
  wobble: number;
  vwobble: number;
  size: number;
  color: string;
  shape: Shape;
  life: number;
  decay: number;
  drag: number;
}

export interface ConfettiHandle {
  // Ekranning qaysi nuqtasidan (0..1) yuqoriga otiladi
  burst: (opts?: { x?: number; y?: number; count?: number }) => void;
  // Yuqoridan yomg'ir
  rain: (durationMs?: number) => void;
  // Katta bayram: ikki pastki burchakdan pushka + markazdan portlash + qisqa yomg'ir
  celebrate: () => void;
}

function pickShape(): Shape {
  const r = Math.random();
  return r < 0.45 ? 'rect' : r < 0.65 ? 'circle' : r < 0.82 ? 'ribbon' : 'star';
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

// Kutubxonasiz canvas konfetti — hamma narsa (dialoglar ham) ustida, bosishlarni to'smaydi
export const Confetti = forwardRef<ConfettiHandle, { palette?: 'dark' | 'light' }>(function Confetti(
  { palette = 'dark' },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef<number>(0);
  const rainUntil = useRef(0);
  const reduced = useRef(false);
  const timers = useRef<number[]>([]);
  const [mounted, setMounted] = useState(false);
  const colors = palette === 'light' ? COLORS_LIGHT : COLORS;

  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    // Portal faqat brauzerda (SSR'da document yo'q)
    setMounted(true);
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(frame.current);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const spawn = useCallback(
    (x: number, y: number, angle: number, spread: number, power: number) => {
      const a = angle + (Math.random() - 0.5) * spread;
      const speed = power * (0.5 + Math.random() * 0.7);
      const shape = pickShape();
      particles.current.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        flip: Math.random() * Math.PI,
        vflip: 0.08 + Math.random() * 0.14,
        wobble: Math.random() * Math.PI * 2,
        vwobble: 0.04 + Math.random() * 0.06,
        size: shape === 'star' ? 7 + Math.random() * 5 : 7 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
        life: 1,
        decay: 0.0035 + Math.random() * 0.0025,
        drag: 0.965 + Math.random() * 0.02,
      });
    },
    [colors]
  );

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      // Canvas hali chizilmagan — keyingi kadrda qayta urinamiz
      frame.current = particles.current.length ? requestAnimationFrame(loop) : 0;
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const { innerWidth: w, innerHeight: h } = window;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (Date.now() < rainUntil.current) {
      for (let i = 0; i < 3; i++) {
        spawn(Math.random() * w, -20, Math.PI / 2, 0.6, 3);
      }
    }

    particles.current = particles.current.filter((p) => p.life > 0 && p.y < h + 40);
    for (const p of particles.current) {
      // Havo qarshiligi + og'irlik; tushish tezligi cheklangan — qog'ozdek sekin suzadi
      p.vx *= p.drag;
      p.vy = Math.min(p.vy * p.drag + 0.28, 4.2);
      p.wobble += p.vwobble;
      p.x += p.vx + Math.sin(p.wobble) * 0.9;
      p.y += p.vy;
      p.rot += p.vr;
      p.flip += p.vflip;
      p.life -= p.decay;

      const flip = Math.cos(p.flip);
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 2.5);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      switch (p.shape) {
        case 'circle':
          ctx.scale(1, Math.abs(flip) * 0.8 + 0.2);
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star':
          ctx.scale(Math.abs(flip) * 0.7 + 0.3, 1);
          drawStar(ctx, p.size / 1.6);
          break;
        case 'ribbon':
          // Uzun ingichka lenta: varaqlanganda eni o'zgaradi
          ctx.fillRect(-1.6, -p.size, 3.2, p.size * 2 * (Math.abs(flip) * 0.7 + 0.3));
          break;
        default:
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size / 1.5) * Math.abs(flip) + 1);
      }
      ctx.restore();
    }

    if (particles.current.length || Date.now() < rainUntil.current) {
      frame.current = requestAnimationFrame(loop);
    } else {
      frame.current = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }, [spawn]);

  const start = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(loop);
  }, [loop]);

  const burst = useCallback(
    ({ x = 0.5, y = 0.6, count = 140 }: { x?: number; y?: number; count?: number } = {}) => {
      if (reduced.current) return;
      const px = x * window.innerWidth;
      const py = y * window.innerHeight;
      for (let i = 0; i < count; i++) spawn(px, py, -Math.PI / 2, Math.PI * 0.9, 20);
      start();
    },
    [spawn, start]
  );

  const cannon = useCallback(
    (side: 'left' | 'right', count: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = side === 'left' ? -10 : w + 10;
      // Pastki burchakdan ekran markaziga qarab ~60° burchak ostida
      const angle = side === 'left' ? -Math.PI / 3 : (-2 * Math.PI) / 3;
      const power = Math.max(18, Math.min(30, h / 32));
      for (let i = 0; i < count; i++) spawn(x, h + 10, angle, 0.55, power);
      start();
    },
    [spawn, start]
  );

  useImperativeHandle(
    ref,
    () => ({
      burst,
      rain: (durationMs = 3500) => {
        if (reduced.current) return;
        rainUntil.current = Date.now() + durationMs;
        start();
      },
      celebrate: () => {
        if (reduced.current) return;
        cannon('left', 90);
        cannon('right', 90);
        const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
        later(250, () => burst({ x: 0.5, y: 0.45, count: 120 }));
        later(500, () => {
          cannon('left', 50);
          cannon('right', 50);
        });
        later(700, () => {
          rainUntil.current = Date.now() + 1800;
          start();
        });
      },
    }),
    [burst, cannon, start]
  );

  if (!mounted) return null;
  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] size-full"
    />,
    document.body
  );
});
