import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { RepeatWrapping, SRGBColorSpace, type MeshStandardMaterialParameters, type Texture } from 'three'

/**
 * PBR-Material aus Poly-Haven-Texturen (CC0): /public/ph/tex/<id>/{diff,nor,arm}.jpg
 * arm = Ambient Occlusion (R) / Roughness (G) / Metalness (B)
 */
export function usePbr(id: string, repeat: [number, number] = [1, 1], extra: MeshStandardMaterialParameters = {}): MeshStandardMaterialParameters {
  const [map, normalMap, arm] = useTexture([`ph/tex/${id}/diff.jpg`, `ph/tex/${id}/nor.jpg`, `ph/tex/${id}/arm.jpg`]) as Texture[]
  return useMemo(() => {
    for (const t of [map, normalMap, arm]) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8 }
    map.colorSpace = SRGBColorSpace
    return { map, normalMap, aoMap: arm, roughnessMap: arm, metalnessMap: arm, metalness: 1, roughness: 1, ...extra }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, normalMap, arm, repeat[0], repeat[1]])
}
