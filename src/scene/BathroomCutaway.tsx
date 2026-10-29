import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, LatheGeometry, MeshPhysicalMaterial, SplineCurve, Vector2,
  type Group, type Points,
} from 'three'
import { S, clamp01, smooth } from '../state'
import { ExternalModelLoader } from './ExternalModelLoader'
import { usePbr } from './pbr'
import { LayerLabel } from './LayerLabel'

const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
const bounce = (t: number) => {
  t = clamp01(t)
  return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.2) // overshoot-settle
}

const lathe = (pts: [number, number][], seg = 64) =>
  new LatheGeometry(new SplineCurve(pts.map(([x, y]) => new Vector2(x, y))).getPoints(90), seg)

const Chrome = () => <meshStandardMaterial color="#e6ebf0" metalness={1} roughness={0.08} envMapIntensity={1.6} />

// Bad-Zeitfenster: b = 0..1 zwischen p 0.40 und 0.55
const bathT = () => (S.p - 0.4) / 0.15
// Explosionsansicht: Schichten fahren auseinander und setzen sich wieder zusammen
const explode = () => { const b = bathT(); return smooth(0.12, 0.3, b) * (1 - smooth(0.7, 0.88, b)) }
const TILE_Z = -1.57

/** Badsanierung als Explosionsansicht: Rohre -> Abdichtung -> Fliesen -> Sanitärobjekte (Wanne, Waschtisch, Dusche). */
export function BathroomCutaway() {
  const oldRef = useRef<Group>(null)
  const tiles = useRef<Group>(null)
  const tub = useRef<Group>(null)
  const basin = useRef<Group>(null)
  const glass = useRef<Group>(null)
  const shower = useRef<Group>(null)
  const drops = useRef<Points>(null)
  const seal = useRef<Group>(null)
  const objs = useRef<Group>(null)

  const marble = usePbr('marble_01', [0.5, 0.45], { roughness: 0.55 })
  const oak = usePbr('oak_wood_planks', [0.5, 0.35], { metalness: 0 })
  const ceramic = useMemo(() => new MeshPhysicalMaterial({ color: '#fbfbfa', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3 }), [])

  const tileList = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number]; r: 'wall' | 'floor' | 'side' }[] = []
    const x0 = 0.78, cw = 0.78
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) out.push({ p: [x0 + cw * (c + 0.5), 2.72 + 0.6 * (r + 0.5), TILE_Z], s: [cw - 0.004, 0.596], r: 'wall' })
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) out.push({ p: [x0 + cw * (c + 0.5), 2.76, -1.55 + 0.9 * (r + 0.5) - 0.35], s: [cw - 0.004, 0.896], r: 'floor' })
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) out.push({ p: [0.7, 2.72 + 0.6 * (r + 0.5), -1.55 + 1.1 * (c + 0.5)], s: [1.096, 0.596], r: 'side' })
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

  const tubGeo = useMemo(() => lathe([[0.001, 0.0], [0.26, 0.0], [0.36, 0.04], [0.42, 0.2], [0.445, 0.46], [0.44, 0.53], [0.415, 0.55], [0.39, 0.53], [0.385, 0.5], [0.36, 0.44], [0.33, 0.2], [0.27, 0.1], [0.001, 0.085]]), [])
  const bowlGeo = useMemo(() => lathe([[0.001, 0.0], [0.09, 0.0], [0.15, 0.06], [0.2, 0.14], [0.205, 0.16], [0.19, 0.16], [0.18, 0.13], [0.12, 0.06], [0.001, 0.03]], 48), [])

  useFrame(({ clock }) => {
    const b = bathT()
    const t = clock.elapsedTime
    const X = explode()
    // 0 · Altbestand wird demontiert und fährt heraus
    const out = clamp01((b - 0.0) / 0.14)
    if (oldRef.current) {
      const e = out * out * (3 - 2 * out)
      oldRef.current.visible = S.p > 0.3 && out < 1
      oldRef.current.position.set(0, e * 0.6, e * 4.6)
      oldRef.current.rotation.z = Math.sin(t * 30) * 0.02 * (out > 0 && out < 1 ? 1 : 0)
      oldRef.current.scale.setScalar(1 - 0.5 * smooth(0.7, 1, out))
    }
    // 2 · Abdichtung wird von unten nach oben aufgetragen
    const ks = clamp01((b - 0.1) / 0.16)
    seal.current?.children.forEach((c, i) => {
      const n = c.userData.n as [number, number, number]
      const base = c.userData.base as [number, number, number]
      c.visible = ks > 0
      const k = Math.max(0.001, ease(ks))
      if (i === 1) c.scale.set(1, 1, k); else c.scale.set(1, k, 1)
      const h = c.userData.h as number
      c.position.set(base[0] + n[0] * 0.35 * X, (i === 1 ? base[1] : 2.72 + (h * k) / 2) + n[1] * 0.22 * X, base[2] + n[2] * 0.35 * X)
    })
    // 3 · Fliesen klappen an (in der Explosion vor der Abdichtung)
    tiles.current?.children.forEach((c, i) => {
      const tl = tileList[i]
      const k = clamp01((b - 0.25 - i * 0.005) / 0.14)
      const off = tl.r === 'floor' ? 0.45 * X : 0.75 * X
      c.position.set(tl.p[0] + (tl.r === 'side' ? off : 0), tl.p[1] + (tl.r === 'floor' ? off : 0), tl.p[2] + (tl.r === 'wall' ? off : 0))
      c.rotation.x = (tl.r === 'floor' ? -Math.PI / 2 : 0) + (1 - ease(k)) * Math.PI * 0.5
      c.scale.setScalar(Math.max(0.0001, ease(k * 1.4)))
      c.visible = k > 0
    })
    // 4 · Sanitärobjekte setzen sich zusammen (ganz vorne in der Explosion)
    if (objs.current) objs.current.position.set(0, 1.0 * X, 0.8 * X)
    const kt = clamp01((b - 0.42) / 0.18)
    if (tub.current) { tub.current.visible = kt > 0; tub.current.position.y = 2.72 + (1 - bounce(kt)) * 3.2 }
    const kb = clamp01((b - 0.5) / 0.16)
    if (basin.current) { basin.current.visible = kb > 0; basin.current.position.x = 1.6 - (1 - ease(kb)) * 3.5 }
    const kg = clamp01((b - 0.58) / 0.14)
    if (glass.current) { glass.current.visible = kg > 0; glass.current.position.y = 2.72 + (1 - ease(kg)) * 2.5 }
    const kh = clamp01((b - 0.64) / 0.12)
    if (shower.current) { shower.current.visible = kh > 0; shower.current.scale.setScalar(Math.max(0.001, ease(kh))) }
    // Regen
    if (drops.current) {
      const on = S.p > 0.52 && S.p < 0.62
      drops.current.visible = on
      if (on) {
        const pos = dropGeo.attributes.position as BufferAttribute
        const seed = dropGeo.userData.seed as Float32Array
        for (let i = 0; i < N; i++) {
          const f = (seed[i * 3 + 1] + t * (0.9 + (i % 5) * 0.08)) % 1
          pos.setXYZ(i, 2.55 + seed[i * 3] * (0.5 + f * 0.6), 4.5 - f * 1.76, -1.25 + seed[i * 3 + 2] * (0.45 + f * 0.5))
        }
        pos.needsUpdate = true
      }
    }
  })

  return (
    <group>
      {/* Altbestand: vergilbte Wanne, WC, abgenutzter Schrank (Poly Haven, fotogescannt) */}
      <group ref={oldRef} visible={false}>
        <mesh position={[1.7, 3.0, -1.1]} castShadow><boxGeometry args={[1.5, 0.55, 0.7]} /><meshStandardMaterial color="#cdbf9f" roughness={0.55} /></mesh>
        <mesh position={[1.7, 3.28, -1.1]}><boxGeometry args={[1.3, 0.02, 0.5]} /><meshStandardMaterial color="#8d7f66" roughness={0.9} /></mesh>
        <mesh position={[1.0, 3.1, -0.2]} castShadow><cylinderGeometry args={[0.22, 0.28, 0.55, 24]} /><meshStandardMaterial color="#d3c6a8" roughness={0.5} /></mesh>
        <ExternalModelLoader file="ph:painted_wooden_cabinet" height={1.1} position={[2.55, 2.72, -1.5]} fallback={null} />
      </group>

      {/* Abdichtung (Flüssigabdichtung + Dichtband), blau */}
      <group ref={seal}>
        {([
          { base: [1.95, 3.92, TILE_Z - 0.035], size: [2.36, 2.4, 0.012], n: [0, 0, 1], h: 2.4 },
          { base: [1.89, 2.735, -0.1], size: [2.46, 0.012, 3.6], n: [0, 1, 0], h: 0 },
          { base: [0.68, 3.92, -0.1], size: [0.012, 2.4, 3.6], n: [1, 0, 0], h: 2.4 },
        ] as const).map((l, i) => (
          <mesh key={i} position={l.base as unknown as [number, number, number]} userData={{ base: l.base, n: l.n, h: l.h }} visible={false}>
            <boxGeometry args={l.size as unknown as [number, number, number]} />
            <meshStandardMaterial color="#1683c4" roughness={0.6} />
          </mesh>
        ))}
      </group>
      <LayerLabel n={1} text="Rohre" position={[0.5, 3.75, -1.7]} vis={() => explode()} />
      <LayerLabel n={2} text="Abdichtung" position={[1.1, 4.95, -1.25]} vis={() => explode()} />
      <LayerLabel n={3} text="Fliesen" position={[2.7, 5.0, -0.85]} vis={() => explode()} />
      <LayerLabel n={4} text="Sanitärobjekte" position={[1.5, 4.3, 1.05]} vis={() => explode()} color="#ffffff" />

      {/* Großformat-Marmorfliesen */}
      <group ref={tiles}>
        {tileList.map((t, i) => (
          <mesh key={i} position={t.p} rotation={t.r === 'floor' ? [-Math.PI / 2, 0, 0] : t.r === 'side' ? [0, Math.PI / 2, 0] : [0, 0, 0]} visible={false} receiveShadow>
            <boxGeometry args={[t.s[0], t.s[1], 0.04]} />
            <meshPhysicalMaterial {...marble} map={null} color="#e7e9ea" roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.08} />
          </mesh>
        ))}
      </group>

      <group ref={objs}>
      {/* Freistehende Badewanne (glatte Keramik) mit Standarmatur und Holzablage */}
      <group ref={tub} position={[1.5, 2.72, 0.3]} visible={false}>
        <mesh geometry={tubGeo} scale={[1, 1, 2.05]} material={ceramic} castShadow receiveShadow />
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 2.05, 1]}>
          <circleGeometry args={[0.375, 48]} /><meshPhysicalMaterial color="#9fd6ee" transmission={0.5} thickness={0.2} roughness={0.02} ior={1.33} transparent opacity={0.85} />
        </mesh>
        {[[-0.22, -0.55], [0.22, -0.55], [-0.22, 0.55], [0.22, 0.55]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.025, z]}><cylinderGeometry args={[0.035, 0.045, 0.05, 16]} /><Chrome /></mesh>
        ))}
        <group position={[0, 0, -0.95]}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.014, 0.014, 1.0, 14]} /><Chrome /></mesh>
          <mesh position={[0, 1.0, 0.1]} rotation={[0, 0, 0]}><torusGeometry args={[0.1, 0.012, 10, 24, Math.PI]} /><Chrome /></mesh>
          <mesh position={[0.04, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 0.12, 14]} /><Chrome /></mesh>
        </group>
        <mesh position={[0, 0.56, 0.1]} castShadow><boxGeometry args={[0.95, 0.025, 0.2]} /><meshStandardMaterial {...oak} color="#f0dcc0" /></mesh>
      </group>

      {/* Waschtisch: schwebender Eichen-Unterschrank, Marmorplatte, Aufsatzbecken, Spiegel */}
      <group ref={basin} position={[1.6, 0, -1.36]} visible={false}>
        <mesh position={[0, 3.3, 0.02]} castShadow receiveShadow><boxGeometry args={[1.0, 0.34, 0.44]} /><meshStandardMaterial {...oak} color="#f2dfc4" /></mesh>
        {[-0.25, 0.25].map((x) => <mesh key={x} position={[x, 3.3, 0.245]}><boxGeometry args={[0.46, 0.005, 0.01]} /><meshStandardMaterial color="#3a2d20" /></mesh>)}
        <mesh position={[0, 3.49, 0.02]} castShadow><boxGeometry args={[1.04, 0.04, 0.48]} /><meshPhysicalMaterial {...marble} color="#f4f2ee" clearcoat={0.5} /></mesh>
        <mesh geometry={bowlGeo} position={[0, 3.51, 0.04]} material={ceramic} castShadow />
        <mesh position={[0, 3.66, -0.13]}><cylinderGeometry args={[0.014, 0.014, 0.3, 14]} /><Chrome /></mesh>
        <mesh position={[0, 3.8, -0.04]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.014, 0.014, 0.19, 14]} /><Chrome /></mesh>
        <ExternalModelLoader file="ph:ornate_mirror_01" height={1.0} position={[0, 3.85, -0.2]} />
        <ExternalModelLoader file="ph:potted_plant_04" height={0.32} position={[0.4, 3.51, 0.0]} />
        <mesh position={[0, 4.4, -0.2]}><boxGeometry args={[0.7, 0.02, 0.03]} /><meshBasicMaterial color="#ffe8c4" toneMapped={false} /></mesh>
      </group>

      {/* Walk-In-Dusche: Marmor-Tasse, Klarglas mit Edelstahlprofil, Regenbrause */}
      <mesh position={[2.55, 2.74, -1.35]} receiveShadow><boxGeometry args={[1.0, 0.06, 1.0]} /><meshPhysicalMaterial {...marble} color="#eceae6" clearcoat={0.6} /></mesh>
      <mesh position={[2.45, 2.775, -1.25]}><cylinderGeometry args={[0.05, 0.05, 0.012, 24]} /><Chrome /></mesh>
      <group ref={glass} position={[0, 2.72, 0]} visible={false}>
        <mesh position={[2.05, 1.05, -1.35]}><boxGeometry args={[0.012, 2.1, 1.0]} /><meshPhysicalMaterial color="#d8eef7" transparent opacity={0.16} roughness={0.02} metalness={0} envMapIntensity={2.5} clearcoat={1} /></mesh>
        <mesh position={[2.05, 2.1, -1.35]}><boxGeometry args={[0.03, 0.025, 1.0]} /><Chrome /></mesh>
        <mesh position={[2.05, 0.04, -1.35]}><boxGeometry args={[0.03, 0.03, 1.0]} /><Chrome /></mesh>
      </group>
      <group ref={shower} position={[2.55, 4.55, -1.4]} visible={false}>
        <mesh castShadow><cylinderGeometry args={[0.25, 0.25, 0.022, 48]} /><Chrome /></mesh>
        <mesh position={[0, -0.013, 0]}><cylinderGeometry args={[0.22, 0.22, 0.004, 48]} /><meshStandardMaterial color="#9aa5b1" metalness={1} roughness={0.3} /></mesh>
        <mesh position={[0, 0.2, -0.3]}><cylinderGeometry args={[0.014, 0.014, 0.4, 12]} /><Chrome /></mesh>
        <mesh position={[0, 0.0, -0.15]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.014, 0.014, 0.3, 12]} /><Chrome /></mesh>
      </group>
      </group>
      <points ref={drops} geometry={dropGeo} frustumCulled={false} visible={false}>
        <pointsMaterial color="#cdeeff" size={S.mobile ? 0.045 : 0.035} transparent opacity={0.7} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  )
}
