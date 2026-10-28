import { useMemo, useRef } from 'react'
import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  Color, DoubleSide, EdgesGeometry, ExtrudeGeometry, LineBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Path, Shape,
  type Group, type Material,
} from 'three'
import { S, bump, smooth } from '../state'
import { FlowPipe } from './FlowPipe'
import { PipeNetwork } from './PipeNetwork'
import { Technik } from './Technik'
import { AssemblyShelf, Kitchen, WallOpening } from './Renovation'
import { BathroomCutaway } from './BathroomCutaway'
import { LeakScanner } from './LeakScanner'
import { ExternalModelLoader } from './ExternalModelLoader'
import { Exterior, SolarPanels } from './Exterior'
import { usePbr } from './pbr'

type Hole = [cx: number, y: number, w: number, h: number]

function wallGeometry(w: number, h: number, holes: Hole[], depth = 0.16) {
  const s = new Shape()
  s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h); s.lineTo(0, h); s.lineTo(0, 0)
  for (const [cx, y, hw, hh] of holes) {
    const p = new Path()
    const x0 = cx + w / 2 - hw / 2
    p.moveTo(x0, y); p.lineTo(x0, y + hh); p.lineTo(x0 + hw, y + hh); p.lineTo(x0 + hw, y); p.lineTo(x0, y)
    s.holes.push(p)
  }
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false })
  g.translate(-w / 2, 0, -depth / 2)
  return g
}

function xrayValue() {
  if (S.xrayForce) return 1
  return smooth(0.06, 0.16, S.p) * (1 - smooth(0.87, 0.91, S.p))
}

function Wall({ w, h, holes, pos, rotY = 0, mat, edge }: { w: number; h: number; holes: Hole[]; pos: [number, number, number]; rotY?: number; mat: Material; edge: Material }) {
  const geo = useMemo(() => wallGeometry(w, h, holes), [w, h, holes])
  const edges = useMemo(() => new EdgesGeometry(geo, 30), [geo])
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edges} material={edge} />
    </group>
  )
}

const FRONT_HOLES: Hole[] = [
  [-2.0, 0.9, 1.2, 1.2], [0.0, 0, 1.0, 2.1], [2.0, 0.9, 1.6, 1.2],
  [-1.8, 2.75, 1.4, 2.1], [1.8, 3.4, 1.2, 1.2],
]
const BACK_HOLES: Hole[] = [[-1.5, 0.9, 1.4, 1.2], [1.8, 3.3, 1.0, 1.2]]
const SIDE_HOLES: Hole[] = [[0.0, 0.9, 1.0, 1.2], [0.0, 3.3, 1.0, 1.2]]

