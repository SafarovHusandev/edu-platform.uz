"use client"

import { useEffect, useState } from "react"

// 0 dan qiymatgacha silliq sanab chiqadi (harakat kamaytirilgan bo'lsa — darhol)
export function useCountUp(target: number, duration = 1200, startDelay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const total = reduced ? 0 : duration
    let frame = 0
    let start: number | null = null
    const step = (now: number) => {
      start ??= now
      const progress = total ? Math.min((now - start) / total, 1) : 1
      setValue(target * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    const timer = setTimeout(() => (frame = requestAnimationFrame(step)), reduced ? 0 : startDelay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [target, duration, startDelay])
  return value
}
