import { Component, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { /* swallow: procedural fallback takes over */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Model({ url, ...rest }: { url: string; position?: [number, number, number]; scale?: number; rotation?: [number, number, number] }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene.clone()} {...rest} />
}

let manifest: Promise<string[]> | null = null
const loadManifest = () =>
  (manifest ??= fetch('/models/manifest.json')
    .then((r) => (r.ok ? r.json() : { models: [] }))
    .then((j) => (Array.isArray(j.models) ? (j.models as string[]) : []))
    .catch(() => []))

/**
 * Loads an open-source .glb from /public/models (see `npm run assets`) and silently falls back to the
 * procedural mesh if the file is missing or broken. The manifest check avoids pointless 404 requests.
 */
export function ExternalModelLoader({ file, fallback = null, ...rest }: { file: string; fallback?: ReactNode; position?: [number, number, number]; scale?: number; rotation?: [number, number, number] }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    loadManifest().then((m) => alive && setOk(m.includes(file)))
    return () => { alive = false }
  }, [file])
  if (!ok) return <>{fallback}</>
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model url={`/models/${file}`} {...rest} />
      </Suspense>
    </Boundary>
  )
}
