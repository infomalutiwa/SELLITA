import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { DoubleSide, PlaneGeometry, ShaderMaterial } from 'three'
import { S, smooth } from '../state'
import { CITIES } from './layout'

export const MAP_Y = -80
const SIZE = 28

export function terrainH(x: number, z: number) {
  const r = Math.hypot(x, z)
  let h = 0.35 * Math.sin(x * 0.45 + 1.2) * Math.cos(z * 0.38) + 0.18 * Math.sin(x * 1.1 + z * 0.8) + 0.1 * Math.cos(z * 1.7 - x * 0.6)
  h += 0.95 * Math.exp(-Math.pow(x + 7.5 - z * 0.15, 2) / 14) // Schwarzwald
  h += 0.7 * Math.exp(-(Math.pow(x - 8, 2) + Math.pow(z - 5, 2)) / 30) // Schwäbische Alb
  h -= 0.5 * Math.exp(-Math.pow(x + 8.5, 2) / 10 - Math.pow(z + 3, 2) / 30) * 0.4
  return (h + 0.3) * (0.35 + 0.65 * smooth(0, 4, r))
}

const vert = /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const frag = /* glsl */ `
uniform float uTime, uR, uFade; varying vec3 vP;
void main(){
  float h = vP.y;
  vec3 low = vec3(0.07,0.10,0.14), high = vec3(0.16,0.24,0.31);
  vec3 col = mix(low, high, clamp(h*1.1+0.2,0.0,1.0));
  float c = abs(fract(h*9.0)-0.5); col += vec3(0.05,0.18,0.28) * (1.0 - smoothstep(0.0,0.05,c)) * 0.9;
  vec2 g = abs(fract(vP.xz*0.5)-0.5); col += vec3(0.04,0.08,0.12) * (1.0 - smoothstep(0.0,0.03,min(g.x,g.y)));
  float d = length(vP.xz);
  float inside = 1.0 - smoothstep(uR-0.05, uR+0.05, d);
  col += vec3(0.0,0.35,0.6) * 0.18 * inside * uFade;
  float ring = (1.0 - smoothstep(0.0,0.07,abs(d-uR))) * uFade;
  col += vec3(0.2,0.8,1.6) * ring * 2.2;
  float w = fract(uTime*0.18); float rw = w*uR;
  col += vec3(1.0,0.35,0.15) * (1.0 - smoothstep(0.0,0.2,abs(d-rw))) * (1.0-w) * 0.9 * uFade;
  float r50 = 1.0 - smoothstep(0.0,0.03,abs(d-uR*0.5)); col += vec3(0.3,0.5,0.7) * r50 * 0.5 * uFade;
  col *= 1.0 - smoothstep(11.0, 14.0, d) * 0.9;
  gl_FragColor = vec4(col,1.0);
  #include <colorspace_fragment>
}`

/** Stilisierte 3D-Topografie BW mit leuchtendem 100-km-Radius um Gärtringen (1 Einheit = 10 km). */
export function ServiceRadiusMap() {
  const seg = S.mobile ? 90 : 150
  const geo = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, seg, seg)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, terrainH(p.getX(i), p.getZ(i)))
    g.computeVertexNormals()
    return g
  }, [seg])
  const mat = useMemo(() => new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uTime: { value: 0 }, uR: { value: 0 }, uFade: { value: 0 } }, side: DoubleSide }), [])
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    mat.uniforms.uR.value = 10 * smooth(0.88, 0.97, S.p)
    mat.uniforms.uFade.value = smooth(0.87, 0.92, S.p)
  })
  const hc = (x: number, z: number) => terrainH(x, z)
  return (
    <group position={[0, MAP_Y, 0]}>
      <mesh geometry={geo} material={mat} />
      {/* Sockel */}
      <mesh position={[0, -1.9, 0]}><boxGeometry args={[SIZE, 1.1, SIZE]} /><meshStandardMaterial color="#1e242b" /></mesh>

      {/* Miniatur-Haus auf Gärtringen */}
      <group position={[0, hc(0, 0), 0]} scale={0.22}>
        <mesh position={[0, 1.3, 0]}><boxGeometry args={[3.2, 2.6, 2.2]} /><meshStandardMaterial color="#f8fafc" /></mesh>
        <mesh position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1]}><boxGeometry args={[2.4, 2.4, 2.4]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <mesh position={[1.7, 1.3, 0]}><boxGeometry args={[0.2, 2.6, 2.2]} /><meshStandardMaterial color="#0ea5e9" /></mesh>
      </group>
      <mesh position={[0, hc(0, 0) + 1.4, 0]}><cylinderGeometry args={[0.012, 0.012, 2.4, 6]} /><meshBasicMaterial color="#ff5722" toneMapped={false} /></mesh>
      <mesh position={[0, hc(0, 0) + 2.65, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#ff5722" toneMapped={false} /></mesh>
      <Html position={[0, hc(0, 0) + 3.1, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="lbl3d" style={{ borderColor: '#ff5722', fontSize: 12 }}>71116 Gärtringen</div>
      </Html>

      {CITIES.map((c) => (
        <group key={c.name} position={[c.x, hc(c.x, c.z), c.z]}>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 6]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
          <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color={c.main ? '#ff5722' : '#38bdf8'} toneMapped={false} /></mesh>
          <Html position={[0, 0.8, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div className="lbl3d" style={c.main ? { borderColor: '#ff5722' } : undefined}>{c.name}</div>
          </Html>
        </group>
      ))}
      <Html position={[0, 0.2, 10]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="lbl3d" style={{ color: '#38bdf8' }}>100 km</div>
      </Html>
      <Html position={[0, 0.2, 5]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="lbl3d" style={{ opacity: 0.7 }}>50 km</div>
      </Html>
    </group>
  )
}
