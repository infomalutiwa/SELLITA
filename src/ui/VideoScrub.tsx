import { useEffect, useRef } from 'react'
import { S, smooth } from '../state'

export type VideoManifest = { count: number; pmax: number; w: number; h: number; ext: string; path: string }

export async function loadVideoManifest(): Promise<VideoManifest | null> {
  try {
    const r = await fetch('video/manifest.json')
    if (!r.ok) return null
    const m = await r.json()
    return m && m.count > 1 ? m : null
  } catch {
    return null
  }
}

const frameUrl = (m: VideoManifest, i: number) => `${m.path}/f_${String(i).padStart(4, '0')}.${m.ext}`

/**
 * Vorgerenderter Film (Blender/Cycles) als Bildsequenz: der Scroll-Fortschritt wählt das Bild,
 * zwischen zwei Bildern wird weich überblendet. Lädt zuerst jedes 16. Bild, dann verdichtet es.
 */
export function VideoScrub({ m, onProgress }: { m: VideoManifest; onProgress: (loaded: number, needed: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const imgs: (HTMLImageElement | null)[] = new Array(m.count).fill(null)
    let dirty = true, cancelled = false, loaded = 0
    const order: number[] = []
    for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < m.count; i += step) if (!order.includes(i)) order.push(i)
    if (!order.includes(m.count - 1)) order.splice(1, 0, m.count - 1)
    const needed = Math.ceil(m.count / 4) // Grobe Bildfolge reicht zum Start
    let next = 0
    const pump = () => {
      if (cancelled || next >= order.length) return
      const i = order[next++]
      const im = new Image()
      im.decoding = 'async'
      im.onload = () => { imgs[i] = im; loaded++; dirty = true; onProgress(loaded, needed); pump() }
      im.onerror = () => { loaded++; onProgress(loaded, needed); pump() }
      im.src = frameUrl(m, i)
    }
    for (let k = 0; k < 6; k++) pump()

    const nearest = (i: number) => {
      for (let d = 0; d < m.count; d++) {
        if (imgs[i - d]) return imgs[i - d]
        if (imgs[i + d]) return imgs[i + d]
      }
      return null
    }
    let lastF = -1, raf = 0
    const ctx = canvas.current!.getContext('2d')!
    const resize = () => {
      const c = canvas.current!
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr)
      dirty = true
    }
    resize()
    window.addEventListener('resize', resize)
    const draw = (im: HTMLImageElement, alpha: number) => {
      const c = canvas.current!
      // "cover": Bild füllt den Schirm, Mitte bleibt Mitte
      const s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight)
      const w = im.naturalWidth * s, h = im.naturalHeight * s
      ctx.globalAlpha = alpha
      ctx.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h)
    }
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const c = canvas.current
      if (!c) return
      c.style.opacity = String(1 - smooth(0.875, 0.9, S.p))
      if (S.p > 0.905) return
      const f = Math.min(1, Math.max(0, S.p / m.pmax)) * (m.count - 1)
      if (!dirty && Math.abs(f - lastF) < 0.002) return
      lastF = f; dirty = false
      const i0 = Math.floor(f), a = f - i0
      const A = imgs[i0] || nearest(i0)
      const B = imgs[Math.min(m.count - 1, i0 + 1)]
      if (!A) return
      draw(A, 1)
      if (B && B !== A && a > 0.01) draw(B, a)
      ctx.globalAlpha = 1
    }
    loop()
    return () => { cancelled = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [m, onProgress])

  return (
    <>
      <canvas ref={canvas} aria-label="SELLITA Haus-Tour (vorgerenderter Film)" className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />
      {/* Kino-Look: Vignette + feines Filmkorn über dem Film */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[2]" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(7,9,14,.55) 100%)' }} />
      <div aria-hidden className="grain pointer-events-none fixed z-[2]" style={{ inset: '-5%' }} />
    </>
  )
}
