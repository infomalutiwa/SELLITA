import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute, BufferGeometry, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, AdditiveBlending,
  type Group, type Points,
} from 'three'
import { S, clamp01, smooth } from '../state'
import { ExternalModelLoader } from './ExternalModelLoader'

const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
const bounce = (t: number) => {
  t = clamp01(t)
  return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.2) // overshoot-settle
}

const TILE_MAT = new MeshPhysicalMaterial({ color: '#f8fafc', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.1 })

/** Badsanierung: Altbestand wird demontiert, Fliesen klappen an, Wanne/Waschtisch/Dusche setzen sich zusammen. */
export function BathroomCutaway() {
  const oldRef = useRef<Group>(null)
  const oldMat = useMemo(() => new MeshStandardMaterial({ color: '#b8a98c', roughness: 0.9, transparent: true }), [])
  const tiles = useRef<Group>(null)
  const tub = useRef<Group>(null)
  const basin = useRef<Group>(null)
  const glass = useRef<Group>(null)
  const shower = useRef<Group>(null)
  const drops = useRef<Points>(null)

  const tileList = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number]; r: 'wall' | 'floor' | 'side' }[] = []
    const x0 = 0.78, cw = 0.78
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) out.push({ p: [x0 + cw * (c + 0.5), 2.72 + 0.6 * (r + 0.5), -1.86], s: [cw - 0.02, 0.58], r: 'wall' })
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) out.push({ p: [x0 + cw * (c + 0.5), 2.76, -1.55 + 0.9 * (r + 0.5) - 0.35], s: [cw - 0.02, 0.88], r: 'floor' })
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) out.push({ p: [0.7, 2.72 + 0.6 * (r + 0.5), -1.55 + 1.1 * (c + 0.5)], s: [1.08, 0.58], r: 'side' })
    return out
  }, [])

  const N = S.mobile ? 140 : 420
  const dropGeo = useMemo(() => {
    const g = new BufferGeometry()
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.42
      seed[i * 3] = Math.cos(a) * r; seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.sin(a) * r
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.userData.seed = seed
    return g
  }, [N])
  useEffect(() => () => dropGeo.dispose(), [dropGeo])

  const latheGeo = useMemo(() => {
    const prof = [[0.0, 0.0], [0.3, 0.0], [0.38, 0.06], [0.43, 0.5], [0.41, 0.54], [0.36, 0.5], [0.3, 0.1], [0.0, 0.07]].map(([x, y]) => new Vector2(x, y))
    return new LatheGeometry(prof, 48)
  }, [])

  useFrame(({ clock }) => {
    const b = (S.p - 0.35) / 0.2
    const t = clock.elapsedTime
    // Altbestand rutscht heraus (Möbel demontieren)
    const out = clamp01((b - 0.02) / 0.22)
    if (oldRef.current) {
      const e = out * out * (3 - 2 * out)
      oldRef.current.visible = S.p > 0.3 && out < 1
      oldRef.current.position.set(0, e * 0.6, e * 4.6)
      oldRef.current.rotation.z = Math.sin(t * 30) * 0.02 * (out > 0 && out < 1 ? 1 : 0)
      oldMat.opacity = 1 - smooth(0.6, 1, out)
    }
    // Fliesen klappen an
    tiles.current?.children.forEach((c, i) => {
      const k = clamp01((b - 0.24 - i * 0.008) / 0.14)
      c.rotation.x = (1 - ease(k)) * Math.PI * 0.5
      c.scale.setScalar(Math.max(0.0001, ease(k * 1.4)))
      c.visible = k > 0
    })
    // Neue Möbel setzen sich zusammen
    const kt = clamp01((b - 0.5) / 0.2)
    if (tub.current) { tub.current.visible = kt > 0; tub.current.position.y = 2.72 + (1 - bounce(kt)) * 3.2 }
    const kb = clamp01((b - 0.6) / 0.18)
    if (basin.current) { basin.current.visible = kb > 0; basin.current.position.x = 1.6 - (1 - ease(kb)) * 3.5 }
    const kg = clamp01((b - 0.7) / 0.16)
    if (glass.current) { glass.current.visible = kg > 0; glass.current.position.y = 2.72 + (1 - ease(kg)) * 2.5 }
    const ks = clamp01((b - 0.78) / 0.12)
    if (shower.current) { shower.current.visible = ks > 0; shower.current.scale.setScalar(Math.max(0.001, ease(ks))) }
    // Regen
    if (drops.current) {
      const on = S.p > 0.46 && S.p < 0.8
      drops.current.visible = on
      if (on) {
        const pos = dropGeo.attributes.position as BufferAttribute
        const seed = dropGeo.userData.seed as Float32Array
        for (let i = 0; i < N; i++) {
          const f = (seed[i * 3 + 1] + t * (0.9 + (i % 5) * 0.08)) % 1
          pos.setXYZ(i, 2.55 + seed[i * 3] * (0.5 + f * 0.6), 4.5 - f * 1.76, -1.35 + seed[i * 3 + 2] * (0.5 + f * 0.6))
        }
        pos.needsUpdate = true
      }
    }
  })

  return (
    <group>
      {/* Altbestand */}
      <group ref={oldRef} visible={false}>
        <mesh position={[1.7, 3.0, -1.1]} material={oldMat}><boxGeometry args={[1.5, 0.55, 0.7]} /></mesh>
        <mesh position={[1.0, 3.1, -0.2]} material={oldMat}><cylinderGeometry args={[0.22, 0.28, 0.55, 16]} /></mesh>
        <mesh position={[2.5, 3.3, -1.55]} material={oldMat}><boxGeometry args={[0.7, 0.9, 0.5]} /></mesh>
        <mesh position={[1.3, 3.7, -1.85]} material={oldMat}><boxGeometry args={[0.8, 0.5, 0.1]} /></mesh>
      </group>

      {/* Großformat-Fliesen */}
      <group ref={tiles}>
        {tileList.map((t, i) => (
          <mesh key={i} position={t.p} material={TILE_MAT} rotation={t.r === 'floor' ? [-Math.PI / 2, 0, 0] : t.r === 'side' ? [0, Math.PI / 2, 0] : [0, 0, 0]} visible={false}>
            <boxGeometry args={[t.s[0], t.s[1], 0.04]} />
          </mesh>
        ))}
      </group>

      {/* Freistehende Badewanne (Kenney CC0, Fallback: Lathe-Mesh) */}
      <group ref={tub} position={[1.5, 2.72, 0.3]} visible={false}>
        <ExternalModelLoader file="bathtub.glb" length={1.8} rotation={[0, Math.PI / 2, 0]} roughness={0.12}
          fallback={
            <group>
              <mesh geometry={latheGeo} scale={[1, 1, 2.0]}><meshPhysicalMaterial color="#ffffff" roughness={0.1} clearcoat={1} side={2} /></mesh>
              <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 2.0, 1]}><circleGeometry args={[0.37, 40]} /><meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.6} transparent opacity={0.75} /></mesh>
            </group>
          } />
      </group>

      {/* Waschtisch + Spiegel + Unterschrank + WC */}
      <group ref={basin} position={[1.6, 0, -1.6]} visible={false}>
        <ExternalModelLoader file="bathroomSink.glb" height={1.0} position={[0, 2.72, 0.08]}
          fallback={
            <group>
              <mesh position={[0, 3.2, 0]}><boxGeometry args={[0.9, 0.38, 0.42]} /><meshStandardMaterial color="#2a3139" roughness={0.45} /></mesh>
              <mesh position={[0, 3.45, 0.02]}><boxGeometry args={[0.92, 0.06, 0.46]} /><meshPhysicalMaterial color="#ffffff" roughness={0.1} clearcoat={1} /></mesh>
            </group>
          } />
        <ExternalModelLoader file="bathroomMirror.glb" height={0.95} position={[0, 3.85, -0.2]} roughness={0.05} metalness={0.6} />
        <ExternalModelLoader file="bathroomCabinetDrawer.glb" height={0.82} position={[-0.62, 2.72, 0.15]} tint="#e8eef5" />
        <ExternalModelLoader file="toilet.glb" height={0.85} position={[-0.7, 2.72, 2.95]} rotation={[0, Math.PI / 2 + 0.0, 0]} />
        <mesh position={[0, 4.3, -0.22]}><boxGeometry args={[0.8, 0.02, 0.03]} /><meshBasicMaterial color="#9ad8ff" toneMapped={false} /></mesh>
      </group>

      {/* Walk-In-Dusche */}
      <mesh position={[2.55, 2.74, -1.35]}><boxGeometry args={[1.0, 0.06, 1.0]} /><meshPhysicalMaterial color="#ffffff" roughness={0.2} clearcoat={0.8} /></mesh>
      <group ref={glass} position={[0, 2.72, 0]} visible={false}>
        <mesh position={[2.05, 1.05, -1.35]}><boxGeometry args={[0.02, 2.1, 1.0]} /><meshPhysicalMaterial color="#bfe8ff" transparent opacity={0.28} roughness={0.02} /></mesh>
        <mesh position={[2.05, 2.12, -1.35]}><boxGeometry args={[0.04, 0.03, 1.0]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.2} /></mesh>
      </group>
      <group ref={shower} position={[2.55, 4.55, -1.4]} visible={false}>
        <mesh><cylinderGeometry args={[0.24, 0.24, 0.025, 32]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.15} /></mesh>
        <mesh position={[0, 0.2, -0.3]}><cylinderGeometry args={[0.015, 0.015, 0.4, 8]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.15} /></mesh>
      </group>
      <points ref={drops} geometry={dropGeo} frustumCulled={false} visible={false}>
        <pointsMaterial color="#7fd8ff" size={S.mobile ? 0.05 : 0.04} transparent opacity={0.85} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  )
}
