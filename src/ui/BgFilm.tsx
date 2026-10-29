import { useEffect, useRef } from 'react'

type Manifest = { count: number; fps: number; ext: string; path: string; pathMobile?: string; marks: Record<string, [number, number]> }
type Key = { y: number; t: number; dim: number; x: number; z: number; fit: number; ay: number; mo: number }
type View = Omit<Key, 'y'>

const MOBILE = '(max-width: 767px)'
const WINDOW = 8 // so viele Bilder vor/hinter der aktuellen Stelle bleiben dekodiert
const DECODERS = 3

/**
 * Hintergrundfilm als Bildsequenz, gesteuert über die Scroll-Position.
 * Jeder Abschnitt mit `data-film="<mark>"` spielt seinen Teil des Films ab, während er durch die
 * Mitte des Inhaltsbereichs läuft (`data-a`/`data-b` = Anteil des Marks, `data-dim` = Abdunklung am Desktop,
 * `data-x`/`data-z` = Verschiebung bzw. Zoom am Desktop, `data-fit`/`data-ay` = ganzes Bild statt Ausschnitt
 * und dessen Höhe am Handy, `data-mo` = Handy-Filmfenster nach oben wegschieben 0..1).
 *
 * Flüssig bleibt es, weil Bilder nie beim Zeichnen dekodiert werden: Sie liegen als komprimierte Blobs im
 * Speicher, und nur ein kleines Fenster um die aktuelle Stelle wird im Hintergrund zu ImageBitmaps dekodiert.
 * Am Handy läuft der Film in einem eigenen Fenster oben, der Text steht darunter (siehe --win in index.css).
 */
