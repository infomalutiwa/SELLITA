import { Suspense, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor, Preload, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { heroScroll } from './heroScroll'

type Tool = { file: string; size: number; pos: [number, number, number]; rot: [number, number, number]; out: [number, number, number]; spin: number; mobile?: boolean }

// Werkzeug-Modelle von Poly Haven (CC0), mit gltf-transform auf WebP-Texturen + Meshopt verkleinert
const TOOLS: Tool[] = [
  { file: 'pipe_wrench', size: 3.3, pos: [0.15, 0.35, 0], rot: [0.35, -0.5, -0.75], out: [1.6, 2.2, 1.5], spin: 0.9, mobile: true },
  { file: 'adjustable_wrench', size: 2.3, pos: [-1.35, -0.65, 0.5], rot: [-0.4, 0.6, 0.55], out: [-2.4, -1.4, 1], spin: -1.1, mobile: true },
  { file: 'tongue_groove_pliers', size: 2.2, pos: [1.45, -0.95, 0.9], rot: [0.9, 0.3, 2.3], out: [2.4, -2, 1.2], spin: 1.3, mobile: true },
  { file: 'flathead_screwdriver', size: 1.9, pos: [-1.2, 1.25, -0.6], rot: [0.2, 0.9, -2.2], out: [-2.6, 2, -0.5], spin: -0.8 },
  { file: 'measuring_tape_01', size: 0.75, pos: [0.25, -1.6, 0.4], rot: [1.1, 0.2, 0.3], out: [0.3, -3, 1], spin: 1.6 },
]
TOOLS.forEach((t) => useGLTF.preload(`models/${t.file}.glb`))

function Model({ t, i }: { t: Tool; i: number }) {
  const { scene } = useGLTF(`models/${t.file}.glb`)
  const obj = useMemo(() => scene.clone(true), [scene])
  const ref = useRef<THREE.Group>(null)
  // auf einheitliche Länge bringen und zentrieren
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(obj)
    const v = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3())
    const s = t.size / Math.max(v.x, v.y, v.z)
    obj.scale.setScalar(s)
    obj.position.copy(c).multiplyScalar(-s)
    obj.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (m) m.envMapIntensity = 1.5 })
  }, [obj, t.size])
  const intro = useRef(0)
  useFrame((state, dt) => {
    const g = ref.current!
    intro.current = Math.min(1, intro.current + dt * 0.7)
    const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, intro.current * 1.6 - i * 0.12)), 3) // gestaffeltes Hereinschweben
    const p = heroScroll.p, time = state.clock.elapsedTime
    const fl = Math.sin(time * 0.8 + i * 1.7) * 0.06
    g.position.set(
      t.pos[0] + t.out[0] * p,
      t.pos[1] + t.out[1] * p + fl - (1 - e) * 1.2,
      t.pos[2] + t.out[2] * p,
    )
    g.rotation.set(t.rot[0] + p * t.spin * 0.6, t.rot[1] + p * t.spin + Math.sin(time * 0.5 + i) * 0.06 - (1 - e) * 1.5, t.rot[2])
    g.scale.setScalar(Math.max(0.001, e))
  })
  return <group ref={ref}><primitive object={obj} /></group>
}

function RedrawOnScroll() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const on = () => invalidate()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [invalidate])
  return null
}

function Rig({ mobile }: { mobile: boolean }) {
  const g = useRef<THREE.Group>(null)
  const { size } = useThree()
  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 3)
    g.current!.rotation.y += (state.pointer.x * 0.25 - g.current!.rotation.y) * k
    g.current!.rotation.x += (-state.pointer.y * 0.15 - g.current!.rotation.x) * k
  })
  const scale = mobile ? Math.min(1, size.width / 430) * 0.82 : Math.min(1, size.width / 820) * 0.92
  return (
    <group ref={g} scale={scale}>
      {TOOLS.filter((t) => !mobile || t.mobile).map((t, i) => <Model key={t.file} t={t} i={i} />)}
    </group>
  )
}

export default function Tools3D({ className = '' }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [dpr, setDpr] = useState(() => Math.min(1.5, devicePixelRatio || 1))
  const [low, setLow] = useState(false) // schwaches Gerät: nur noch beim Scrollen neu zeichnen
  const mobile = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 767px)').matches
  // nur rendern, solange der Einstieg sichtbar ist
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(wrap.current!)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={wrap} className={className} aria-hidden>
      <Canvas
        frameloop={!visible ? 'never' : low ? 'demand' : 'always'}
        dpr={dpr}
        camera={{ position: [0, 0, 7.5], fov: 35 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      >
        {/* wird es zu langsam, rendert der Canvas mit geringerer Auflösung */}
        <PerformanceMonitor flipflops={3} onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(1.5, devicePixelRatio || 1))} onFallback={() => { setDpr(1); setLow(true) }} />
        {low && <RedrawOnScroll />}
        <Suspense fallback={null}>
          <Rig mobile={mobile} />
          <Preload all />
          {/* Studiolicht aus Softboxen statt HDR-Datei: kostet keinen Download und spiegelt sauber im Metall */}
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={3} position={[0, 4, 3]} scale={[10, 3, 1]} rotation-x={Math.PI / 2.4} />
            <Lightformer intensity={1.6} position={[-5, 1, 1]} scale={[3, 8, 1]} rotation-y={Math.PI / 2} />
            <Lightformer intensity={1.2} position={[5, -1, 2]} scale={[3, 6, 1]} rotation-y={-Math.PI / 2} color="#dbe9ff" />
            <Lightformer intensity={0.6} position={[0, -4, 2]} scale={[10, 2, 1]} rotation-x={-Math.PI / 2} />
            <Lightformer intensity={0.4} form="ring" position={[2, 2, -4]} scale={2} />
          </Environment>
          <directionalLight position={[3, 5, 4]} intensity={1.6} />
          <ambientLight intensity={0.45} />
        </Suspense>
      </Canvas>
    </div>
  )
}
