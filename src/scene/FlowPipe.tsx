import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CatmullRomCurve3, Color, InstancedMesh, Object3D, Quaternion, TubeGeometry, TorusGeometry, Vector3 } from 'three'
import type { V3 } from './layout'

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`

// nur der Fluss-Impuls, additiv über dem echten (beleuchteten) Rohr
const frag = /* glsl */ `
uniform float uTime, uGlow, uLen, uSpeed; uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float x = fract(vUv.x * uLen / 1.1 - uTime * uSpeed);
  float pulse = smoothstep(0.0, 0.05, x) * (1.0 - smoothstep(0.05, 0.5, x));
  float k = max(0.0, uGlow - 0.5);
  gl_FragColor = vec4(uColor * pulse * k * 1.6, 1.0);
}`

/** Entartete Kurvenstücke liefern NaN-Normalen -> würden über Bloom das ganze Bild schwärzen */
function clean(g: TubeGeometry) {
  for (const name of ['position', 'normal'] as const) {
    const a = g.attributes[name].array as Float32Array
    for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) a[i] = name === 'normal' && i % 3 === 1 ? 1 : 0
  }
  return g
}

type Props = { points: V3[]; radius?: number; color: string; speed?: number; glow: () => number; closed?: boolean }

/** Rohr mit physikalischem Material (Kupfer/PE-X/Leitung) und einem dezenten Fluss-Impuls, der hindurchläuft. */
export function FlowPipe({ points, radius = 0.045, color, speed = 0.55, glow, closed = false }: Props) {
  const { geo, pulseGeo, len, curve } = useMemo(() => {
    const c = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed, 'centripetal')
    const l = c.getLength()
    const seg = Math.max(24, Math.ceil(l * 22))
    return { geo: clean(new TubeGeometry(c, seg, radius, 12, closed)), pulseGeo: clean(new TubeGeometry(c, seg, radius * 1.04, 10, closed)), len: l, curve: c }
  }, [points, radius, closed])
  const copper = useMemo(() => { const c = new Color(color); return c.r > c.b }, [color])
  // Rohrschellen im Abstand von ~0.8 m
  const clamps = useRef<InstancedMesh>(null)
  const clampGeo = useMemo(() => new TorusGeometry(radius * 1.45, radius * 0.38, 8, 20), [radius])
  const n = Math.max(2, Math.round(len / 0.8) + 1)
  useLayoutEffect(() => {
    const o = new Object3D(), q = new Quaternion(), z = new Vector3(0, 0, 1)
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      o.position.copy(curve.getPointAt(t))
      q.setFromUnitVectors(z, curve.getTangentAt(t).normalize())
      o.quaternion.copy(q)
      o.updateMatrix()
      clamps.current?.setMatrixAt(i, o.matrix)
    }
    if (clamps.current) clamps.current.instanceMatrix.needsUpdate = true
  }, [curve, n])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uGlow: { value: 1 }, uLen: { value: len }, uSpeed: { value: speed }, uColor: { value: new Color(color) } }),
    [len, speed, color],
  )
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uGlow.value = glow()
  })
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow frustumCulled={false}>
        {copper
          ? <meshPhysicalMaterial color={color} metalness={1} roughness={0.22} clearcoat={0.4} />
          : <meshPhysicalMaterial color={color} metalness={0.05} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.15} />}
      </mesh>
      <mesh geometry={pulseGeo} frustumCulled={false}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={clamps} args={[clampGeo, undefined, n]} frustumCulled={false}>
        <meshStandardMaterial color="#b8bec6" metalness={1} roughness={0.3} />
      </instancedMesh>
    </group>
  )
}