export function HouseScene({ interactive = true }: { interactive?: boolean }) {
  const group = useRef<Group>(null)
  const plaster = usePbr('white_plaster_02', [0.5, 0.5])
  const roofP = usePbr('grey_roof_tiles_02', [3.5, 1.4])
  const woodP = usePbr('oak_wood_planks', [1.8, 1.9])
  const concreteP = usePbr('concrete_floor_01', [1.5, 1])
  const m = useMemo(() => {
    const wall = new MeshStandardMaterial({ ...plaster, color: '#f4f1ec', transparent: true })
    const slab = new MeshStandardMaterial({ ...concreteP, color: '#e8e8e8', transparent: true })
    const roof = new MeshStandardMaterial({ ...roofP, color: '#ffffff', transparent: true, side: DoubleSide })
    const wood = new MeshStandardMaterial({ ...woodP, color: '#ffffff', transparent: true })
    const frame = new MeshStandardMaterial({ color: '#f1f1ef', roughness: 0.38, metalness: 0.0, transparent: true })
    // Innenraum-Leuchtfläche hinter der Scheibe (warmes Abendlicht)
    const glow = new MeshStandardMaterial({ color: '#ffe2b8', emissive: new Color('#ffb25a'), emissiveIntensity: 1.2, transparent: true, toneMapped: false })
    const glass = new MeshPhysicalMaterial({ color: '#b9cde0', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, envMapIntensity: 2.4, clearcoat: 1 })
    const door = new MeshStandardMaterial({ color: '#2b3340', roughness: 0.35, metalness: 0.1, transparent: true })
    const edge = new LineBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0, toneMapped: false })
    const edgeRoof = new LineBasicMaterial({ color: '#ff7a5a', transparent: true, opacity: 0, toneMapped: false })
    return { wall, slab, roof, glass, glow, door, edge, edgeRoof, wood, frame }
  }, [plaster, roofP, woodP, concreteP])
  const roofEdges = useMemo(() => new EdgesGeometry(wallGeometry(7.0, 2.92, []), 30), [])
  const gable = useMemo(() => {
    const s = new Shape(); s.moveTo(-2.05, 0); s.lineTo(2.05, 0); s.lineTo(0, 1.75); s.lineTo(-2.05, 0)
    return new ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false })
  }, [])

  const old = useMemo(() => new Color('#9a8f80'), [])
  const fresh = useMemo(() => new Color('#f4f1ec'), [])

  useFrame((_, dt) => {
    S.ren += (S.renTarget - S.ren) * Math.min(1, dt * 4)
    const x = xrayValue()
    m.wall.opacity = 1 - 0.9 * x
    m.wall.depthWrite = x < 0.4
    m.wall.color.copy(old).lerp(fresh, S.ren)
    m.slab.opacity = 1 - 0.5 * x
    m.slab.depthWrite = x < 0.3
    m.roof.opacity = 1 - 0.88 * x
    m.roof.depthWrite = x < 0.3
    m.glass.opacity = 0.24 - 0.18 * x
    m.glow.opacity = 0.95 - 0.8 * x
    m.glow.emissiveIntensity = (0.4 + 1.0 * S.ren) * (1 - 0.85 * x)
    m.door.opacity = 1 - 0.8 * x
    m.wood.opacity = 1 - 0.35 * x
    m.frame.opacity = 1 - 0.7 * x
    m.edge.opacity = 0.85 * x
    m.edgeRoof.opacity = 0.7 * x
    if (group.current && interactive && !S.free) {
      const t = 1 - smooth(0.0, 0.14, S.p)
      group.current.rotation.y += ((S.mouse.x * 0.35 * t) - group.current.rotation.y) * Math.min(1, dt * 3)
      group.current.position.y = Math.sin(performance.now() / 1400) * 0.08 * t
    }
  })

  const roofAngle = Math.atan2(1.8, 2.3)
  return (
    <group ref={group}>
      <Sparkles count={S.mobile ? 8 : 24} scale={[1.2, 1.4, 1.8]} position={[1.5, 3.5, 0.3]} size={6} speed={0.35} opacity={0.35} color="#d8f1ff" />
      {/* Walls */}
      <Wall w={6.4} h={5.2} holes={FRONT_HOLES} pos={[0, 0, 2]} mat={m.wall} edge={m.edge} />
      <Wall w={6.4} h={5.2} holes={BACK_HOLES} pos={[0, 0, -2]} mat={m.wall} edge={m.edge} />
      <Wall w={4} h={5.2} holes={SIDE_HOLES} pos={[-3.2, 0, 0]} rotY={Math.PI / 2} mat={m.wall} edge={m.edge} />
      <Wall w={4} h={5.2} holes={SIDE_HOLES} pos={[3.2, 0, 0]} rotY={Math.PI / 2} mat={m.wall} edge={m.edge} />
      {/* Windows (warm light) + door */}
      {([[-2.0, 1.5, 1.2, 1.2], [2.0, 1.5, 1.6, 1.2], [-1.8, 3.8, 1.4, 2.1], [1.8, 4.0, 1.2, 1.2]] as const).map(([x, y, w, h], i) => (
        <group key={i}>
          <mesh position={[x, y, 1.9]} material={m.glow}><planeGeometry args={[w, h]} /></mesh>
          <mesh position={[x, y, 2.0]} material={m.glass}><planeGeometry args={[w, h]} /></mesh>
        </group>
      ))}
      {([[-2.0, 1.5, 1.2, 1.2], [2.0, 1.5, 1.6, 1.2], [-1.8, 3.8, 1.4, 2.1], [1.8, 4.0, 1.2, 1.2]] as const).map(([x, y, w, h], i) => (
        <group key={`f${i}`} position={[x, y, 2.04]}>
          <mesh position={[0, h / 2, 0]} material={m.frame}><boxGeometry args={[w + 0.12, 0.07, 0.1]} /></mesh>
          <mesh position={[0, -h / 2, 0.02]} material={m.frame}><boxGeometry args={[w + 0.2, 0.07, 0.16]} /></mesh>
          <mesh position={[-w / 2, 0, 0]} material={m.frame}><boxGeometry args={[0.07, h, 0.1]} /></mesh>
          <mesh position={[w / 2, 0, 0]} material={m.frame}><boxGeometry args={[0.07, h, 0.1]} /></mesh>
          <mesh material={m.frame}><boxGeometry args={[0.04, h, 0.06]} /></mesh>
          {h < 1.5 && <mesh material={m.frame}><boxGeometry args={[w, 0.04, 0.06]} /></mesh>}
        </group>
      ))}
      <mesh position={[0, 1.05, 2.0]} material={m.door}><boxGeometry args={[1.0, 2.1, 0.08]} /></mesh>
      <mesh position={[0.34, 1.0, 2.07]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.2} /></mesh>
      <mesh position={[0, 2.25, 2.1]}><boxGeometry args={[1.5, 0.06, 0.4]} /><meshStandardMaterial color="#1e242b" roughness={0.5} /></mesh>
      <mesh position={[1.0, 1.5, 2.1]}><boxGeometry args={[0.3, 0.2, 0.03]} /><meshStandardMaterial color="#1e242b" /></mesh>
      {/* Floors / ceiling */}
      <mesh position={[0, 0.1, 0]} material={m.slab} receiveShadow><boxGeometry args={[6.4, 0.2, 4]} /></mesh>
      <mesh position={[0, 2.6, 0]} material={m.slab} receiveShadow><boxGeometry args={[6.4, 0.2, 4]} /></mesh>
      <mesh position={[-1.35, 2.705, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.wood} receiveShadow><planeGeometry args={[3.6, 3.8]} /></mesh>
      <GroundFloor />
      <mesh position={[0, 5.2, 0]} material={m.slab}><boxGeometry args={[6.4, 0.1, 4]} /></mesh>
      <mesh position={[0.6, 3.9, 0]} material={m.slab}><boxGeometry args={[0.12, 2.5, 3.8]} /></mesh>

      {/* Satteldach */}
      {[1, -1].map((s) => (
        <group key={s} position={[0, 6.1, 1.15 * s]} rotation={[roofAngle * s, 0, 0]}>
          <mesh material={m.roof} castShadow><boxGeometry args={[7.0, 0.14, 2.92]} /></mesh>
          {s === 1 && <SolarPanels />}
          <lineSegments geometry={roofEdges} material={m.edgeRoof} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
        </group>
      ))}
      {[-3.12, 3.12].map((x) => (
        <mesh key={x} geometry={gable} position={[x, 5.25, 0]} rotation={[0, Math.PI / 2, 0]} material={m.wall} />
      ))}

      <Exterior />
      <Balcony />
      <Interior />
      <Technik />
      <WallOpening />
      <Kitchen />
      <AssemblyShelf />
      <PipeNetwork />
      <BathroomCutaway />
      <LeakScanner />
      <Electrics />

      {/* Interior lights */}
      <HeatLights />
    </group>
  )
}

