import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { S, smoother, smooth } from '../state'
import { MAP_Y } from './ServiceRadiusMap'
import type { V3 } from './layout'

type Key = { p: number; pos: V3; tgt: V3; sx?: number }
const m = MAP_Y
// Kamera-Keyframes: p = Scroll-Fortschritt
export const KEYS: Key[] = [
  // Akt 0 · Das Haus
  { p: 0.0, pos: [9.5, 4.8, 13.5], tgt: [0, 3.0, 0], sx: -3.4 },
  { p: 0.08, pos: [7.5, 4.2, 11], tgt: [0, 3.0, 0], sx: -2.4 },
  // Akt 1 · Zoom in die Hauswand: Hausanschluss, dann Thermografie-Scan der Wand
  { p: 0.17, pos: [-1.6, 1.7, 5.0], tgt: [-1.5, 1.2, -1.8] },
  { p: 0.24, pos: [2.0, 1.85, 3.7], tgt: [1.8, 1.8, -1.0], sx: -1.0 },
  { p: 0.31, pos: [2.1, 1.9, 3.2], tgt: [1.8, 2.0, -1.1], sx: -0.9 },
  { p: 0.34, pos: [2.3, 2.0, 2.8], tgt: [1.6, 2.15, -1.2], sx: -0.6 },
  // Akt 2 · entlang der blauen Steigleitung hoch ins Bad, Schichten fahren auseinander
  { p: 0.39, pos: [2.4, 2.7, 4.0], tgt: [0.6, 2.9, -1.7] },
  { p: 0.45, pos: [2.3, 4.3, 4.9], tgt: [1.9, 3.6, -0.9], sx: 0.8 },
  { p: 0.53, pos: [2.0, 3.95, 4.3], tgt: [1.9, 3.55, -1.0], sx: 0.8 },
  // Akt 3 · im selben Stockwerk nach links in den Wohnraum (Möbel & Elektrik)
  { p: 0.59, pos: [0.4, 4.1, 4.8], tgt: [-1.4, 3.6, -0.9], sx: -1.3 },
  { p: 0.68, pos: [-0.8, 4.2, 4.3], tgt: [-1.5, 3.6, -1.1], sx: -1.2 },
  // Akt 4 · hinaus auf den angeschlossenen Balkon (Schichtaufbau)
  { p: 0.74, pos: [-5.0, 4.5, 8.2], tgt: [-1.5, 3.0, 2.5], sx: 1.4 },
  { p: 0.83, pos: [-0.9, 4.5, 7.4], tgt: [-1.6, 3.0, 2.4], sx: 1.3 },
  // Akt 5 · Zoom-out aus dem Haus auf die 100-km-Karte
  { p: 0.87, pos: [8, 8, 17], tgt: [-0.5, 3.0, 0.5] },
  { p: 0.92, pos: [0, m + 14, 14], tgt: [0, m, -0.5], sx: -3.5 },
  { p: 1.0, pos: [0, m + 12.5, 12.5], tgt: [0, m, -0.5], sx: -4 },
]

/** Blickpunkt der Kamera – Fokus für die Tiefenunschärfe */
export const FOCUS = new Vector3(0, 3, 0)
let shift = 0
const a = new Vector3(), b = new Vector3(), pos = new Vector3(), tgt = new Vector3(), cur = new Vector3()

function sample(p: number) {
  let i = 0
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++
  const k0 = KEYS[i], k1 = KEYS[i + 1]
  const t = smoother(Math.min(1, Math.max(0, (p - k0.p) / (k1.p - k0.p))))
  pos.set(...k0.pos).lerp(a.set(...k1.pos), t)
  tgt.set(...k0.tgt).lerp(b.set(...k1.tgt), t)
  shift = (k0.sx ?? 0) + ((k1.sx ?? 0) - (k0.sx ?? 0)) * t
}

export function CameraRig() {
  const { camera, size } = useThree()
  const controls = useRef<OrbitImpl>(null)
  const look = useRef(new Vector3(0, 3, 0))
  const wasFree = useRef(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => { S.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; S.mouse.y = (e.clientY / window.innerHeight) * 2 - 1 }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((_, dt) => {
    S.p += (S.target - S.p) * Math.min(1, dt * 3.5)
    if (S.free) {
      if (!wasFree.current && controls.current) { controls.current.target.copy(look.current); controls.current.update() }
      wasFree.current = true
      return
    }
    wasFree.current = false
    sample(S.p)
    // schmale Displays: Kamera weiter weg, damit das Motiv ins Bild passt
    const aspect = size.width / size.height
    const f = aspect < 1.4 ? Math.min(2.4, Math.pow(1.5 / aspect, 0.85)) : 1
    pos.sub(tgt).multiplyScalar(f).add(tgt)
    // Auf Desktop Motiv neben die Text-Karte schieben
    if (aspect > 1.3) { pos.x += shift; tgt.x += shift }
    else if (aspect < 1) { const up = 4.2 * smooth(0.86, 0.9, S.p); pos.z += up; tgt.z += up }
    // Maus-Parallax in der Hero-Szene
    const hero = 1 - smooth(0.0, 0.12, S.p)
    pos.x += S.mouse.x * 1.4 * hero
    pos.y += -S.mouse.y * 0.7 * hero
    // leichte Handkamera-Bewegung wie bei einem gedrehten Film
    const tt = performance.now() / 1000
    pos.x += Math.sin(tt * 0.7) * 0.035; pos.y += Math.sin(tt * 0.93 + 1.3) * 0.025; pos.z += Math.sin(tt * 0.51 + 0.4) * 0.03
    cur.copy(pos)
    camera.position.lerp(cur, Math.min(1, dt * 12))
    look.current.lerp(tgt, Math.min(1, dt * 12))
    camera.lookAt(look.current)
    FOCUS.copy(look.current)
    const cam = camera as PerspectiveCamera
    const fov = 30 + 12 * smooth(0.04, 0.16, S.p) - 6 * smooth(0.85, 0.9, S.p)
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix() }
  })

  return <OrbitControls ref={controls as never} makeDefault enabled={S.free} enablePan={false} minDistance={3} maxDistance={40} enableDamping dampingFactor={0.08} />
}
