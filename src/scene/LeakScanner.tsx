import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { S, smooth } from '../state'
import { LEAK } from './layout'

const vis = () => smooth(0.5, 0.56, S.p) * (1 - smooth(0.72, 0.76, S.p))

/** Leckortung: Putz wird transparent, Sonar-Ring scannt das Rohr, Schadstelle wird markiert. */
export function LeakScanner() {
  const root = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const ringMat = useRef<MeshBasicMaterial>(null)
  const plaster = useRef<MeshStandardMaterial>(null)
  const sonar = useRef<Group>(null)
  const cross = useRef<Group>(null)
  const dot = useRef<Mesh>(null)
  const label = useRef<HTMLDivElement>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const v = vis()
    if (root.current) root.current.visible = v > 0.001
    // Scan-Ring wandert entlang des Rohrs
    const scan = (Math.sin(t * 0.9) * 0.5 + 0.5)
    if (ring.current) ring.current.position.x = 0.55 + scan * 2.3
    if (ringMat.current) ringMat.current.opacity = v
    if (plaster.current) plaster.current.opacity = 0.92 * smooth(0.5, 0.54, S.p) * (1 - smooth(0.56, 0.62, S.p))
    // Pulsierende Schadstelle + Sonar-Wellen
    const found = smooth(0.58, 0.63, S.p)
    if (dot.current) dot.current.scale.setScalar((0.6 + 0.4 * Math.sin(t * 7)) * found + 0.001)
    sonar.current?.children.forEach((c, i) => {
      const k = (t * 0.7 + i / 3) % 1
      c.scale.setScalar(0.1 + k * 1.1)
      ;((c as Mesh).material as MeshBasicMaterial).opacity = (1 - k) * 0.7 * found
    })
    if (cross.current) { cross.current.scale.setScalar(0.4 + 0.6 * found); cross.current.rotation.z = (1 - found) * 1.5 + t * 0.15 }
    if (label.current) label.current.style.opacity = String(found * v)
  })

  return (
    <group ref={root} visible={false}>
      {/* Verputzte Wand vor dem Rohr */}
      <mesh position={[1.8, 1.65, -0.95]}>
        <boxGeometry args={[3.0, 1.9, 0.08]} />
        <meshStandardMaterial ref={plaster} color="#e8e4dc" roughness={1} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {/* Scan-Ring um das Rohr (Achse = x) */}
      <mesh ref={ring} position={[1.8, LEAK[1], LEAK[2]]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.2, 0.012, 8, 56]} />
        <meshBasicMaterial ref={ringMat} color="#38bdf8" transparent toneMapped={false} />
      </mesh>
      <Billboard position={LEAK}>
        <group ref={sonar}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}><ringGeometry args={[0.9, 1, 48]} /><meshBasicMaterial color="#38bdf8" transparent depthWrite={false} toneMapped={false} /></mesh>
          ))}
        </group>
        <group ref={cross}>
          <mesh><ringGeometry args={[0.34, 0.36, 48]} /><meshBasicMaterial color="#ff4a2a" toneMapped={false} /></mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
              <planeGeometry args={[0.012, 0.22]} />
              <meshBasicMaterial color="#ff4a2a" toneMapped={false} />
            </mesh>
          ))}
        </group>
        <mesh ref={dot}><circleGeometry args={[0.06, 20]} /><meshBasicMaterial color="#ff5722" toneMapped={false} /></mesh>
      </Billboard>
      <Html position={[LEAK[0] + 0.5, LEAK[1] + 0.55, LEAK[2]]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className="lbl3d" style={{ opacity: 0, borderColor: '#ff5722' }}>● Schadstelle erkannt</div>
      </Html>
    </group>
  )
}
