// Mutable, per-frame shared state (kept out of React to avoid re-renders at 60 FPS).
export const S = {
  p: 0, // smoothed scroll progress 0..1 (used by the 3D scene)
  target: 0, // raw scroll progress
  ren: 1, // 0 = Altbau, 1 = saniert (animated)
  renTarget: 1,
  free: false, // OrbitControls mode
  xrayForce: false,
  mouse: { x: 0, y: 0 },
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
export const SCENE_RANGES = [0, 0.15, 0.35, 0.55, 0.7, 0.85, 1.0]
export const SCENE_JUMP = [0, 0.17, 0.38, 0.57, 0.72, 0.92]
export const sceneOf = (p: number) => {
  for (let i = 0; i < 6; i++) if (p < SCENE_RANGES[i + 1]) return i
  return 5
}
