'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

const COLORS = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#FF9F1C', '#C77DFF', '#FFFFFF'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  round: boolean;
}

export interface ConfettiHandle {
  // Ekranning qaysi nuqtasidan (0..1) otiladi
  burst: (opts?: { x?: number; y?: number; count?: number }) => void;
  // Yuqoridan yomg'ir
  rain: (durationMs?: number) => void;
}

// Kutubxonasiz canvas konfetti — doska ustida, bosishlarni to'smaydi
export const Confetti = forwardRef<ConfettiHandle>(function Confetti(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef<number>(0);
  const rainUntil = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const spawn = useCallback((x: number, y: number, power: number, spread: number) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = power * (0.55 + Math.random() * 0.6);
    particles.current.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      round: Math.random() < 0.3,
    });
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { innerWidth: w, innerHeight: h } = window;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (Date.now() < rainUntil.current) {
      for (let i = 0; i < 4; i++) {
        const p = { x: Math.random() * w, y: -20 };
        spawn(p.x, p.y, 2, Math.PI * 2);
        const last = particles.current[particles.current.length - 1];
        last.vy = 2 + Math.random() * 3;
      }
    }

    particles.current = particles.current.filter((p) => p.life > 0 && p.y < h + 40);
    for (const p of particles.current) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.004;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
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

  useImperativeHandle(
    ref,
    () => ({
      burst: ({ x = 0.5, y = 0.6, count = 140 } = {}) => {
        if (reduced.current) return;
        const px = x * window.innerWidth;
        const py = y * window.innerHeight;
        for (let i = 0; i < count; i++) spawn(px, py, 22, Math.PI * 0.9);
        start();
      },
      rain: (durationMs = 3500) => {
        if (reduced.current) return;
        rainUntil.current = Date.now() + durationMs;
        start();
      },
    }),
    [spawn, start]
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 size-full"
    />
  );
});
