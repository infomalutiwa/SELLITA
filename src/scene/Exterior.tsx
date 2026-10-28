import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { S, smooth } from '../state'
import { ExternalModelLoader } from './ExternalModelLoader'
import { usePbr } from './pbr'

const Lamp = ({ p }: { p: [number, number, number] }) => (
  <group position={p}>
    <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 8]} /><meshStandardMaterial color="#1e242b" metalness={0.8} roughness={0.3} /></mesh>
    <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#ffd9a0" toneMapped={false} /></mesh>
    <pointLight position={[0, 0.55, 0]} intensity={1.2} distance={2.6} color="#ffcf8a" />
  </group>
)

const SHRUBS = ['ph:shrub_01', 'ph:shrub_02', 'ph:shrub_03', 'ph:shrub_04'] as const

/** Garten: großer Rasen bis zum Horizont, Plattenweg, Terrasse, Sträucher (Poly Haven, fotogescannt), Gartenlampen. */
export function Exterior() {
  const lawn = usePbr('leafy_grass', [70, 70], { metalness: 0 })
  const pavers = usePbr('stone_pavers', [1.2, 5], { metalness: 0 })
  const deck = usePbr('wood_planks', [1.5, 2.2], { metalness: 0 })
  const found = usePbr('concrete_floor_01', [4, 0.3], { metalness: 0 })
  const scenery = useRef<Group>(null)
  // Sträucher blenden aus, sobald der Röntgen-Blick läuft (sonst verdecken sie die Kamera)
  useFrame(() => { if (scenery.current) scenery.current.visible = S.free ? !S.xrayForce : S.p < 0.07 || (S.p > 0.72 && S.p < 0.86) || S.p > 0.9 })
  const bushes = useMemo(() => {
    const r = (i: number) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x) }
    const out: { id: string; p: [number, number, number]; s: number; r: number }[] = []
    // Vorgarten-Beete
    for (let i = 0; i < 9; i++) out.push({ id: SHRUBS[i % 4], p: [-3.1 + i * 0.78 + (i > 4 ? 0.7 : 0), 0, 2.75 + r(i) * 0.25], s: 0.7 + r(i + 3) * 0.35, r: r(i) * 6 })
    // Seitliche Bepflanzung + Hecke im Hintergrund
    for (let i = 0; i < 14; i++) { const a = Math.PI * (1.05 + (i / 13) * 0.9); out.push({ id: SHRUBS[(i + 1) % 4], p: [Math.cos(a) * 7.5, 0, Math.sin(a) * 7.5], s: 2.2 + r(i + 9) * 0.9, r: r(i) * 6 }) }
    for (let i = 0; i < 6; i++) out.push({ id: SHRUBS[(i + 2) % 4], p: [i % 2 ? 3.9 : -3.9, 0, -1.2 + i * 0.7], s: 0.9 + r(i + 21) * 0.5, r: r(i + 4) * 6 })
    return out
  }, [])
  return (
    <group>
      {/* Rasen */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial {...lawn} color="#b9c9a0" roughness={1} metalness={0} />
      </mesh>
      {/* Fundament */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow><boxGeometry args={[6.6, 0.3, 4.2]} /><meshStandardMaterial {...found} color="#c9c9c9" /></mesh>
      {/* Plattenweg */}
      <mesh position={[0, 0.012, 5.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.4, 6.6]} /><meshStandardMaterial {...pavers} color="#d6d2cb" /></mesh>
      <mesh position={[0, 0.02, 2.35]} receiveShadow><boxGeometry args={[1.6, 0.06, 0.5]} /><meshStandardMaterial {...pavers} color="#d6d2cb" /></mesh>
      {/* Terrasse */}
      <mesh position={[-4.4, 0.06, 0.8]} receiveShadow castShadow><boxGeometry args={[2.0, 0.12, 3.2]} /><meshStandardMaterial {...deck} color="#e0cdb4" /></mesh>
      <group ref={scenery}>
        {bushes.map((b, i) => (
          <ExternalModelLoader key={i} file={b.id} height={b.s} position={b.p} rotation={[0, b.r, 0]} fallback={null} />
        ))}
        <ExternalModelLoader file="ph:fern_02" height={0.6} position={[-0.9, 0, 2.7]} />
        <ExternalModelLoader file="ph:fern_02" height={0.6} position={[0.9, 0, 2.7]} />
        <Lamp p={[-1.1, 0, 3.6]} /><Lamp p={[1.1, 0, 3.6]} />
      </group>
      {/* Schornstein */}
      <mesh position={[-1.6, 6.9, -0.9]} castShadow><boxGeometry args={[0.45, 1.3, 0.45]} /><meshStandardMaterial {...found} color="#9a8a80" roughness={0.95} /></mesh>
      <mesh position={[-1.6, 7.58, -0.9]}><boxGeometry args={[0.58, 0.08, 0.58]} /><meshStandardMaterial color="#2a3139" metalness={0.6} roughness={0.4} /></mesh>
    </group>
  )
}

/** Solarmodule auf der Südseite des Dachs (Teil der Dachgruppe, +z-Seite) */
export function SolarPanels() {
  return (
    <group position={[0.6, 0.085, 0.1]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 1.45 - 1.4, 0, 0]}>
          <boxGeometry args={[1.35, 0.03, 1.5]} />
          <meshPhysicalMaterial color="#0d2447" roughness={0.12} metalness={0.7} clearcoat={1} emissive="#0c3f8a" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  )
}
