import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { S, bump } from '../state'

const chrome = { color: '#d7dde5', metalness: 1, roughness: 0.18 } as const
const blue = <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.6} roughness={0.4} />
const red = <meshStandardMaterial color="#c98b5b" metalness={1} roughness={0.3} />

/** Hausanschluss (Sanitär): Wasserzähler, Druckminderer und Verteilerbalken mit Absperrventilen. */
export function Technik() {
  const needle = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (needle.current) needle.current.rotation.z = -clock.elapsedTime * (0.8 + 4 * bump(0.1, 0.17, 0.35, 0.45, S.p))
  })
  return (
    <group position={[0, 0, -1.78]}>
      {/* Wasserzähler */}
      <group position={[-2.9, 0.78, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.55, 20]} /><meshStandardMaterial {...chrome} /></mesh>
        <mesh position={[0, 0.02, 0.0]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.14, 32]} /><meshStandardMaterial color="#1e242b" roughness={0.4} /></mesh>
        <mesh position={[0, 0.02, 0.075]}><circleGeometry args={[0.14, 32]} /><meshStandardMaterial color="#f8fafc" roughness={0.2} /></mesh>
        <mesh position={[0, 0.02, 0.08]} ref={needle}><boxGeometry args={[0.012, 0.11, 0.004]} /><meshBasicMaterial color="#0ea5e9" toneMapped={false} /></mesh>
        <mesh position={[0, 0.02, 0.088]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.15, 0.012, 8, 32]} /><meshStandardMaterial {...chrome} /></mesh>
        {[-0.32, 0.32].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.05, 6]} /><meshStandardMaterial {...chrome} /></mesh>)}
      </group>
      {/* Druckminderer */}
      <group position={[-2.45, 0.62, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.08, 0.08, 0.26, 20]} /><meshStandardMaterial color="#b9792e" metalness={1} roughness={0.3} /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.12, 0.12, 0.1, 24]} /><meshStandardMaterial color="#9aa5b1" metalness={0.9} roughness={0.25} /></mesh>
        <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial {...chrome} /></mesh>
      </group>
      {/* Verteilerbalken: Kalt (blau) + Warm (rot) mit Kugelhähnen */}
      {[{ y: 1.25, z: 0, mat: red }, { y: 0.85, z: 0, mat: blue }].map((b) => (
        <group key={b.y} position={[-1.8, b.y, b.z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.065, 0.065, 1.2, 20]} /><meshStandardMaterial {...chrome} /></mesh>
          {[-0.45, -0.15, 0.15, 0.45].map((x) => (
            <group key={x} position={[x, 0, 0.09]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.14, 12]} /><meshStandardMaterial {...chrome} /></mesh>
              <mesh position={[0, 0, 0.1]}><sphereGeometry args={[0.045, 12, 12]} /><meshStandardMaterial {...chrome} /></mesh>
              <mesh position={[0, 0.05, 0.1]}><boxGeometry args={[0.012, 0.1, 0.012]} /><meshStandardMaterial {...chrome} /></mesh>
              <mesh position={[0, 0.1, 0.1]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.1, 0.03, 0.02]} />{b.mat}</mesh>
            </group>
          ))}
        </group>
      ))}
      {/* Beschriftung */}
      <mesh position={[-1.8, 1.5, 0.02]}><boxGeometry args={[0.9, 0.12, 0.01]} /><meshStandardMaterial color="#1e242b" /></mesh>
      <mesh position={[-1.8, 1.5, 0.03]}><planeGeometry args={[0.8, 0.02]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
    </group>
  )
}