function HeatLights() {
  const a = useRef<import('three').PointLight>(null)
  const b = useRef<import('three').PointLight>(null)
  useFrame(() => {
    if (a.current) a.current.intensity = 5 * bump(0.1, 0.17, 0.3, 0.4, S.p) + 1.5
    if (b.current) b.current.intensity = 3 * bump(0.33, 0.42, 0.55, 0.6, S.p) + 0.8
  })
  return (
    <>
      <pointLight ref={a} position={[-0.4, 1.7, 0.4]} color="#ffd9a8" distance={8} />
      <pointLight ref={b} position={[1.9, 4.2, 0.2]} color="#7fd4ff" distance={7} />
    </>
  )
}

function GroundFloor() {
  const t = usePbr('large_floor_tiles_02', [3, 2], { metalness: 0.0 })
  return <mesh position={[0, 0.205, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6.2, 3.8]} /><meshStandardMaterial {...t} color="#ffffff" metalness={0} roughness={0.6} /></mesh>
}

/* ---------- Balkon (neuer Boden, Abdichtung, Geländer) ---------- */
function Balcony() {
  const top = useRef<MeshStandardMaterial>(null)
  const seal = useRef<MeshStandardMaterial>(null)
  const cOld = useMemo(() => new Color('#4a3a2e'), [])
  const cNew = useMemo(() => new Color('#cbd5e1'), [])
  const cSealOld = useMemo(() => new Color('#2a2420'), [])
  const cSealNew = useMemo(() => new Color('#0ea5e9'), [])
  useFrame(() => {
    top.current?.color.copy(cOld).lerp(cNew, S.ren)
    if (seal.current) {
      seal.current.color.copy(cSealOld).lerp(cSealNew, S.ren)
      seal.current.emissive.copy(cSealNew).multiplyScalar(S.ren * 0.5)
    }
  })
  return (
    <group position={[-1.5, 2.55, 2.75]}>
      <mesh><boxGeometry args={[3.4, 0.16, 1.5]} /><meshStandardMaterial color="#cfd8e3" roughness={0.8} /></mesh>
      <mesh position={[0, 0.095, 0]}><boxGeometry args={[3.38, 0.03, 1.48]} /><meshStandardMaterial ref={seal} color="#0ea5e9" roughness={0.5} /></mesh>
      <mesh position={[0, 0.125, 0]}><boxGeometry args={[3.3, 0.03, 1.4]} /><meshStandardMaterial ref={top} color="#cbd5e1" roughness={0.45} /></mesh>
      {/* Geländer */}
      <mesh position={[0, 0.55, 0.7]}><boxGeometry args={[3.3, 0.9, 0.02]} /><meshPhysicalMaterial color="#9bd8ff" transparent opacity={0.22} roughness={0.05} /></mesh>
      <mesh position={[0, 1.02, 0.7]}><boxGeometry args={[3.4, 0.05, 0.05]} /><meshStandardMaterial color="#1e242b" metalness={0.8} roughness={0.3} /></mesh>
      {[-1.65, -0.55, 0.55, 1.65].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.7]}><boxGeometry args={[0.05, 0.95, 0.05]} /><meshStandardMaterial color="#1e242b" metalness={0.8} roughness={0.3} /></mesh>
      ))}
      <mesh position={[-1.65, 0.55, 0]}><boxGeometry args={[0.04, 0.9, 1.4]} /><meshPhysicalMaterial color="#9bd8ff" transparent opacity={0.18} /></mesh>
    </group>
  )
}

