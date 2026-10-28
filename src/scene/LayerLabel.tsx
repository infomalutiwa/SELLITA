import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { V3 } from './layout'

/** Beschriftung einer Bauteil-Schicht in der Explosionsansicht; Sichtbarkeit kommt aus dem Scroll-Fortschritt. */
export function LayerLabel({ n, text, position, vis, color = '#0ea5e9' }: { n: number; text: string; position: V3; vis: () => number; color?: string }) {
  const el = useRef<HTMLDivElement>(null)
  useFrame(() => { if (el.current) el.current.style.opacity = String(vis()) })
  return (
    <Html position={position} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={el} className="lbl3d" style={{ opacity: 0, borderColor: color }}>
        <span style={{ color }}>{String(n).padStart(2, '0')}</span> {text}
      </div>
    </Html>
  )
}