export function BgFilm() {
  const box = useRef<HTMLDivElement>(null)
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
      const mobile = matchMedia(MOBILE).matches
      const path = mobile && m.pathMobile ? m.pathMobile : m.path
      const blobs: (Blob | null)[] = new Array(m.count).fill(null)
      const bitmaps = new Map<number, ImageBitmap>()
      const decoding = new Set<number>()
      let dirty = true

      // Laden: erst grob (jedes 16. Bild), dann immer feiner
      const order: number[] = [], seen = new Set<number>()
      for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < m.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i) }
      let next = 0
      const pump = () => {
        if (cancelled || next >= order.length) return
        const i = order[next++]
        fetch(`${path}/f_${String(i).padStart(4, '0')}.${m.ext}`)
          .then((r) => (r.ok ? r.blob() : null))
          .then((b) => { if (b) { blobs[i] = b; dirty = true } })
          .catch(() => {})
          .finally(pump)
      }
      for (let k = 0; k < 6; k++) pump()

      // Dekodieren: nur rund um die aktuelle Stelle, nächstgelegene zuerst
      const decode = (i: number) => {
        decoding.add(i)
        createImageBitmap(blobs[i]!)
          .then((bm) => { if (cancelled) bm.close(); else { bitmaps.get(i)?.close(); bitmaps.set(i, bm); dirty = true } })
          .catch(() => {})
          .finally(() => decoding.delete(i))
      }
      const schedule = (f: number) => {
        const c = Math.round(f)
        for (const [i, bm] of bitmaps) if (Math.abs(i - c) > WINDOW + 4) { bm.close(); bitmaps.delete(i) }
        for (let d = 0; d <= WINDOW && decoding.size < DECODERS; d++) {
          for (const i of d ? [c + d, c - d] : [c]) {
            if (i >= 0 && i < m.count && blobs[i] && !bitmaps.has(i) && !decoding.has(i) && decoding.size < DECODERS) decode(i)
          }
        }
      }
      const prevReady = (i: number) => { for (let j = i; j >= 0; j--) if (bitmaps.has(j)) return j; return -1 }
      const nextReady = (i: number) => { for (let j = i; j < m.count; j++) if (bitmaps.has(j)) return j; return -1 }

      // Scroll-Position -> Filmzeit
      let keys: Key[] = [], anchor = innerHeight / 2
      const measure = () => {
        const vh = innerHeight, out: Key[] = []
        const winBottom = mobile ? box.current!.getBoundingClientRect().height + 64 : 0
        anchor = (winBottom + vh) / 2
        document.querySelectorAll<HTMLElement>('[data-film]').forEach((el) => {
          const mk = m.marks[el.dataset.film!]
          if (!mk) return
          const top = el.getBoundingClientRect().top + scrollY
          const d = el.dataset, a = Number(d.a ?? 0), b = Number(d.b ?? 1)
          const v = { dim: Number(d.dim ?? 0.5), x: Number(d.x ?? 0), z: Number(d.z ?? 1), fit: Number(d.fit ?? 0), ay: Number(d.ay ?? 0.5), mo: Number(d.mo ?? 0) }
          const t = (f: number) => mk[0] + (mk[1] - mk[0]) * f
          out.push({ y: Math.max(0, top - anchor), t: t(a), ...v }, { y: Math.max(0, top + el.offsetHeight - anchor), t: t(b), ...v })
        })
        keys = out.sort((p, q) => p.y - q.y)
        dirty = true
      }
      const FIELDS = ['t', 'dim', 'x', 'z', 'fit', 'ay', 'mo'] as const
      const at = (y: number): View => {
        if (!keys.length) return { t: 0, dim: 0.5, x: 0, z: 1, fit: 0, ay: 0.5, mo: 0 }
        if (y <= keys[0].y) return keys[0]
        for (let i = 1; i < keys.length; i++) {
          const k0 = keys[i - 1], k1 = keys[i]
          if (y <= k1.y) {
            const f = k1.y > k0.y ? (y - k0.y) / (k1.y - k0.y) : 1
            const o = {} as View
            for (const p of FIELDS) o[p] = k0[p] + (k1[p] - k0[p]) * f
            return o
          }
        }
        return keys[keys.length - 1]
      }

      // Canvas nur so groß wie nötig; die ein-/ausfahrende Browserleiste am Handy legt ihn nicht neu an
      const c = canvas.current!, ctx = c.getContext('2d', { alpha: false })!
      let cssW = 0, cssH = 0
      const resize = () => {
        const r = box.current!.getBoundingClientRect()
        if (Math.abs(r.width - cssW) < 1 && Math.abs(r.height - cssH) < 120) { measure(); return }
        cssW = r.width; cssH = r.height
        const scale = Math.min(mobile ? 2 : 1.25, devicePixelRatio || 1, (mobile ? 960 : 1600) / cssW)
        c.width = Math.round(cssW * scale); c.height = Math.round(cssH * scale)
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height)
        dirty = true
        measure()
      }
      resize()
      addEventListener('resize', resize)
      const ro = new ResizeObserver(measure)
      ro.observe(document.body)

      let v = at(scrollY), lastF = -1, lastGeo = '', prev = performance.now(), shown = false, lastDim = -1, lastMo = -1
      const draw = (bm: ImageBitmap, alpha: number) => {
        const iw = bm.width, ih = bm.height
        const cover = Math.max(c.width / iw, c.height / ih), contain = Math.min(c.width / iw, c.height / ih)
        const desk = !mobile && innerWidth >= 1024
        const s = mobile ? cover + (contain - cover) * v.fit : cover * (desk ? v.z : 1)
        const w = iw * s, h = ih * s
        ctx.globalAlpha = alpha
        ctx.drawImage(bm, (c.width - w) / 2 + (desk ? v.x * c.width : 0), (c.height - h) * (mobile ? v.ay : 0.5), w, h)
      }
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = Math.min(0.1, (now - prev) / 1000); prev = now
        const k = at(scrollY), e = Math.min(1, dt * 8)
        const o = {} as View
        for (const p of FIELDS) o[p] = v[p] + (k[p] - v[p]) * e
        v = o
        if (shade.current && Math.abs(v.dim - lastDim) > 0.002) { shade.current.style.opacity = v.dim.toFixed(3); lastDim = v.dim }
        if (mobile && Math.abs(v.mo - lastMo) > 0.001) {
          box.current!.style.transform = v.mo > 0.001 ? `translate3d(0, ${(-v.mo * (cssH + 64)).toFixed(1)}px, 0)` : ''
          lastMo = v.mo
        }
        if (mobile && v.mo > 0.999) return // Fenster ist weggeschoben
        const f = Math.min(m.count - 1, Math.max(0, v.t * m.fps))
        schedule(f)
        const geo = `${v.x.toFixed(4)}|${v.z.toFixed(4)}|${v.fit.toFixed(4)}|${v.ay.toFixed(4)}`
        if (!dirty && geo === lastGeo && Math.abs(f - lastF) < 0.01) return
        // zwischen den zwei nächsten dekodierten Bildern überblenden
        let ia = prevReady(Math.floor(f)), ib = nextReady(Math.floor(f) + 1)
        if (ia < 0) { ia = ib; ib = -1 }
        if (ia < 0) return
        lastF = f; lastGeo = geo; dirty = false
        const a = ib > ia ? (f - ia) / (ib - ia) : 0
        ctx.globalAlpha = 1
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, c.width, c.height)
        draw(bitmaps.get(ia)!, 1)
        if (ib > ia && a > 0.02) draw(bitmaps.get(ib)!, a)
        ctx.globalAlpha = 1
        if (!shown) { c.style.opacity = '1'; shown = true }
      }
      raf = requestAnimationFrame(loop)
      return () => {
        ro.disconnect(); removeEventListener('resize', resize)
        for (const bm of bitmaps.values()) bm.close()
        bitmaps.clear()
      }
    }
    return () => { cancelled = true; cancelAnimationFrame(raf); cleanup() }
  }, [])

  return (
    <div ref={box} aria-hidden className="film-box pointer-events-none fixed inset-x-0 z-20 overflow-hidden bg-black md:inset-0 md:z-0">
      <canvas ref={canvas} className="h-full w-full opacity-0 transition-opacity duration-700" />
      <div ref={shade} className="absolute inset-0 hidden bg-[#07090e] md:block" style={{ opacity: 0.5 }} />
      <div className="film-shade absolute inset-0" />
    </div>
  )
}