/* ---------- Wohnbereich: fotogescannte Möbel (Poly Haven, CC0) ---------- */
function Interior() {
  const Y = 2.72
  const wool = usePbr('wool_boucle', [2, 1.5], { metalness: 0 })
  return (
    <group>
      <mesh position={[-1.75, Y + 0.008, -0.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.8, 1.9]} /><meshStandardMaterial {...wool} color="#d9d3c7" roughness={1} metalness={0} />
      </mesh>
      <ExternalModelLoader file="ph:sofa_02" length={2.1} position={[-2.05, Y, -1.42]} />
      <ExternalModelLoader file="ph:coffee_table_round_01" height={0.4} position={[-1.75, Y, -0.35]} />
      <ExternalModelLoader file="ph:mid_century_lounge_chair" height={0.85} position={[-0.75, Y, -0.1]} rotation={[0, -2.2, 0]} />
      <ExternalModelLoader file="ph:modern_wooden_cabinet" length={1.6} position={[-3.0, Y, 0.65]} rotation={[0, Math.PI / 2, 0]} />
      <ExternalModelLoader file="ph:potted_plant_04" height={0.4} position={[-3.0, Y + 0.62, 0.95]} />
      <ExternalModelLoader file="ph:desk_lamp_arm_01" height={0.7} position={[-3.0, Y + 0.62, 0.35]} rotation={[0, 1.2, 0]} />
      <ExternalModelLoader file="ph:modern_ceiling_lamp_01" height={0.75} position={[-1.75, 4.4, -0.35]} />
      <ExternalModelLoader file="ph:wooden_ladder" height={1.55} position={[-0.5, Y, 1.5]} rotation={[0, 2.6, 0]} />
      <ExternalModelLoader file="ph:metal_toolbox" length={0.55} position={[-0.6, Y, 0.85]} rotation={[0, 0.5, 0]} />
      <pointLight position={[-1.75, 4.45, -0.35]} intensity={6} distance={5} color="#ffd9a8" />
    </group>
  )
}

/* ---------- Elektrik (gelb-weiße Leitungen + LED-Spots) ---------- */
function Electrics() {
  const spots = useRef<Group>(null)
  const light = useRef<import('three').PointLight>(null)
  const on = () => 0.25 + 1.0 * smooth(0.66, 0.74, S.p) * (1 - smooth(0.88, 0.92, S.p))
  const lit = () => on() * (0.2 + 0.8 * S.ren)
  useFrame(() => {
    if (light.current) light.current.intensity = 10 * smooth(0.66, 0.74, S.p) * S.ren * (1 - smooth(0.88, 0.92, S.p))
    spots.current?.children.forEach((c) => ((c as import('three').Mesh).material as MeshStandardMaterial).emissiveIntensity = 3.2 * lit())
  })
  return (
    <group>
      <FlowPipe points={[[-3.1, 2.8, -1.9], [-3.1, 5.0, -1.9], [-1.8, 5.05, -1.5], [-0.2, 5.05, -1.0], [-0.2, 5.05, 1.2]]} color="#facc15" radius={0.022} speed={0.9} glow={on} />
      <FlowPipe points={[[-3.1, 2.8, -1.8], [-3.1, 3.2, -1.0], [-3.1, 3.2, 1.2]]} color="#f8fafc" radius={0.02} speed={0.9} glow={on} />
      <FlowPipe points={[[-0.45, 2.8, -1.9], [-0.45, 3.4, -1.9], [-1.4, 3.4, -1.9]]} color="#facc15" radius={0.02} speed={0.9} glow={on} />
      <group ref={spots}>
        {[-2.7, -1.7, -0.7].flatMap((x) => [-0.8, 0.9].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 5.12, z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 20]} />
            <meshStandardMaterial color="#fffbe8" emissive="#fff4cc" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        )))}
      </group>
      <pointLight ref={light} position={[-1.6, 4.7, 0]} color="#ffe9b0" distance={7} />
    </group>
  )
}

