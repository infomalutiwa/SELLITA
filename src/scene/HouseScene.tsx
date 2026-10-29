import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color, DoubleSide, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Path, Plane, Shape, Vector2, Vector3,
  type Group, type Material, type Mesh, type PointLight,
} from 'three'
import { S, bump, smooth } from '../state'
import { FlowPipe } from './FlowPipe'
import { LayerLabel } from './LayerLabel'
import { PipeNetwork } from './PipeNetwork'
import { Technik } from './Technik'
import { AssemblyShelf, Kitchen, OldWardrobe, WallOpening } from './Renovation'
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

/** Architektur-Schnitt: 0 = Fassade geschlossen, 1 = Vorderfassade komplett aufgeschnitten (Blick ins Haus). */
export function cutOpen() {
  if (S.free) return S.xrayForce ? 1 : 0
  // Schnitt öffnet sich beim Zoom in die Wand und schließt sich wieder, wenn wir auf den Balkon hinausgehen
  return smooth(0.1, 0.165, S.p) * (1 - smooth(0.69, 0.73, S.p))
}
const CUT_HALF = 3.6

function Wall({ w, h, holes, pos, rotY = 0, mat }: { w: number; h: number; holes: Hole[]; pos: [number, number, number]; rotY?: number; mat: Material }) {
  const geo = useMemo(() => wallGeometry(w, h, holes), [w, h, holes])
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
    </group>
  )
}

/** Fenster: schlanker Anthrazit-Rahmen, tiefe Laibung, Alu-Fensterbank und spiegelndes Isolierglas */
function Window({ x, y, w, h, z, frame, glass, sill, rotY = 0, cross = true }: { x: number; y: number; w: number; h: number; z: number; frame: Material; glass: Material; sill: Material; rotY?: number; cross?: boolean }) {
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh material={glass}><planeGeometry args={[w - 0.06, h - 0.06]} /></mesh>
      <mesh position={[0, h / 2 - 0.03, 0]} material={frame} castShadow><boxGeometry args={[w, 0.06, 0.09]} /></mesh>
      <mesh position={[0, -h / 2 + 0.03, 0]} material={frame}><boxGeometry args={[w, 0.06, 0.09]} /></mesh>
      <mesh position={[-w / 2 + 0.03, 0, 0]} material={frame}><boxGeometry args={[0.06, h, 0.09]} /></mesh>
      <mesh position={[w / 2 - 0.03, 0, 0]} material={frame}><boxGeometry args={[0.06, h, 0.09]} /></mesh>
      {cross && <mesh material={frame}><boxGeometry args={[0.045, h - 0.1, 0.07]} /></mesh>}
      <mesh position={[0, -h / 2 - 0.02, 0.09]} material={sill} castShadow><boxGeometry args={[w + 0.12, 0.03, 0.2]} /></mesh>
    </group>
  )
}

const FRONT_HOLES: Hole[] = [
  [-2.0, 0.9, 1.2, 1.2], [0.0, 0, 1.0, 2.1], [2.0, 0.9, 1.6, 1.2],
  [-1.8, 2.75, 1.4, 2.1], [1.8, 3.4, 1.2, 1.2],
]
const FRONT_WINDOWS = [[-2.0, 1.5, 1.2, 1.2], [2.0, 1.5, 1.6, 1.2], [-1.8, 3.8, 1.4, 2.1], [1.8, 4.0, 1.2, 1.2]] as const
const BACK_HOLES: Hole[] = [[-1.5, 0.9, 1.4, 1.2], [1.8, 3.3, 1.0, 1.2]]
const SIDE_HOLES: Hole[] = [[0.0, 0.9, 1.0, 1.2], [0.0, 3.3, 1.0, 1.2]]

