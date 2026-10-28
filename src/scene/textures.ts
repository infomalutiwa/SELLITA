import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const mk = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d')!)
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.anisotropy = 8
  if (srgb) t.colorSpace = SRGBColorSpace
  return t
}
const rnd = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647)

/** Dachziegel (Farbe + Bump) */
export function roofTextures(rx = 7, ry = 2.2) {
  const draw = (bump: boolean) => (g: CanvasRenderingContext2D) => {
    const r = rnd(7)
    g.fillStyle = bump ? '#808080' : '#3a424d'; g.fillRect(0, 0, 256, 256)
    const rows = 8, cols = 6, h = 256 / rows, w = 256 / cols
    for (let y = 0; y < rows; y++) for (let x = -1; x < cols; x++) {
      const px = x * w + (y % 2 ? w / 2 : 0), py = y * h, v = Math.floor(r() * 26)
      if (bump) {
        const gr = g.createLinearGradient(0, py, 0, py + h); gr.addColorStop(0, '#303030'); gr.addColorStop(0.75, '#d8d8d8'); gr.addColorStop(1, '#ffffff')
        g.fillStyle = gr; g.fillRect(px + 1, py, w - 2, h)
      } else {
        const gr = g.createLinearGradient(0, py, 0, py + h)
        gr.addColorStop(0, `rgb(${42 + v},${50 + v},${60 + v})`); gr.addColorStop(1, `rgb(${70 + v},${80 + v},${92 + v})`)
        g.fillStyle = gr; g.fillRect(px + 1, py + 1, w - 2, h - 1)
      }
    }
  }
  const map = mk(256, 256, draw(false)), bump = mk(256, 256, draw(true), false)
  map.repeat.set(rx, ry); bump.repeat.set(rx, ry)
  return { map, bump }
}

/** feiner Putz */
export function plasterBump() {
  const t = mk(256, 256, (g) => {
    const r = rnd(3)
    g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 9000; i++) { const v = 100 + r() * 60; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2) }
  }, false)
  t.repeat.set(3, 3)
  return t
}

/** Eichen-Dielen */
export function woodTexture(rx = 4, ry = 3) {
  const t = mk(256, 256, (g) => {
    const r = rnd(11), n = 8
    for (let i = 0; i < n; i++) {
      const v = Math.floor(r() * 24)
      g.fillStyle = `rgb(${176 + v},${132 + v},${88 + v})`; g.fillRect(0, (i * 256) / n, 256, 256 / n)
      for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(90,56,26,${0.05 + r() * 0.1})`; g.beginPath(); const y = (i * 256) / n + r() * (256 / n); g.moveTo(0, y); g.lineTo(256, y + (r() - 0.5) * 4); g.stroke() }
      g.fillStyle = 'rgba(40,24,10,.55)'; g.fillRect(0, (i * 256) / n, 256, 1.5)
      g.fillRect(((i * 97) % 256), (i * 256) / n, 1.5, 256 / n)
    }
  })
  t.repeat.set(rx, ry)
  return t
}

/** Rasen */
export function grassTexture() {
  const t = mk(256, 256, (g) => {
    const r = rnd(5)
    g.fillStyle = '#244636'; g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 5000; i++) { const l = 30 + r() * 30; g.fillStyle = `rgb(${24 + l * 0.3},${60 + l},${44 + l * 0.4})`; g.fillRect(r() * 256, r() * 256, 1, 2 + r() * 3) }
  })
  t.repeat.set(10, 10)
  return t
}
