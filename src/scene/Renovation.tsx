import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshStandardMaterial, type Group, type Mesh, type PointLight } from 'three'
import { S, bump, clamp01, smooth } from '../state'
import { ExternalModelLoader } from './ExternalModelLoader'
import { FlowPipe } from './FlowPipe'
import { usePbr } from './pbr'

/* ============ Blick in die Wand: geöffnete Vorwand mit Ständerwerk, Dämmung, Leitungen, Scanner ============ */
export function WallOpening() {
  const root = useRef<Group>(null)
  const beam = useRef<Mesh>(null)
  const mats = useMemo(() => ({
    wood: new MeshStandardMaterial({ color: '#c79a63', roughness: 0.85, transparent: true }),
    wool: new MeshStandardMaterial({ color: '#e9d98a', roughness: 1, transparent: true }),
    board: new MeshStandardMaterial({ color: '#d8dde3', roughness: 0.9, transparent: true }),
  }), [])
  const vis = () => bump(0.09, 0.15, 0.34, 0.4, S.p)
  useFrame(({ clock }) => {
    const v = vis()
    if (root.current) root.current.visible = v > 0.01
    mats.wood.opacity = v; mats.wool.opacity = 0.95 * v; mats.board.opacity = 0.9 * v
    if (beam.current) {
      beam.current.position.x = -3.0 + ((clock.elapsedTime * 0.55) % 1) * 3.3
      ;(beam.current.material as MeshStandardMaterial).opacity = 0.35 * v
    }
  })
  const studs = [-3.0, -2.58, -2.16, -1.74, -1.32, -0.9, -0.48, -0.06, 0.3]
  return (
    <group ref={root} position={[0, 0, -1.87]} visible={false}>
      {studs.map((x) => <mesh key={x} position={[x, 1.35, 0]} material={mats.wood} castShadow><boxGeometry args={[0.07, 2.3, 0.08]} /></mesh>)}
      {[0.25, 2.45].map((y) => <mesh key={y} position={[-1.35, y, 0]} material={mats.wood}><boxGeometry args={[3.4, 0.07, 0.08]} /></mesh>)}
      {studs.slice(0, -1).map((x, i) => (i % 2 === 0) && <mesh key={x} position={[x + 0.21, 1.35, -0.015]} material={mats.wool}><boxGeometry args={[0.35, 2.15, 0.05]} /></mesh>)}
      {studs.slice(0, -1).map((x, i) => (i % 2 === 1) && <mesh key={x} position={[x + 0.21, 1.9, -0.015]} material={mats.wool}><boxGeometry args={[0.35, 1.05, 0.05]} /></mesh>)}
      {/* geschlossener Teil als Gipskarton, damit der Übergang sichtbar bleibt */}
      <mesh position={[0.9, 1.35, 0.02]} material={mats.board}><boxGeometry args={[1.2, 2.3, 0.03]} /></mesh>
      {/* Elektro-Leerrohre */}
      <FlowPipe points={[[-3.0, 0.6, 0.12], [-1.0, 0.6, 0.12], [-0.9, 1.2, 0.12], [-0.9, 2.3, 0.12]]} color="#facc15" radius={0.018} speed={0.9} glow={() => 0.4 + vis()} />
      <FlowPipe points={[[-2.6, 0.3, 0.12], [-2.6, 1.5, 0.12], [-1.6, 2.0, 0.12], [-0.4, 2.0, 0.12]]} color="#f8fafc" radius={0.016} speed={0.9} glow={() => 0.4 + vis()} />
      {/* Scan-Strahl */}
      <mesh ref={beam} position={[-3, 1.35, 0.15]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 2.4]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ============ Wohnküche im Erdgeschoss ============ */
function Washer({ x }: { x: number }) {
  return (
    <group position={[x, 0.2, -1.55]}>
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.86, 0.6]} /><meshPhysicalMaterial color="#f3f4f5" roughness={0.3} clearcoat={0.6} /></mesh>
      <mesh position={[0, 0.42, 0.305]}><torusGeometry args={[0.2, 0.025, 14, 40]} /><meshStandardMaterial color="#cfd5db" metalness={1} roughness={0.15} /></mesh>
      <mesh position={[0, 0.42, 0.3]}><circleGeometry args={[0.185, 40]} /><meshPhysicalMaterial color="#1b2430" roughness={0.05} metalness={0.2} clearcoat={1} /></mesh>
      <mesh position={[0, 0.77, 0.305]}><boxGeometry args={[0.5, 0.06, 0.005]} /><meshStandardMaterial color="#cfd5db" metalness={0.8} roughness={0.25} /></mesh>
      <mesh position={[0.2, 0.77, 0.31]}><circleGeometry args={[0.02, 16]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
    </group>
  )
}

export function Kitchen() {
  const Y = 0.2
  const marble = usePbr('marble_01', [0.8, 0.3], { roughness: 0.5 })
  const oak = usePbr('oak_wood_planks', [0.8, 0.5], { metalness: 0 })
  const front = <meshPhysicalMaterial color="#ece9e4" roughness={0.35} clearcoat={0.4} />
  const steel = <meshStandardMaterial color="#c9ced4" metalness={1} roughness={0.28} />
  return (
    <group>
      {/* Küchenzeile an der Rückwand */}
      <group position={[0, Y, -1.6]}>
        {[1.45, 1.95, 2.45].map((x) => (
          <group key={x} position={[x - 0.0, 0.43, 0]}>
            <mesh castShadow receiveShadow><boxGeometry args={[0.49, 0.86, 0.58]} />{front}</mesh>
            <mesh position={[0, 0.3, 0.3]}><boxGeometry args={[0.3, 0.012, 0.012]} />{steel}</mesh>
          </group>
        ))}
        <mesh position={[2.0, 0.88, -0.01]} castShadow receiveShadow><boxGeometry args={[2.2, 0.04, 0.62]} /><meshPhysicalMaterial {...marble} color="#f1efeb" clearcoat={0.5} /></mesh>
        <mesh position={[2.0, 1.2, -0.3]} receiveShadow><boxGeometry args={[2.2, 0.55, 0.012]} /><meshPhysicalMaterial {...marble} color="#ebe8e3" clearcoat={0.4} /></mesh>
        {/* Spüle */}
        <mesh position={[1.95, 0.9, 0.0]}><boxGeometry args={[0.42, 0.012, 0.36]} /><meshStandardMaterial color="#8d949c" metalness={1} roughness={0.3} /></mesh>
        <mesh position={[1.95, 1.0, -0.2]}><cylinderGeometry args={[0.012, 0.012, 0.22, 12]} />{steel}</mesh>
        <mesh position={[1.95, 1.11, -0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.2, 12]} />{steel}</mesh>
        {/* Hängeschränke + Abzug */}
        {[1.4, 1.9].map((x) => (
          <mesh key={x} position={[x, 1.75, -0.12]} castShadow><boxGeometry args={[0.49, 0.7, 0.34]} />{front}</mesh>
        ))}
        <mesh position={[2.55, 1.9, -0.1]} castShadow><boxGeometry args={[0.6, 0.12, 0.4]} />{steel}</mesh>
        <mesh position={[2.55, 2.1, -0.18]}><boxGeometry args={[0.22, 0.32, 0.22]} />{steel}</mesh>
      </group>
      {/* Kühlschrank (Edelstahl) */}
      <group position={[0.85, Y, -1.56]}>
        <mesh position={[0, 0.95, 0]} castShadow receiveShadow><boxGeometry args={[0.62, 1.9, 0.62]} />{steel}</mesh>
        <mesh position={[0, 1.18, 0.315]}><boxGeometry args={[0.6, 0.006, 0.006]} /><meshStandardMaterial color="#59606a" /></mesh>
        <mesh position={[0.22, 1.5, 0.34]}><boxGeometry args={[0.02, 0.5, 0.03]} /><meshStandardMaterial color="#e6ebf0" metalness={1} roughness={0.12} /></mesh>
        <mesh position={[0.22, 0.75, 0.34]}><boxGeometry args={[0.02, 0.35, 0.03]} /><meshStandardMaterial color="#e6ebf0" metalness={1} roughness={0.12} /></mesh>
      </group>
      <ExternalModelLoader file="ph:round_wooden_table_01" length={1.15} position={[2.0, Y, 0.45]} />
      <ExternalModelLoader file="ph:dining_chair_02" height={0.95} position={[2.0, Y, 1.25]} rotation={[0, Math.PI, 0]} />
      <ExternalModelLoader file="ph:dining_chair_02" height={0.95} position={[1.2, Y, 0.45]} rotation={[0, Math.PI / 2, 0]} />
      <ExternalModelLoader file="ph:dining_chair_02" height={0.95} position={[2.8, Y, 0.45]} rotation={[0, -Math.PI / 2, 0]} />
      <pointLight position={[2.0, 2.2, 0.4]} intensity={7} distance={5} color="#ffd9a8" />
      {/* Hauswirtschaft + Werkstatt-Regal */}
      <Washer x={-0.45} /><Washer x={0.2} />
      <ExternalModelLoader file="ph:steel_frame_shelves_01" height={1.8} position={[-3.0, Y, 0.55]} rotation={[0, Math.PI / 2, 0]} />
      <ExternalModelLoader file="ph:pipe_wrench" length={0.5} position={[-3.0, Y + 0.9, 0.4]} rotation={[0, 0.3, 0]} />
      <ExternalModelLoader file="ph:metal_toolbox" length={0.5} position={[-3.0, Y + 0.02, 0.9]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  )
}

/* ============ Möbelmontage: Würfelregal baut sich aus Eichenbrettern auf, Akkuschrauber schwebt ============ */
type Board = { p: [number, number, number]; s: [number, number, number]; from: [number, number, number]; rot: [number, number, number] }
export function AssemblyShelf() {
  const boards = useMemo<Board[]>(() => {
    const b: Board[] = []
    const rnd = (i: number) => { const x = Math.sin(i * 91.7) * 43758.5453; return x - Math.floor(x) }
    const push = (p: [number, number, number], s: [number, number, number]) => {
      const i = b.length
      b.push({ p, s, from: [(rnd(i) - 0.5) * 5, 2.5 + rnd(i + 9) * 2.5, 3 + rnd(i + 3) * 3], rot: [(rnd(i + 5) - 0.5) * 6, (rnd(i + 7) - 0.5) * 6, (rnd(i + 11) - 0.5) * 6] })
    }
    push([-0.6, 0.6, 0], [0.025, 1.2, 0.35]); push([0.6, 0.6, 0], [0.025, 1.2, 0.35])
    for (let k = 0; k < 4; k++) push([0, k * 0.4, 0], [1.22, 0.025, 0.35])
    for (const x of [-0.2, 0.2]) for (const y of [0.6, 1.0]) push([x, y, 0], [0.02, 0.38, 0.33])
    push([0, 0.6, -0.17], [1.2, 1.2, 0.01])
    return b
  }, [])
  const root = useRef<Group>(null)
  const parts = useRef<Group>(null)
  const books = useRef<Group>(null)
  const drill = useRef<Group>(null)
  const led = useRef<PointLight>(null)
  const oak = usePbr('oak_wood_planks', [0.4, 0.15], { metalness: 0 })
  const wood = useMemo(() => new MeshStandardMaterial({ ...oak, color: '#ffffff' }), [oak])
  const old = useMemo(() => new Color('#8a7d6a'), [])
  const neu = useMemo(() => new Color('#f3e6d2'), [])
  const bookCols = ['#b23a2e', '#2f5d7c', '#e9e4da', '#c9a43a', '#222a33', '#5d8aa8']

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const k = clamp01((S.p - 0.69) / 0.1)
    const on = S.p > 0.66 && S.p < 0.9
    if (root.current) root.current.visible = on
    wood.color.copy(old).lerp(neu, S.ren)
    parts.current?.children.forEach((c, i) => {
      const b = boards[i]
      const e = clamp01((k * 1.5 - i * 0.07) / 0.55), s = e * e * (3 - 2 * e)
      c.position.set(b.p[0] + b.from[0] * (1 - s), b.p[1] + b.from[1] * (1 - s), b.p[2] + b.from[2] * (1 - s))
      c.rotation.set(b.rot[0] * (1 - s), b.rot[1] * (1 - s), b.rot[2] * (1 - s))
      c.visible = e > 0
    })
    if (books.current) books.current.visible = k > 0.92
    if (drill.current) {
      const a = 1 - smooth(0.78, 0.82, S.p)
      drill.current.visible = on && a > 0.02 && k > 0.02
      drill.current.position.set(0.1 + Math.sin(t * 1.3) * 0.5, 1.5 + Math.sin(t * 2.1) * 0.12 + k * 0.4, 0.7 + Math.cos(t * 1.1) * 0.25)
      drill.current.rotation.set(0.1, -0.6 + Math.sin(t) * 0.3, Math.sin(t * 1.7) * 0.1)
      drill.current.scale.setScalar(a)
    }
    if (led.current) led.current.intensity = 1.6 + Math.sin(t * 20) * 0.4
  })
  return (
    <group ref={root} position={[-0.25, 2.72, -1.68]} visible={false}>
      <group ref={parts}>
        {boards.map((b, i) => <mesh key={i} material={wood} castShadow receiveShadow><boxGeometry args={b.s} /></mesh>)}
      </group>
      <group ref={books}>
        {[[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].flatMap(([c, r]) => Array.from({ length: 4 }, (_, i) => (
          <mesh key={`${c}${r}${i}`} position={[-0.52 + c * 0.4 + i * 0.07, 0.03 + r * 0.4 + 0.12, 0]} castShadow>
            <boxGeometry args={[0.045, 0.2 + ((i * 7 + r * 3 + c) % 4) * 0.03, 0.2]} />
            <meshStandardMaterial color={bookCols[(i + r + c) % bookCols.length]} roughness={0.75} />
          </mesh>
        )))}
        <ExternalModelLoader file="ph:potted_plant_04" height={0.3} position={[0, 0.82, 0.02]} />
      </group>
      {/* Akkuschrauber (Poly Haven) */}
      <group ref={drill} visible={false}>
        <ExternalModelLoader file="ph:Drill_01" length={0.3} position={[0, 0, 0]} />
        <pointLight ref={led} position={[-0.15, 0, 0.1]} color="#cfe9ff" distance={1.5} intensity={1.6} />
      </group>
    </group>
  )
}
