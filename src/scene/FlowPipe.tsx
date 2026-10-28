import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Color, InstancedMesh, Object3D, Quaternion, TubeGeometry, TorusGeometry, Vector3 } from 'three'
import type { V3 } from './layout'

const vert = /* glsl */ `
varying vec2 vUv; varying vec3 vN;
void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`

const frag = /* glsl */ `
uniform float uTime, uGlow, uLen, uSpeed; uniform vec3 uColor;
varying vec2 vUv; varying vec3 vN;
void main(){
  float x = fract(vUv.x * uLen / 1.1 - uTime * uSpeed);
  float pulse = smoothstep(0.0, 0.05, x) * (1.0 - smoothstep(0.05, 0.55, x));
  float rim = pow(1.0 - abs(vN.z), 2.0);
  vec3 base = uColor * (0.22 + 0.35 * rim);
  vec3 col = (base + uColor * pulse * 2.4 + vec3(pulse * pulse * 0.6)) * uGlow;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

type Props = { points: V3[]; radius?: number; color: string; speed?: number; glow: () => number; closed?: boolean }

/** Pipe tube (CatmullRomCurve3 + TubeGeometry) with a custom shader that sends energy pulses through it. */
export function FlowPipe({ points, radius = 0.045, color, speed = 0.55, glow, closed = false }: Props) {
  const { geo, len, curve } = useMemo(() => {
    const c = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed, 'centripetal')
    const l = c.getLength()
    return { geo: new TubeGeometry(c, Math.max(24, Math.ceil(l * 22)), radius, 8, closed), len: l, curve: c }
  }, [points, radius, closed])
  // Rohrschellen (Kupfer) im Abstand von ~0.8 m + Muffen an den Enden
  const clamps = useRef<InstancedMesh>(null)
  const clampGeo = useMemo(() => new TorusGeometry(radius * 1.55, radius * 0.42, 8, 20), [radius])
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
    <mesh geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} toneMapped={false} />
      <instancedMesh ref={clamps} args={[clampGeo, undefined, n]} frustumCulled={false}>
        <meshStandardMaterial color="#c98b5b" metalness={1} roughness={0.28} />
      </instancedMesh>
    </mesh>
  )
}