export function HouseScene({ interactive = true }: { interactive?: boolean }) {
  const group = useRef<Group>(null)
  const cutLine = useRef<Mesh>(null)
  const cutLight = useRef<PointLight>(null)
  const plasterP = usePbr('white_plaster_02', [5, 5])
  // glatter, weißer Edelputz: nur Relief (Normal/ARM), keine beige Farbtextur
  const plaster = useMemo(() => ({ ...plasterP, map: null, normalScale: new Vector2(0.35, 0.35) }), [plasterP])
  const roofP = usePbr('grey_roof_tiles_02', [3.5, 1.4])
  const woodP = usePbr('oak_wood_planks', [1.8, 1.9])
  // Schnittebene: alles links von x = c wird weggeschnitten (c wandert von links nach rechts über die Fassade)
  const cut = useMemo(() => new Plane(new Vector3(1, 0, 0), CUT_HALF), [])
  const m = useMemo(() => {
    const clip = { clippingPlanes: [cut], clipShadows: true }
    const wall = new MeshStandardMaterial({ ...plaster, color: '#f3f1ed' })
    const wallFront = new MeshStandardMaterial({ ...plaster, color: '#f3f1ed', ...clip })
    // Decken innen glatt verputzt
    const slab = new MeshStandardMaterial({ ...plaster, color: '#ebe8e3', roughness: 0.9 })
    const roof = new MeshStandardMaterial({ ...roofP, color: '#ffffff', side: DoubleSide })
    const wood = new MeshStandardMaterial({ ...woodP, color: '#ffffff' })
    const frame = new MeshStandardMaterial({ color: '#2a2f36', roughness: 0.4, metalness: 0.35 })
    const frameFront = new MeshStandardMaterial({ color: '#2a2f36', roughness: 0.4, metalness: 0.35, ...clip })
    const sill = new MeshStandardMaterial({ color: '#3a4048', roughness: 0.3, metalness: 0.8 })
    const sillFront = new MeshStandardMaterial({ color: '#3a4048', roughness: 0.3, metalness: 0.8, ...clip })
    // warmes Innenlicht hinter den Scheiben (Abendstimmung)
    const glow = new MeshStandardMaterial({ color: '#000000', emissive: new Color('#ffc58a'), emissiveIntensity: 0.5, ...clip })
    const glassOpts = { color: '#1b2633', metalness: 0.1, roughness: 0.03, transparent: true, opacity: 0.72, envMapIntensity: 2.6, clearcoat: 1, depthWrite: false }
    const glass = new MeshPhysicalMaterial(glassOpts)
    const glassFront = new MeshPhysicalMaterial({ ...glassOpts, opacity: 0.66, ...clip })
    const door = new MeshStandardMaterial({ color: '#23282f', roughness: 0.32, metalness: 0.4, ...clip })
    const dark = new MeshStandardMaterial({ color: '#1e242b', roughness: 0.5, ...clip })
    const steel = new MeshStandardMaterial({ color: '#e2e8f0', metalness: 1, roughness: 0.2, ...clip })
    return { wall, wallFront, slab, roof, glass, glassFront, glow, door, wood, frame, frameFront, sill, sillFront, dark, steel }
  }, [plaster, roofP, woodP, cut])
  const gable = useMemo(() => {
    const s = new Shape(); s.moveTo(-2.05, 0); s.lineTo(2.05, 0); s.lineTo(0, 1.75); s.lineTo(-2.05, 0)
    return new ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false })
  }, [])

  const old = useMemo(() => new Color('#9a8f80'), [])
  const fresh = useMemo(() => new Color('#f3f1ed'), [])

  useFrame((_, dt) => {
    S.ren += (S.renTarget - S.ren) * Math.min(1, dt * 4)
    const o = cutOpen()
    const c = -CUT_HALF + 2 * CUT_HALF * o
    cut.constant = -c
    const cutting = o > 0.002 && o < 0.998
    if (cutLine.current) { cutLine.current.visible = cutting; cutLine.current.position.x = c }
    if (cutLight.current) { cutLight.current.intensity = cutting ? 6 : 0; cutLight.current.position.x = c }
    m.wall.color.copy(old).lerp(fresh, S.ren)
    m.wallFront.color.copy(m.wall.color)
    m.glow.emissiveIntensity = 0.2 + 0.35 * S.ren
    if (group.current && interactive && !S.free) {
      const t = 1 - smooth(0.0, 0.14, S.p)
      group.current.rotation.y += ((S.mouse.x * 0.35 * t) - group.current.rotation.y) * Math.min(1, dt * 3)
      group.current.position.y = Math.sin(performance.now() / 1400) * 0.08 * t
    }
  })

  const roofAngle = Math.atan2(1.8, 2.3)
  return (
    <group ref={group}>
      {/* Massive Wände: Rückwand + Seiten bleiben immer stehen */}
      <Wall w={6.4} h={5.2} holes={BACK_HOLES} pos={[0, 0, -2]} mat={m.wall} />
      <Wall w={4} h={5.2} holes={SIDE_HOLES} pos={[-3.2, 0, 0]} rotY={Math.PI / 2} mat={m.wall} />
      <Wall w={4} h={5.2} holes={SIDE_HOLES} pos={[3.2, 0, 0]} rotY={Math.PI / 2} mat={m.wall} />
      {BACK_HOLES.map(([x, y, w, h]) => <Window key={`b${x}`} x={x} y={y + h / 2} w={w} h={h} z={-2.0} rotY={Math.PI} frame={m.frame} glass={m.glass} sill={m.sill} />)}
      {SIDE_HOLES.flatMap(([, y, w, h]) => [-1, 1].map((sx) => (
        <Window key={`s${sx}${y}`} x={sx * 3.2} y={y + h / 2} w={w} h={h} z={0} rotY={(sx * Math.PI) / 2} frame={m.frame} glass={m.glass} sill={m.sill} cross={false} />
      )))}

      {/* Vorderfassade: wird im Film per Architektur-Schnitt geöffnet */}
      <Wall w={6.4} h={5.2} holes={FRONT_HOLES} pos={[0, 0, 2]} mat={m.wallFront} />
      {FRONT_WINDOWS.map(([x, y, w, h], i) => (
        <group key={i}>
          <mesh position={[x, y, 1.9]} material={m.glow}><planeGeometry args={[w, h]} /></mesh>
          <Window x={x} y={y} w={w} h={h} z={2.03} frame={m.frameFront} glass={m.glassFront} sill={m.sillFront} cross={h < 1.5} />
        </group>
      ))}
      <mesh position={[0, 1.05, 2.0]} material={m.door} castShadow><boxGeometry args={[1.0, 2.1, 0.08]} /></mesh>
      <mesh position={[0.34, 1.0, 2.07]} material={m.steel}><boxGeometry args={[0.04, 0.3, 0.04]} /></mesh>
      <mesh position={[0, 2.25, 2.2]} material={m.dark} castShadow><boxGeometry args={[1.6, 0.06, 0.5]} /></mesh>
      <mesh position={[1.0, 1.5, 2.1]} material={m.dark}><boxGeometry args={[0.3, 0.2, 0.03]} /></mesh>
      {/* leuchtende Schnittkante, die über die Fassade wandert */}
      <mesh ref={cutLine} position={[0, 2.6, 2.0]} visible={false}>
        <boxGeometry args={[0.035, 5.3, 0.3]} />
        <meshBasicMaterial color={[0.25 * 5, 0.75 * 5, 1.4 * 5]} toneMapped={false} />
      </mesh>
      <pointLight ref={cutLight} position={[0, 2.6, 2.4]} color="#38bdf8" intensity={0} distance={4} />

      {/* Decken / Böden */}
      <mesh position={[0, 0.1, 0]} material={m.slab} receiveShadow castShadow><boxGeometry args={[6.4, 0.2, 4]} /></mesh>
      <mesh position={[0, 2.6, 0]} material={m.slab} receiveShadow castShadow><boxGeometry args={[6.4, 0.2, 4]} /></mesh>
      <mesh position={[-1.35, 2.705, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.wood} receiveShadow><planeGeometry args={[3.6, 3.8]} /></mesh>
      <GroundFloor />
      <mesh position={[0, 5.2, 0]} material={m.slab} castShadow receiveShadow><boxGeometry args={[6.4, 0.1, 4]} /></mesh>
      <mesh position={[0.6, 3.9, 0]} material={m.wall} castShadow receiveShadow><boxGeometry args={[0.12, 2.5, 3.8]} /></mesh>

      {/* Satteldach mit Dachüberstand */}
      {[1, -1].map((s) => (
        <group key={s} position={[0, 6.1, 1.15 * s]} rotation={[roofAngle * s, 0, 0]}>
          <mesh material={m.roof} castShadow receiveShadow><boxGeometry args={[7.0, 0.14, 2.92]} /></mesh>
          <mesh position={[0, -0.02, 1.47]} material={m.frame}><boxGeometry args={[7.0, 0.2, 0.04]} /></mesh>
          {s === 1 && <SolarPanels />}
        </group>
      ))}
      {[-3.12, 3.12].map((x) => (
        <mesh key={x} geometry={gable} position={[x, 5.25, 0]} rotation={[0, Math.PI / 2, 0]} material={m.wall} castShadow />
      ))}
      {/* Sockel in Anthrazit */}
      <mesh position={[0, 0.17, 2.09]} material={m.dark}><boxGeometry args={[6.44, 0.34, 0.02]} /></mesh>
      {([[0, -2.09, 6.44, 0.02], [-3.29, 0, 0.02, 4.2], [3.29, 0, 0.02, 4.2]] as const).map(([x, z, w, d]) => (
        <mesh key={`${x}${z}`} position={[x, 0.17, z]}><boxGeometry args={[w, 0.34, d]} /><meshStandardMaterial color="#2b3038" roughness={0.85} /></mesh>
      ))}

      <Exterior />
      <Balcony />
      <Interior />
      <Technik />
      <WallOpening />
      <Kitchen />
      <OldWardrobe />
      <AssemblyShelf />
      <PipeNetwork />
      <BathroomCutaway />
      <LeakScanner />
      <Electrics />

      {/* Interior lights */}
      <RoomLights />
    </group>
  )
}

