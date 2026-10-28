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
  { p: 0.0, pos: [9.5, 4.8, 13.5], tgt: [0, 3.0, 0], sx: -3.4 },
  { p: 0.1, pos: [7.5, 4.2, 11], tgt: [0, 3.0, 0], sx: -2.4 },
  { p: 0.17, pos: [-1.2, 1.9, 5.4], tgt: [-1.6, 1.0, -1] }, // Technikraum
  { p: 0.3, pos: [1.6, 1.7, 4.4], tgt: [1.6, 0.8, -1.2] }, // Fußbodenheizung + Heizkörper
  { p: 0.38, pos: [3.2, 2.6, 4.2], tgt: [0.6, 2.6, -1.7] }, // Steigleitung
  { p: 0.44, pos: [2.6, 3.9, 4.4], tgt: [1.7, 3.5, -1.2] }, // Bad
  { p: 0.53, pos: [3.4, 4.3, 4.6], tgt: [1.7, 3.5, -1] },
  { p: 0.57, pos: [2.0, 1.9, 3.3], tgt: [1.8, 2.15, -1.2] }, // Leckortung
  { p: 0.68, pos: [2.2, 1.95, 2.8], tgt: [1.8, 2.15, -1.2] },
  { p: 0.72, pos: [-4.5, 4.6, 9.2], tgt: [-1.4, 3.4, 1.8] }, // Balkon
  { p: 0.83, pos: [-2.5, 4.6, 8.5], tgt: [-1.2, 3.4, 0.6] },
  { p: 0.9, pos: [0, m + 14, 14], tgt: [0, m, -0.5], sx: -3.5 }, // Karte
  { p: 1.0, pos: [0, m + 12.5, 12.5], tgt: [0, m, -0.5], sx: -4 },
]

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
    S.p += (S.target - S.p) * Math.min(1, dt * 7)
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
    cur.copy(pos)
    camera.position.lerp(cur, Math.min(1, dt * 12))
    look.current.lerp(tgt, Math.min(1, dt * 12))
    camera.lookAt(look.current)
    const cam = camera as PerspectiveCamera
    const fov = S.p > 0.88 ? 38 : 42
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix() }
  })

  return <OrbitControls ref={controls as never} makeDefault enabled={S.free} enablePan={false} minDistance={3} maxDistance={40} enableDamping dampingFactor={0.08} />
}
