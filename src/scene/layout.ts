export type V3 = [number, number, number]

// World layout: 1 unit ≈ 1 m. House centred on the origin, front = +z.
export const LEAK: V3 = [1.8, 2.2, -1.2]

export const PIPES = {
  hotRiser: [[-1.5, 1.25, -1.8], [-1.5, 1.9, -1.72], [-1.5, 2.3, -1.65], [0.25, 2.3, -1.65], [0.25, 3.7, -1.65], [2.35, 3.7, -1.65], [2.35, 4.55, -1.65], [2.5, 4.55, -1.4]] as V3[],
  coldMain: [[-3.5, 0.45, 0.2], [-3.0, 0.45, -0.9], [-3.0, 0.45, -1.75], [0.5, 0.45, -1.75]] as V3[],
  coldRiser: [[0.5, 0.45, -1.75], [0.5, 2.0, -1.75], [0.5, 3.4, -1.75], [2.45, 3.4, -1.75], [2.45, 4.55, -1.75], [2.58, 4.55, -1.4]] as V3[],
  coldBasin: [[0.5, 3.0, -1.75], [1.6, 3.0, -1.75], [1.6, 3.5, -1.65]] as V3[],
  leakBranch: [[0.5, 2.2, -1.75], [0.5, 2.2, -1.2], [1.8, 2.2, -1.2], [2.9, 2.2, -1.2]] as V3[],
  verteilerCold: [[-2.1, 0.45, -1.75], [-2.1, 1.25, -1.8], [-1.5, 1.25, -1.8]] as V3[],
  washer: [[-0.4, 0.45, -1.75], [-0.4, 0.8, -1.72]] as V3[],
}

export const CITIES: { name: string; x: number; z: number; main?: boolean }[] = [
  // offsets from Gärtringen in map units (1 unit = 10 km), north = -z
  { name: 'Böblingen', x: 0.8, z: -0.45 },
  { name: 'Stuttgart', x: 2.06, z: -1.55, main: true },
  { name: 'Calw', x: -1.18, z: -0.78 },
  { name: 'Tübingen', x: 1.18, z: 1.33 },
  { name: 'Pforzheim', x: -1.5, z: -2.8 },
  { name: 'Karlsruhe', x: -3.68, z: -4.1, main: true },
  { name: 'Heilbronn', x: 2.4, z: -5.5 },
]
