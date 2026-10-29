import { useEffect, useRef } from 'react'

/** Stumme Video-Schleife, die nur läuft, solange sie im Bild ist. */
export function Clip({ name, className = '' }: { name: string; className?: string }) {
  const v = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = v.current!
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.preload = 'auto'; el.play().catch(() => {}) } else el.pause()
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <video ref={v} className={`h-full w-full object-cover ${className}`} src={`clips/${name}.mp4`} poster={`clips/${name}.webp`}
      muted loop playsInline preload="none" aria-hidden />
  )
}
