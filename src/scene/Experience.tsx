import { Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { PCFSoftShadowMap, type Group } from 'three'
import { useRef } from 'react'
import { S, smooth } from '../state'
import { HouseScene } from './HouseScene'
import { CameraRig } from './CameraRig'
import { ServiceRadiusMap, MAP_Y } from './ServiceRadiusMap'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.12} color="#b6c4d8" />
      <directionalLight position={[-9, 7, 10]} intensity={2.4} color="#ffc99a" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0003} shadow-normalBias={0.03} />
      <directionalLight position={[10, 4, -6]} intensity={0.5} color="#7aa7ff" />
      {/* Fotografische HDRI (Poly Haven, CC0): Licht, Reflexionen und Hintergrund */}
      <Environment files="/ph/hdr/qwantani_dusk_2_puresky.hdr" background backgroundBlurriness={0.02} environmentIntensity={1.5} />
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
      <SceneFog />
    </>
  )
}

function SceneFog() {
  useFrame(({ scene }) => {
    // HDRI-Himmel nur im Haus-Teil; die Karten-Szene steht vor dunklem Grund
    scene.backgroundIntensity = S.free ? 1 : 1 - smooth(0.85, 0.89, S.p)
    scene.backgroundBlurriness = 0.02 + 0.5 * smooth(0.8, 0.88, S.p)
  })
  return null
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
      gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 1.0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <Suspense fallback={null}>
        <Lights />
        <Stage />
        <CameraRig />
      </Suspense>
      <EffectComposer multisampling={S.mobile ? 0 : 4}>
        {!S.mobile && <N8AO aoRadius={0.7} distanceFalloff={1.2} intensity={2.2} quality="medium" color="#0b1018" />}
        <Bloom intensity={S.mobile ? 0.5 : 0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur radius={0.7} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Noise opacity={0.035} premultiply />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
