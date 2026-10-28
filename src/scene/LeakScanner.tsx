import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import { ShaderMaterial, Vector2, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { S, smooth } from '../state'
import { LEAK } from './layout'

const vis = () => smooth(0.19, 0.23, S.p) * (1 - smooth(0.36, 0.4, S.p))

// Wärmebild-Palette (Eisen): dunkel -> Blau -> Gelb -> Rot -> Weiß; Rot nur hier (Thermografie)
const thermoFrag = /* glsl */ `
uniform float uTime, uScan, uOpacity, uFound; uniform vec2 uLeak; uniform float uPipeY;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
vec3 iron(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(vec3(0.03,0.02,0.12), vec3(0.05,0.35,0.75), smoothstep(0.0, 0.3, t));
  c = mix(c, vec3(0.98,0.8,0.15), smoothstep(0.35, 0.62, t));
  c = mix(c, vec3(0.94,0.27,0.27), smoothstep(0.62, 0.85, t));
  return mix(c, vec3(1.0,0.95,0.9), smoothstep(0.9, 1.0, t));
}
void main(){
  vec2 p = vUv * vec2(3.0, 1.9);
  float t = 0.18 + 0.12 * n(p * 3.0 + uTime * 0.05) + 0.06 * n(p * 9.0);
  float py = (p.y - uPipeY) / 0.07; t += 0.22 * exp(-py * py);            // Leitung zeichnet sich ab
  float d = length((p - uLeak) * vec2(1.0, 1.25));
  float pulse = 0.85 + 0.15 * sin(uTime * 4.0);
  t += uFound * pulse * (0.5 * exp(-d * d / 0.05) + 0.22 * exp(-d * d / 0.4)); // feuchte Stelle
  vec3 col = iron(t);
  float edge = smoothstep(uScan - 0.01, uScan, vUv.x) * (1.0 - smoothstep(uScan, uScan + 0.015, vUv.x));
  col += vec3(0.6, 0.85, 1.0) * edge * 2.0;
  float a = uOpacity * (1.0 - smoothstep(uScan, uScan + 0.004, vUv.x));
  a = max(a, uOpacity * edge);
  gl_FragColor = vec4(col, a * 0.94);
  #include <colorspace_fragment>
}`
const thermoVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

/** Leckortung: Wand wird per Thermografie gescannt, Putz wird transparent, Sonar-Ring prüft das Rohr, Schadstelle wird markiert. */
export function LeakScanner() {
  const root = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const ringMat = useRef<MeshBasicMaterial>(null)
  const plaster = useRef<MeshStandardMaterial>(null)
  const sonar = useRef<Group>(null)
  const cross = useRef<Group>(null)
  const dot = useRef<Mesh>(null)
  const label = useRef<HTMLDivElement>(null)
  // Wandfläche 3.0 x 1.9 m, Mitte [1.8, 1.65]; Leck/Leitung in Flächen-Koordinaten
  const thermo = useMemo(() => new ShaderMaterial({
    vertexShader: thermoVert, fragmentShader: thermoFrag, transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uScan: { value: 0 }, uOpacity: { value: 0 }, uFound: { value: 0 }, uLeak: { value: new Vector2(LEAK[0] - 0.3, LEAK[1] - 0.7) }, uPipeY: { value: LEAK[1] - 0.7 } },
  }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const v = vis()
    if (root.current) root.current.visible = v > 0.001
    // Scan-Ring wandert entlang des Rohrs
    const scan = (Math.sin(t * 0.9) * 0.5 + 0.5)
    if (ring.current) ring.current.position.x = 0.55 + scan * 2.3
    if (ringMat.current) ringMat.current.opacity = v
    if (plaster.current) plaster.current.opacity = 0.95 * smooth(0.19, 0.22, S.p) * (1 - smooth(0.3, 0.335, S.p))
    // Thermografie: Scan-Linie fährt über den Putz, danach öffnet sich die Wand
    const found = smooth(0.27, 0.3, S.p)
    thermo.uniforms.uTime.value = t
    thermo.uniforms.uScan.value = smooth(0.225, 0.275, S.p) * 1.02
    thermo.uniforms.uOpacity.value = smooth(0.22, 0.23, S.p) * (1 - smooth(0.305, 0.34, S.p))
    thermo.uniforms.uFound.value = smooth(0.25, 0.28, S.p)
    // Pulsierende Schadstelle + Sonar-Wellen
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
        <meshStandardMaterial ref={plaster} color="#ece8e1" roughness={1} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh position={[1.8, 1.65, -0.905]} material={thermo} renderOrder={2}><planeGeometry args={[3.0, 1.9]} /></mesh>
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
          <mesh><ringGeometry args={[0.34, 0.36, 48]} /><meshBasicMaterial color="#ef4444" toneMapped={false} /></mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
              <planeGeometry args={[0.012, 0.22]} />
              <meshBasicMaterial color="#ef4444" toneMapped={false} />
            </mesh>
          ))}
        </group>
        <mesh ref={dot}><circleGeometry args={[0.06, 20]} /><meshBasicMaterial color="#ef4444" toneMapped={false} /></mesh>
      </Billboard>
      <Html position={[LEAK[0] + 0.5, LEAK[1] + 0.55, LEAK[2]]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className="lbl3d" style={{ opacity: 0, borderColor: '#ef4444' }}>● Leck geortet · ohne Aufstemmen</div>
      </Html>
    </group>
  )
}
