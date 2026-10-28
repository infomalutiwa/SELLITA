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
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.5, 0.5, 1.8, 40]} /><meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.2} /></mesh>
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
        <mesh position={[0.28, 1.0, 0.36]}><boxGeometry args={[0.28, 0.12, 0.02]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
      </group>
      {/* Heizkörper */}
      <group position={[2.0, 0.55, -1.75]}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[(i - 4) * 0.13, 0.4, 0]}>
            <boxGeometry args={[0.09, 0.8, 0.07]} />
            <meshStandardMaterial ref={i === 0 ? rad : undefined} color="#f8fafc" roughness={0.3} emissive="#ff4a1c" emissiveIntensity={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.78, 0]}><boxGeometry args={[1.2, 0.04, 0.09]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
        <mesh position={[0, 0.02, 0]}><boxGeometry args={[1.2, 0.04, 0.09]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
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
