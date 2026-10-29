import { Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Sky, Sparkles } from '@react-three/drei'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, ChromaticAberration, Noise, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'
import { PCFSoftShadowMap, type Group } from 'three'
import { useRef } from 'react'
import { S, smooth } from '../state'
import { HouseScene } from './HouseScene'
import { CameraRig } from './CameraRig'
import { ServiceRadiusMap, MAP_Y } from './ServiceRadiusMap'

function LiteSky() {
  const ref = useRef<Group>(null)
  useFrame(() => { if (ref.current) ref.current.visible = S.free || S.p < 0.88 })
  return <group ref={ref}><Sky distance={4500} sunPosition={[-40, 6, 60]} turbidity={6} rayleigh={1.6} mieCoefficient={0.006} mieDirectionalG={0.9} /></group>
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.06} color="#b6c4d8" />
      <directionalLight position={[-9, 7, 10]} intensity={3.0} color="#ffc99a" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0003} shadow-normalBias={0.03} />
      <directionalLight position={[10, 4, -6]} intensity={0.5} color="#7aa7ff" />
      {import.meta.env.VITE_LITE ? (
        <>
          <LiteSky />
          <Environment resolution={256} environmentIntensity={0.9}>
            <Lightformer form="rect" intensity={2.2} color="#ffc99a" position={[-6, 5, 8]} scale={[10, 6, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#9bb8e8" position={[8, 4, -6]} scale={[10, 5, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#b6c4d8" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
          </Environment>
        </>
      ) : (
        <Environment files="ph/hdr/qwantani_dusk_2_puresky.hdr" background backgroundBlurriness={0.02} environmentIntensity={0.9} />
      )}
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
      <Sparkles count={S.mobile ? 20 : 50} scale={[7, 5, 5]} position={[0, 2.8, 0.5]} size={1.4} speed={0.15} opacity={0.22} color="#ffe6c4" />
      <Sparkles count={S.mobile ? 20 : 60} scale={[12, 6, 12]} position={[0, MAP_Y + 3, 0]} size={2} speed={0.2} opacity={0.5} color="#bfe6ff" />
      <SceneFog />
    </>
  )
}

function SceneFog() {
  useFrame(({ scene }) => {
    // HDRI-Himmel nur im Haus-Teil; die Karten-Szene steht vor dunklem Grund
    scene.backgroundIntensity = S.free ? 1 : 1 - smooth(0.85, 0.89, S.p)
    // im Haus weniger Himmelslicht -> tiefere Schatten, Innenleuchten tragen das Bild
    scene.environmentIntensity = S.free ? 0.9 : 0.9 - 0.4 * smooth(0.1, 0.18, S.p) * (1 - smooth(0.7, 0.76, S.p))
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
      onCreated={({ gl }) => { gl.localClippingEnabled = true }}
    >
      <Suspense fallback={null}>
        <Lights />
        <Stage />
        <CameraRig />
      </Suspense>
      <EffectComposer multisampling={S.mobile ? 0 : 4}>
        {!S.mobile && <N8AO aoRadius={0.7} distanceFalloff={1.2} intensity={2.2} quality="medium" color="#0b1018" />}
        {/* filmische Objektiv-Unschärfe zu den Bildrändern (stabiler als Tiefenunschärfe) */}
        {!S.mobile ? <TiltShift2 blur={0.12} taper={0.6} start={[0.0, 0.5]} end={[1.0, 0.5]} samples={8} /> : <></>}
        <Bloom intensity={S.mobile ? 0.35 : 0.5} luminanceThreshold={1.0} luminanceSmoothing={0.25} mipmapBlur radius={0.7} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <BrightnessContrast brightness={-0.02} contrast={0.12} />
        <HueSaturation saturation={0.1} />
        <ChromaticAberration offset={new Vector2(0.0006, 0.0006)} radialModulation modulationOffset={0.3} blendFunction={BlendFunction.NORMAL} />
        <Noise opacity={0.035} premultiply />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
