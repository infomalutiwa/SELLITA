import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, type Mesh, type MeshStandardMaterial } from 'three'
import { S, bump } from '../state'

const heat = () => 0.4 + 1.6 * bump(0.1, 0.17, 0.3, 0.4, S.p)

/** Heizungs-/Technikraum: Warmwasserspeicher, Wärmepumpe, Heizkörper (alles prozedural). */
export function Technik() {
  const rad = useRef<MeshStandardMaterial>(null)
  const col = useMemo(() => new Color('#ff4a1c'), [])
  useFrame(() => {
    if (rad.current) { rad.current.emissive.copy(col); rad.current.emissiveIntensity = heat() * 0.9 * (0.5 + 0.5 * S.ren) }
  })
  return (
    <group>
      {/* Warmwasserspeicher */}
      <group position={[-2.6, 0.2, -1.0]}>
        <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.5, 0.5, 1.8, 40]} /><meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.2} /></mesh>
        <mesh position={[0, 1.82, 0]}><sphereGeometry args={[0.5, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.2} /></mesh>
        <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.51, 0.51, 0.06, 40]} /><meshBasicMaterial color="#ef4444" toneMapped={false} /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.51, 0.51, 0.06, 40]} /><meshBasicMaterial color="#0ea5e9" toneMapped={false} /></mesh>
      </group>
      {/* Wärmepumpe / Heizkessel */}
      <group position={[-1.3, 0.2, -1.2]}>
        <mesh position={[0, 0.6, 0]}><boxGeometry args={[1.0, 1.2, 0.7]} /><meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.5} /></mesh>
        <mesh position={[0, 0.7, 0.36]}>
          <torusGeometry args={[0.3, 0.025, 8, 40]} /><meshStandardMaterial color="#1e242b" />
        </mesh>
        <Fan />
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-0.28, 0.22 + i * 0.1, 0.355]}><boxGeometry args={[0.28, 0.025, 0.02]} /><meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} /></mesh>
        ))}
        <mesh position={[0.28, 0.45, 0.355]}><boxGeometry args={[0.26, 0.4, 0.015]} /><meshStandardMaterial color="#1e242b" roughness={0.3} metalness={0.5} /></mesh>
        <mesh position={[0.28, 0.5, 0.365]}><planeGeometry args={[0.18, 0.1]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
        <mesh position={[0.28, 1.0, 0.36]}><boxGeometry args={[0.28, 0.12, 0.02]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
      </group>
      {/* Design-Heizkörper: Doppelpanel + Konvektorlamellen + Thermostatkopf */}
      <group position={[2.0, 0.55, -1.75]}>
        {[0, 0.07].map((z, k) => (
          <mesh key={k} position={[0, 0.4, z]}>
            <boxGeometry args={[1.3, 0.72, 0.035]} />
            <meshStandardMaterial ref={k === 0 ? rad : undefined} color="#f8fafc" roughness={0.28} metalness={0.15} emissive="#ff4a1c" emissiveIntensity={0.3} />
          </mesh>
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <mesh key={i} position={[(i - 10.5) * 0.057, 0.4, 0.035]}><boxGeometry args={[0.012, 0.68, 0.05]} /><meshStandardMaterial color="#e2e8f0" roughness={0.35} /></mesh>
        ))}
        <mesh position={[0, 0.78, 0.035]}><boxGeometry args={[1.32, 0.03, 0.14]} /><meshStandardMaterial color="#eef2f6" roughness={0.3} /></mesh>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[(i - 7.5) * 0.08, 0.797, 0.035]}><boxGeometry args={[0.035, 0.006, 0.12]} /><meshStandardMaterial color="#9aa5b1" /></mesh>
        ))}
        {[-0.67, 0.67].map((x) => (
          <mesh key={x} position={[x, 0.4, 0.035]}><boxGeometry args={[0.025, 0.74, 0.12]} /><meshStandardMaterial color="#f1f5f9" roughness={0.3} /></mesh>
        ))}
        {/* Ventil + Thermostatkopf */}
        <mesh position={[0.5, 0.0, 0.04]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.1, 12]} /><meshStandardMaterial color="#d7dde5" metalness={1} roughness={0.2} /></mesh>
        <mesh position={[0.5, -0.07, 0.04]}><cylinderGeometry args={[0.045, 0.045, 0.1, 20]} /><meshStandardMaterial color="#ffffff" roughness={0.3} /></mesh>
        <mesh position={[0.5, -0.12, 0.04]}><cylinderGeometry args={[0.047, 0.047, 0.012, 20]} /><meshBasicMaterial color="#ef4444" toneMapped={false} /></mesh>
        <mesh position={[-0.5, 0.0, 0.04]}><cylinderGeometry args={[0.025, 0.025, 0.1, 12]} /><meshStandardMaterial color="#d7dde5" metalness={1} roughness={0.2} /></mesh>
      </group>
      <RadiatorGlow />
    </group>
  )
}

function Fan() {
  const ref = useRef<Mesh>(null)
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * (1.5 + 6 * bump(0.1, 0.17, 0.3, 0.4, S.p)) })
  return (
    <mesh ref={ref} position={[0, 0.7, 0.36]}>
      <group>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]} position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.55, 0.01]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
      </group>
    </mesh>
  )
}

// Rot-oranger Dunst um den Heizkörper
function RadiatorGlow() {
  const ref = useRef<MeshStandardMaterial>(null)
  useFrame(() => { if (ref.current) ref.current.opacity = 0.05 * heat() })
  return (
    <mesh position={[2.0, 0.95, -1.5]}>
      <planeGeometry args={[1.6, 1.3]} />
      <meshStandardMaterial ref={ref} color="#ff5722" emissive="#ff5722" emissiveIntensity={1} transparent opacity={0.1} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
