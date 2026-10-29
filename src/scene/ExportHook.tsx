import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { S } from '../state'
import { FOCUS } from './CameraRig'

/** Nur im Export-Modus: stellt Szene, Kamera und GLTF-Export für das Offline-Rendering (Blender) bereit. */
export function ExportHook() {
  const { scene, camera, gl } = useThree()
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__sellita = {
      S, scene, camera, gl, FOCUS,
      exporter: () => import('three/examples/jsm/exporters/GLTFExporter.js').then((m) => new m.GLTFExporter()),
    }
  }, [scene, camera, gl])
  return null
}
