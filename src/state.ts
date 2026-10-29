// Mutable, per-frame shared state (kept out of React to avoid re-renders at 60 FPS).
export const S = {
  p: 0, // smoothed scroll progress 0..1 (used by the 3D scene)
  target: 0, // raw scroll progress
  ren: 1, // 0 = Altbau, 1 = saniert (animated)
  renTarget: 1,
  free: false, // OrbitControls mode
  xrayForce: false,
  mouse: { x: 0, y: 0 },
  // Offline-Export für das vorgerenderte Video (?export): deterministische Zeit, keine Kamera-Trägheit
  exp: typeof location !== 'undefined' && location.search.includes('export'),
  mobile: typeof window !== 'undefined' && (window.innerWidth < 820 || /Mobi|Android/i.test(navigator.userAgent)),
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
// 0 -> 1 -> 0 window between a..d with plateau b..c
export const bump = (a: number, b: number, c: number, d: number, x: number) => smooth(a, b, x) * (1 - smooth(c, d, x))

// Scroll ranges per scene (percent of total scroll)
// 0 Außen · 1 Wand-Scan/Leckortung · 2 Bad & Sanitär · 3 Wohnraum & Möbel · 4 Balkon & Elektrik · 5 Karte & Anfrage
export const SCENE_RANGES = [0, 0.12, 0.36, 0.55, 0.7, 0.86, 1.0]
export const SCENE_JUMP = [0, 0.27, 0.45, 0.63, 0.77, 0.94]
export const sceneOf = (p: number) => {
  for (let i = 0; i < 6; i++) if (p < SCENE_RANGES[i + 1]) return i
  return 5
}
