import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { ACESFilmicToneMapping, BackSide, Color, PCFSoftShadowMap, ShaderMaterial, type Group, type Mesh } from 'three'
import { useRef } from 'react'
import { S, smooth } from '../state'
import { HouseScene } from './HouseScene'
import { CameraRig } from './CameraRig'
import { ServiceRadiusMap, MAP_Y } from './ServiceRadiusMap'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} color="#b6c4d8" />
      <hemisphereLight args={['#9fb4d0', '#1e242b', 0.55]} />
      <directionalLight position={[8, 12, 9]} intensity={2.1} color="#fff3e6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      <directionalLight position={[-9, 5, -6]} intensity={0.9} color="#5aa9ff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 6]} scale={[12, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-8, 3, -3]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#38bdf8" />
        <Lightformer form="rect" intensity={1.2} position={[8, 2, -3]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} color="#ff6a3a" />
      </Environment>
    </>
  )
}

function Stage() {
  const mapRef = useRef<Group>(null)
  const houseRef = useRef<Group>(null)
  useFrame(() => {
    // Kartenszene nur rendern, wenn sie gebraucht wird
    if (mapRef.current) mapRef.current.visible = S.free || S.p > 0.8
    if (houseRef.current) houseRef.current.visible = S.free || S.p < 0.93
  })
  return (
    <>
      <group ref={houseRef}><HouseScene /></group>
      <group ref={mapRef}><ServiceRadiusMap /></group>
      <Sparkles count={S.mobile ? 50 : 140} scale={[16, 9, 16]} position={[0, 3.5, 0]} size={2.2} speed={0.25} opacity={0.5} color="#7fb8e8" />
      <Sparkles count={S.mobile ? 20 : 60} scale={[12, 6, 12]} position={[0, MAP_Y + 3, 0]} size={2} speed={0.2} opacity={0.5} color="#ff8a5a" />
      <Stars radius={90} depth={50} count={S.mobile ? 800 : 2500} factor={4} saturation={0.3} fade speed={0.6} />
      <SkyDome />
      <SceneFog />
    </>
  )
}

function SkyDome() {
  const ref = useRef<Mesh>(null)
  const mat = useMemo(() => new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { uWarm: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uWarm; varying vec3 vP; void main(){ float h = clamp(vP.y*0.5+0.5,0.0,1.0); vec3 low = mix(vec3(0.06,0.08,0.11), vec3(0.28,0.14,0.12), uWarm); vec3 top = vec3(0.02,0.035,0.07); vec3 c = mix(low, top, pow(h,0.55)); c += vec3(0.05,0.12,0.22)*pow(1.0-abs(vP.y),6.0)*0.7; gl_FragColor = vec4(c,1.0); #include <colorspace_fragment>\n }',
  }), [])
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position)
    mat.uniforms.uWarm.value = 1 - smooth(0.0, 0.2, S.p)
  })
  return <mesh ref={ref} material={mat} renderOrder={-10}><sphereGeometry args={[120, 32, 16]} /></mesh>
}

function SceneFog() {
  useFrame(({ scene }) => {
    if (!scene.background) scene.background = new Color('#0f141c')
    ;(scene.background as Color).set('#0f141c')
  })
  return <fog attach="fog" args={['#0f141c', 28, 70]} />
}

export function Experience() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  return (
    <Canvas
      dpr={[1, 2]}
      shadows={{ type: PCFSoftShadowMap }}
      camera={{ position: [9.5, 4.8, 13.5], fov: 42, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={['#0f141c']} />
      <Suspense fallback={null}>
        <Lights />
        <Stage />
        <CameraRig />
      </Suspense>
      <EffectComposer multisampling={S.mobile ? 0 : 4}>
        {!S.mobile && <N8AO aoRadius={0.7} distanceFalloff={1.2} intensity={2.2} quality="medium" color="#0b1018" />}
        <Bloom intensity={S.mobile ? 0.7 : 0.95} luminanceThreshold={0.75} luminanceSmoothing={0.25} mipmapBlur radius={0.7} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
