import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Color, Mesh, Vector3, type ColorRepresentation, type Material, type MeshStandardMaterial } from 'three'

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { /* swallow: procedural fallback takes over */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export type ModelProps = {
  file: string
  /** Zielhöhe in Metern (Modell wird gleichmäßig skaliert) */
  height?: number
  /** oder: Zielgröße der längsten Grundrisskante in Metern */
  length?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  /** Material-Tönung (multipliziert die Originalfarbe) */
  tint?: ColorRepresentation
  /** Welche Materialien getönt werden (Name enthält …); leer = alle */
  tintOnly?: string
  roughness?: number
  metalness?: number
  /** Mittelpunkt auf (0,0) im Grundriss und Unterkante auf y=0 */
  align?: boolean
}

function Model({ file, height, length, position, rotation, tint, tintOnly, roughness, metalness, align = true }: ModelProps) {
  const { scene } = useGLTF(`/models/${file}`)
  const obj = useMemo(() => {
    const c = scene.clone(true)
    const seen = new Map<Material, Material>()
    c.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      const mat = m.material as MeshStandardMaterial
      if (!seen.has(mat)) {
        const k = mat.clone() as MeshStandardMaterial
        k.envMapIntensity = 1.1
        if (tint && (!tintOnly || k.name.toLowerCase().includes(tintOnly.toLowerCase()))) k.color.multiply(new Color(tint))
        if (roughness !== undefined) k.roughness = roughness
        if (metalness !== undefined) k.metalness = metalness
        seen.set(mat, k)
      }
      m.material = seen.get(mat)!
    })
    const box = new Box3().setFromObject(c)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const s = height ? height / size.y : length ? length / Math.max(size.x, size.z) : 1
    if (align) c.position.set(-center.x, -box.min.y, -center.z)
    return { c, s }
  }, [scene, height, length, tint, tintOnly, roughness, metalness, align])
  return (
    <group position={position} rotation={rotation} scale={obj.s}>
      <primitive object={obj.c} />
    </group>
  )
}

let manifest: Promise<string[]> | null = null
const loadManifest = () =>
  (manifest ??= fetch('/models/manifest.json')
    .then((r) => (r.ok ? r.json() : { models: [] }))
    .then((j) => (Array.isArray(j.models) ? (j.models as string[]) : []))
    .catch(() => []))

/**
 * Lädt ein Open-Source-.glb aus /public/models (siehe `npm run assets`), richtet es automatisch aus
 * (Größe, Ursprung) und fällt bei fehlender/defekter Datei nahtlos auf das prozedurale Mesh zurück.
 */
export function ExternalModelLoader({ fallback = null, ...props }: ModelProps & { fallback?: ReactNode }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    loadManifest().then((m) => alive && setOk(m.includes(props.file)))
    return () => { alive = false }
  }, [props.file])
  if (!ok) return <>{fallback}</>
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model {...props} />
      </Suspense>
    </Boundary>
  )
}
