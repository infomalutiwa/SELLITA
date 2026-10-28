import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshStandardMaterial, type Group, type Mesh, type PointLight } from 'three'
import { S, bump, clamp01, smooth } from '../state'
import { ExternalModelLoader } from './ExternalModelLoader'
import { FlowPipe } from './FlowPipe'

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

/* ============ Wohnküche im Erdgeschoss (CC0-Modelle) ============ */
export function Kitchen() {
  const Y = 0.2
  return (
    <group>
      <ExternalModelLoader file="kitchenFridgeLarge.glb" height={1.95} position={[0.95, Y, -1.58]} />
      <ExternalModelLoader file="kitchenCabinet.glb" length={0.62} position={[1.56, Y, -1.58]} tint="#e8eef5" />
      <ExternalModelLoader file="kitchenSink.glb" length={0.9} position={[2.2, Y, -1.58]} tint="#e8eef5" />
      <ExternalModelLoader file="kitchenStove.glb" length={0.62} position={[2.82, Y, -1.58]} />
      <ExternalModelLoader file="hoodModern.glb" length={0.65} position={[2.82, 1.68, -1.7]} />
      <ExternalModelLoader file="kitchenCabinetUpper.glb" length={0.62} position={[1.56, 1.55, -1.72]} tint="#e8eef5" />
      <ExternalModelLoader file="rugRound.glb" length={2.1} position={[2.0, Y + 0.005, 0.4]} tint="#9fb4cc" />
      <ExternalModelLoader file="tableRound.glb" length={1.15} position={[2.0, Y, 0.4]} />
      <ExternalModelLoader file="chairDesk.glb" height={0.95} position={[2.0, Y, 1.2]} rotation={[0, Math.PI, 0]} tint="#ef4444" tintOnly="seat" />
      <ExternalModelLoader file="chairDesk.glb" height={0.95} position={[1.2, Y, 0.4]} rotation={[0, Math.PI / 2, 0]} />
      <ExternalModelLoader file="chairDesk.glb" height={0.95} position={[2.8, Y, 0.4]} rotation={[0, -Math.PI / 2, 0]} />
      <ExternalModelLoader file="coatRack.glb" height={1.65} position={[0.75, Y, 1.7]} />
    </group>
  )
}

/* ============ Möbelmontage: Regal baut sich aus Brettern auf, Akkuschrauber schwebt ============ */
type Board = { p: [number, number, number]; s: [number, number, number]; from: [number, number, number]; rot: [number, number, number] }
export function AssemblyShelf() {
  const boards = useMemo<Board[]>(() => {
    const b: Board[] = []
    const rnd = (i: number) => { const x = Math.sin(i * 91.7) * 43758.5453; return x - Math.floor(x) }
    const push = (p: [number, number, number], s: [number, number, number]) => {
      const i = b.length
      b.push({ p, s, from: [(rnd(i) - 0.5) * 5, 2.5 + rnd(i + 9) * 2.5, 3 + rnd(i + 3) * 3], rot: [(rnd(i + 5) - 0.5) * 6, (rnd(i + 7) - 0.5) * 6, (rnd(i + 11) - 0.5) * 6] })
    }
    push([-0.45, 0.9, 0], [0.03, 1.8, 0.35]); push([0.45, 0.9, 0], [0.03, 1.8, 0.35])
    for (let k = 0; k < 5; k++) push([0, 0.04 + k * 0.44, 0], [0.9, 0.03, 0.35])
    push([0, 0.9, -0.17], [0.9, 1.8, 0.012])
    return b
  }, [])
  const root = useRef<Group>(null)
  const parts = useRef<Group>(null)
  const books = useRef<Group>(null)
  const drill = useRef<Group>(null)
  const chuck = useRef<Mesh>(null)
  const led = useRef<PointLight>(null)
  const wood = useMemo(() => new MeshStandardMaterial({ color: '#e9dcc6', roughness: 0.6 }), [])
  const old = useMemo(() => new Color('#8a7d6a'), [])
  const neu = useMemo(() => new Color('#efe3cf'), [])
  const bookCols = ['#ef4444', '#0ea5e9', '#f8fafc', '#facc15', '#1e242b', '#38bdf8']

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const k = clamp01((S.p - 0.69) / 0.1)
    const on = S.p > 0.66 && S.p < 0.9
    if (root.current) root.current.visible = on
    wood.color.copy(old).lerp(neu, S.ren)
    parts.current?.children.forEach((c, i) => {
      const b = boards[i]
      const e = clamp01((k * 1.5 - i * 0.08) / 0.55), s = e * e * (3 - 2 * e)
      c.position.set(b.p[0] + b.from[0] * (1 - s), b.p[1] + b.from[1] * (1 - s), b.p[2] + b.from[2] * (1 - s))
      c.rotation.set(b.rot[0] * (1 - s), b.rot[1] * (1 - s), b.rot[2] * (1 - s))
      c.visible = e > 0
    })
    if (books.current) books.current.visible = k > 0.92
    if (drill.current) {
      const a = 1 - smooth(0.78, 0.82, S.p)
      drill.current.visible = on && a > 0.02 && k > 0.02
      drill.current.position.set(0.9 + Math.sin(t * 1.3) * 0.4, 1.1 + Math.sin(t * 2.1) * 0.15 + k * 0.5, 0.5 + Math.cos(t * 1.1) * 0.3)
      drill.current.rotation.set(0, -1.9 + Math.sin(t) * 0.3, Math.sin(t * 1.7) * 0.1)
      drill.current.scale.setScalar(a)
    }
    if (chuck.current) chuck.current.rotation.x += 0.7
    if (led.current) led.current.intensity = 2 + Math.sin(t * 20) * 0.5
  })
  return (
    <group ref={root} position={[-2.95, 2.72, 0.9]} rotation={[0, Math.PI / 2, 0]} visible={false}>
      <group ref={parts}>
        {boards.map((b, i) => <mesh key={i} material={wood} castShadow receiveShadow><boxGeometry args={b.s} /></mesh>)}
      </group>
      <group ref={books}>
        {[0, 1, 2, 3].flatMap((row) => Array.from({ length: 6 }, (_, i) => (
          <mesh key={`${row}${i}`} position={[-0.34 + i * 0.1 + (row % 2) * 0.03, 0.27 + row * 0.44, 0]} castShadow>
            <boxGeometry args={[0.06, 0.2 + ((i * 7 + row * 3) % 5) * 0.025, 0.2]} />
            <meshStandardMaterial color={bookCols[(i + row) % bookCols.length]} roughness={0.7} />
          </mesh>
        )))}
      </group>
      {/* Akkuschrauber (SELLITA-Farben) */}
      <group ref={drill} visible={false}>
        <mesh castShadow><boxGeometry args={[0.32, 0.1, 0.1]} /><meshStandardMaterial color="#1e242b" roughness={0.4} /></mesh>
        <mesh position={[0.02, -0.12, 0]} rotation={[0, 0, -0.25]}><boxGeometry args={[0.09, 0.22, 0.08]} /><meshStandardMaterial color="#ef4444" roughness={0.5} /></mesh>
        <mesh position={[0.05, -0.26, 0]}><boxGeometry args={[0.13, 0.07, 0.1]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} /></mesh>
        <mesh ref={chuck} position={[-0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.045, 0.1, 6]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.2} /></mesh>
        <mesh position={[-0.31, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.1, 6]} /><meshStandardMaterial color="#9aa5b1" metalness={1} /></mesh>
        <pointLight ref={led} position={[-0.35, 0, 0.05]} color="#9ad8ff" distance={1.5} intensity={2} />
      </group>
    </group>
  )
}
