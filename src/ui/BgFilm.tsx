import { useEffect, useRef } from 'react'

type Manifest = { count: number; fps: number; ext: string; path: string; marks: Record<string, [number, number]> }
type Key = { y: number; t: number; dim: number; x: number; z: number; fit: number; ay: number }
type View = Omit<Key, 'y'>

const frameUrl = (m: Manifest, i: number) => `${m.path}/f_${String(i).padStart(4, '0')}.${m.ext}`

/**
 * Hintergrundfilm als Bildsequenz, gesteuert über die Scroll-Position.
 * Jeder Abschnitt mit `data-film="<mark>"` spielt seinen Teil des Films ab, während er durch die
 * Bildschirmmitte läuft (`data-a`/`data-b` = Anteil des Marks, `data-dim` = Abdunklung 0..1,
 * `data-x`/`data-z` = Verschiebung nach rechts bzw. Zoom am Desktop, `data-fit`/`data-ay` = ganzes Bild statt Ausschnitt im Hochformat).
 */
export function BgFilm() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const shade = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false, raf = 0
    let cleanup = () => {}
    fetch('video/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Manifest | null) => { if (m && !cancelled) cleanup = start(m) })
      .catch(() => {})

    function start(m: Manifest) {
      const imgs: (HTMLImageElement | null)[] = new Array(m.count).fill(null)
      let dirty = true, next = 0
      // erst grob (jedes 16. Bild), dann immer feiner nachladen
      const order: number[] = [], seen = new Set<number>()
      for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < m.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i) }
      const pump = () => {
        if (cancelled || next >= order.length) return
        const i = order[next++]
        const im = new Image()
        im.decoding = 'async'
        im.onload = () => { imgs[i] = im; dirty = true; pump() }
        im.onerror = pump
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

      // Scroll-Position -> Filmzeit
      let keys: Key[] = []
      const measure = () => {
        const vh = innerHeight, out: Key[] = []
        document.querySelectorAll<HTMLElement>('[data-film]').forEach((el) => {
          const mk = m.marks[el.dataset.film!]
          if (!mk) return
          const top = el.getBoundingClientRect().top + scrollY
          const d = el.dataset, a = Number(d.a ?? 0), b = Number(d.b ?? 1)
          const v = { dim: Number(d.dim ?? 0.5), x: Number(d.x ?? 0), z: Number(d.z ?? 1), fit: Number(d.fit ?? 0), ay: Number(d.ay ?? 0.5) }
          const t = (f: number) => mk[0] + (mk[1] - mk[0]) * f
          out.push({ y: Math.max(0, top - vh * 0.5), t: t(a), ...v }, { y: Math.max(0, top + el.offsetHeight - vh * 0.5), t: t(b), ...v })
        })
        keys = out.sort((p, q) => p.y - q.y)
        dirty = true
      }
      const at = (y: number): View => {
        if (!keys.length) return { t: 0, dim: 0.5, x: 0, z: 1, fit: 0, ay: 0.5 }
        if (y <= keys[0].y) return keys[0]
        for (let i = 1; i < keys.length; i++) {
          const k0 = keys[i - 1], k1 = keys[i]
          if (y <= k1.y) {
            const f = k1.y > k0.y ? (y - k0.y) / (k1.y - k0.y) : 1
            const l = (p: keyof View) => k0[p] + (k1[p] - k0[p]) * f
            return { t: l('t'), dim: l('dim'), x: l('x'), z: l('z'), fit: l('fit'), ay: l('ay') }
          }
        }
        return keys[keys.length - 1]
      }

      const c = canvas.current!, ctx = c.getContext('2d')!
      const resize = () => {
        const dpr = Math.min(1.5, devicePixelRatio || 1)
        c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr)
        measure()
      }
      resize()
      addEventListener('resize', resize)
      const ro = new ResizeObserver(measure)
      ro.observe(document.body)

      let v = at(scrollY), lastF = -1, prev = performance.now()
      const draw = (im: HTMLImageElement, alpha: number) => {
        const iw = im.naturalWidth, ih = im.naturalHeight
        const cover = Math.max(c.width / iw, c.height / ih), contain = Math.min(c.width / iw, c.height / ih)
        const portrait = c.width < c.height
        const desk = innerWidth >= 1024
        const s = portrait ? cover + (contain - cover) * v.fit : cover * (desk ? v.z : 1)
        const w = iw * s, h = ih * s
        const dx = desk ? v.x * c.width : 0
        ctx.globalAlpha = alpha
        ctx.drawImage(im, (c.width - w) / 2 + dx, (c.height - h) * (portrait ? v.ay : 0.5), w, h)
      }
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = Math.min(0.1, (now - prev) / 1000); prev = now
        const k = at(scrollY), e = Math.min(1, dt * 7)
        const moved = Math.abs(k.x - v.x) + Math.abs(k.z - v.z) + Math.abs(k.fit - v.fit) + Math.abs(k.ay - v.ay) > 1e-4
        v = { t: v.t + (k.t - v.t) * e, dim: k.dim, x: v.x + (k.x - v.x) * e, z: v.z + (k.z - v.z) * e, fit: v.fit + (k.fit - v.fit) * e, ay: v.ay + (k.ay - v.ay) * e }
        if (shade.current) shade.current.style.opacity = k.dim.toFixed(3)
        const f = Math.min(m.count - 1, Math.max(0, v.t * m.fps))
        if (!dirty && !moved && Math.abs(f - lastF) < 0.01) return
        lastF = f; dirty = false
        const i0 = Math.floor(f), a = f - i0
        const A = imgs[i0] || nearest(i0), B = imgs[Math.min(m.count - 1, i0 + 1)]
        if (!A) return
        ctx.clearRect(0, 0, c.width, c.height)
        draw(A, 1)
        if (B && B !== A && a > 0.02) draw(B, a)
        ctx.globalAlpha = 1
        c.style.opacity = '1'
      }
      raf = requestAnimationFrame(loop)
      return () => { ro.disconnect(); removeEventListener('resize', resize) }
    }
    return () => { cancelled = true; cancelAnimationFrame(raf); cleanup() }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black">
      <canvas ref={canvas} className="h-full w-full opacity-0 transition-opacity duration-700" />
      <div ref={shade} className="absolute inset-0 bg-[#07090e]" style={{ opacity: 0.5 }} />
      <div className="film-shade absolute inset-0" />
      <div className="grain absolute" style={{ inset: '-5%' }} />
    </div>
  )
}
