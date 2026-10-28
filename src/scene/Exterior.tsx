import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { S, smooth } from '../state'
import { grassTexture } from './textures'

const Tree = ({ p, s = 1, c = '#2f6b4a' }: { p: [number, number, number]; s?: number; c?: string }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.1, 0.16, 1.4, 8]} /><meshStandardMaterial color="#5b4636" roughness={1} /></mesh>
    {[[0, 2.0, 0, 0.9], [0.25, 2.7, 0.1, 0.65], [-0.15, 3.2, -0.05, 0.42]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={c} roughness={0.9} flatShading /></mesh>
    ))}
  </group>
)
const Bush = ({ p, s = 1 }: { p: [number, number, number]; s?: number }) => (
  <mesh position={p} scale={[s, s * 0.75, s]} castShadow><icosahedronGeometry args={[0.38, 1]} /><meshStandardMaterial color="#3b7d55" roughness={0.9} flatShading /></mesh>
)
const Lamp = ({ p }: { p: [number, number, number] }) => (
  <group position={p}>
    <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 8]} /><meshStandardMaterial color="#1e242b" metalness={0.8} roughness={0.3} /></mesh>
    <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#ffd9a0" toneMapped={false} /></mesh>
    <pointLight position={[0, 0.55, 0]} intensity={1.2} distance={2.6} color="#ffcf8a" />
  </group>
)

/** Garten: Rasen, Weg, Zaun, Bäume, Terrasse, Außeneinheit der Wärmepumpe, Solarmodule, Schornstein. */
export function Exterior() {
  const grass = useMemo(() => grassTexture(), [])
  const scenery = useRef<Group>(null)
  // Bäume/Büsche/Zaun blenden aus, sobald der Röntgen-Blick läuft (sonst verdecken sie die Kamera)
  useFrame(() => { if (scenery.current) scenery.current.visible = S.free ? !S.xrayForce : S.p < 0.07 || S.p > 0.9 })
  return (
    <group>
      {/* Rasenfläche auf dem Sockel */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.7, 64]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      {/* Weg zur Haustür */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[((i % 2) - 0.5) * 0.08, 0.02, 2.5 + i * 0.52]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.1, 0.42]} /><meshStandardMaterial color="#cfd6de" roughness={0.8} />
        </mesh>
      ))}
      {/* Terrasse links */}
      <mesh position={[-4.2, 0.03, 0.8]} receiveShadow><boxGeometry args={[1.8, 0.06, 3]} /><meshStandardMaterial color="#8b7355" roughness={0.9} /></mesh>
      <group ref={scenery}>
      {/* Vorgarten-Beet */}
      {[-3, -2.4, -1.8, 1.8, 2.4, 3].map((x, i) => <Bush key={x} p={[x, 0.28, 2.65 - (i % 2) * 0.1]} s={0.9 + (i % 3) * 0.15} />)}
      {/* Bäume */}
      <Tree p={[-4.4, 0, -3.2]} s={1.15} />
      <Tree p={[4.5, 0, -2.6]} s={1.3} c="#3a7a52" />
      <Tree p={[4.0, 0, 3.4]} s={0.8} c="#4a8a5a" />
      <Bush p={[-4.6, 0.28, 2.8]} s={1.2} /><Bush p={[-3.9, 0.28, -0.6]} s={1} />
      <Lamp p={[-0.9, 0, 3.4]} /><Lamp p={[0.9, 0, 3.4]} />
      {/* Zaun */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = Math.PI * 1.04 + (i / 21) * Math.PI * 0.92
        return <mesh key={i} position={[Math.cos(a) * 5.35, 0.3, Math.sin(a) * 5.35]} rotation={[0, -a + Math.PI / 2, 0]}><boxGeometry args={[0.07, 0.6, 0.04]} /><meshStandardMaterial color="#e2e8f0" roughness={0.6} /></mesh>
      })}
      </group>
      {/* Schornstein (Abgas) */}
      <mesh position={[-1.6, 6.9, -0.9]} castShadow><boxGeometry args={[0.45, 1.3, 0.45]} /><meshStandardMaterial color="#8a6f62" roughness={0.9} /></mesh>
      <mesh position={[-1.6, 7.58, -0.9]}><boxGeometry args={[0.58, 0.08, 0.58]} /><meshStandardMaterial color="#2a3139" metalness={0.5} roughness={0.4} /></mesh>
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