function RoomLights() {
  const a = useRef<import('three').PointLight>(null)
  const b = useRef<import('three').PointLight>(null)
  useFrame(() => {
    if (a.current) a.current.intensity = 5 * bump(0.1, 0.17, 0.32, 0.38, S.p) + 1.5
    if (b.current) b.current.intensity = 3 * bump(0.38, 0.44, 0.53, 0.58, S.p) + 0.8
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

/* ---------- Balkon: Schichtaufbau der Balkonsanierung (fährt auseinander und wieder zusammen) ---------- */
const balconyX = () => bump(0.73, 0.765, 0.8, 0.835, S.p)
const BALCONY_LAYERS = ['Betonplatte', 'Abdichtung', 'Drainagematte', 'Feinsteinzeug-Belag']

function Balcony() {
  const layers = useRef<Group>(null)
  const top = useRef<Group>(null)
  const lamps = useRef<Group>(null)
  const concrete = usePbr('concrete_floor_01', [1.4, 0.6])
  const stone = usePbr('large_floor_tiles_02', [0.5, 0.5], { metalness: 0 })
  const cOld = useMemo(() => new Color('#6b5a4a'), [])
  const cNew = useMemo(() => new Color('#ffffff'), [])
  const tileMat = useMemo(() => new MeshStandardMaterial({ ...stone, color: '#ffffff', roughness: 0.55 }), [stone])
  const tiles = useMemo(() => {
    const out: [number, number][] = []
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) out.push([-1.32 + i * 0.66, -0.35 + j * 0.7])
    return out
  }, [])
  useFrame(() => {
    const X = balconyX()
    layers.current?.children.forEach((c, i) => { c.position.y = (c.userData.y as number) + X * i * 0.26 })
    tileMat.color.copy(cOld).lerp(cNew, S.ren)
    if (top.current) top.current.position.y = 0.155 + X * 4 * 0.26
    const on = smooth(0.78, 0.84, S.p) * (1 - smooth(0.9, 0.93, S.p)) * (0.25 + 0.75 * S.ren)
    lamps.current?.children.forEach((c) => {
      const mat = (c as import('three').Mesh).material as MeshStandardMaterial
      if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.2 + 3 * on
    })
  })
  const wallZ = 2 - 2.75 + 0.1
  return (
    <group position={[-1.5, 2.55, 2.75]}>
      <group ref={layers}>
        <mesh userData={{ y: 0 }} castShadow receiveShadow><boxGeometry args={[3.4, 0.16, 1.5]} /><meshStandardMaterial {...concrete} color="#d6d6d4" /></mesh>
        <mesh userData={{ y: 0.09 }}><boxGeometry args={[3.38, 0.02, 1.48]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.25} roughness={0.5} /></mesh>
        <mesh userData={{ y: 0.11 }}><boxGeometry args={[3.36, 0.02, 1.46]} /><meshStandardMaterial color="#20262e" roughness={0.9} /></mesh>
        <group userData={{ y: 0.135 }}>
          {tiles.map(([x, z]) => <mesh key={`${x}${z}`} position={[x, 0, z]} material={tileMat} castShadow receiveShadow><boxGeometry args={[0.65, 0.025, 0.69]} /></mesh>)}
        </group>
      </group>
      {BALCONY_LAYERS.map((t, i) => (
        <LayerLabel key={t} n={i + 1} text={t} position={[-0.9, 0.05 + i * 0.26, 0.78]} vis={() => balconyX() * (S.p > 0.7 && S.p < 0.86 ? 1 : 0)} color={i === 1 ? '#0ea5e9' : '#ffffff'} />
      ))}
      {/* Geländer (Glas + Edelstahl) */}
      <group ref={top} position={[0, 0.155, 0]}>
        <mesh position={[0, 0.45, 0.7]}><boxGeometry args={[3.3, 0.9, 0.02]} /><meshPhysicalMaterial color="#cfe9f7" transparent opacity={0.2} roughness={0.04} clearcoat={1} /></mesh>
        <mesh position={[0, 0.92, 0.7]}><boxGeometry args={[3.4, 0.05, 0.05]} /><meshStandardMaterial color="#c9ced4" metalness={1} roughness={0.25} /></mesh>
        {[-1.65, -0.55, 0.55, 1.65].map((x) => (
          <mesh key={x} position={[x, 0.45, 0.7]}><boxGeometry args={[0.04, 0.95, 0.04]} /><meshStandardMaterial color="#c9ced4" metalness={1} roughness={0.25} /></mesh>
        ))}
        <mesh position={[-1.65, 0.45, 0]}><boxGeometry args={[0.02, 0.9, 1.4]} /><meshPhysicalMaterial color="#cfe9f7" transparent opacity={0.16} roughness={0.04} /></mesh>
      </group>
      {/* Elektrik/Montage: Außenleuchten neben der Balkontür + Außensteckdose, Leitung in der Fassade */}
      <group ref={lamps}>
        {[-1.15, 0.55].map((x) => (
          <mesh key={x} position={[x, 1.75, wallZ]}><boxGeometry args={[0.1, 0.22, 0.07]} /><meshStandardMaterial color="#fff6dc" emissive="#ffe6b0" emissiveIntensity={0.2} toneMapped={false} /></mesh>
        ))}
        <mesh position={[0.95, 0.55, wallZ]}><boxGeometry args={[0.1, 0.1, 0.04]} /><meshStandardMaterial color="#f1f1ef" roughness={0.4} /></mesh>
      </group>
      <FlowPipe points={[[-1.15, 1.75, wallZ - 0.1], [-1.15, 2.3, wallZ - 0.1], [0.55, 2.3, wallZ - 0.1], [0.55, 1.75, wallZ - 0.1]]} color="#ffffff" radius={0.014} speed={0.9} glow={() => 0.3 + bump(0.74, 0.78, 0.84, 0.88, S.p)} />
      <FlowPipe points={[[0.55, 2.3, wallZ - 0.11], [0.95, 2.3, wallZ - 0.11], [0.95, 0.55, wallZ - 0.11]]} color="#f8fafc" radius={0.012} speed={0.9} glow={() => 0.3 + bump(0.74, 0.78, 0.84, 0.88, S.p)} />
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
  const on = () => 0.25 + 1.0 * smooth(0.6, 0.66, S.p) * (1 - smooth(0.88, 0.92, S.p))
  const lit = () => on() * (0.2 + 0.8 * S.ren)
  useFrame(() => {
    if (light.current) light.current.intensity = 10 * smooth(0.64, 0.68, S.p) * S.ren * (1 - smooth(0.88, 0.92, S.p))
    spots.current?.children.forEach((c) => ((c as import('three').Mesh).material as MeshStandardMaterial).emissiveIntensity = 3.2 * lit())
  })
  return (
    <group>
      <FlowPipe points={[[-3.1, 2.8, -1.9], [-3.1, 5.0, -1.9], [-1.8, 5.05, -1.5], [-0.2, 5.05, -1.0], [-0.2, 5.05, 1.2]]} color="#ffffff" radius={0.022} speed={0.9} glow={on} />
      <FlowPipe points={[[-3.1, 2.8, -1.8], [-3.1, 3.2, -1.0], [-3.1, 3.2, 1.2]]} color="#f8fafc" radius={0.02} speed={0.9} glow={on} />
      <FlowPipe points={[[-0.45, 2.8, -1.9], [-0.45, 3.4, -1.9], [-1.4, 3.4, -1.9]]} color="#ffffff" radius={0.02} speed={0.9} glow={on} />
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

