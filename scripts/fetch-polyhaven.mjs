// Lädt fotogescannte CC0-Assets von Poly Haven (polyhaven.com, CC0) nach /public/ph:
//   HDRI (Beleuchtung + Hintergrund), PBR-Texturen (diff / normal / arm) und glTF-Modelle.
// Aufruf: npm run ph      (Netzwerk nötig; Dateien liegen danach im Repo)
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/ph')
const API = 'https://api.polyhaven.com/files/'
const RES = '1k'
const HDRI = ['qwantani_dusk_2_puresky']
const TEX = ['white_plaster_02', 'grey_roof_tiles_02', 'oak_wood_planks', 'large_floor_tiles_02', 'marble_01', 'long_white_tiles', 'leafy_grass', 'stone_pavers', 'concrete_floor_01', 'wood_planks', 'brushed_concrete', 'wool_boucle']
const MODELS = ['sofa_02', 'mid_century_lounge_chair', 'modern_wooden_cabinet', 'wooden_display_shelves_01', 'steel_frame_shelves_01', 'coffee_table_round_01', 'potted_plant_04', 'round_wooden_table_01', 'dining_chair_02', 'television_02', 'potted_plant_02', 'wooden_bookshelf_worn', 'modern_ceiling_lamp_01', 'desk_lamp_arm_01', 'Drill_01', 'metal_toolbox', 'wooden_ladder', 'pipe_wrench', 'shrub_01', 'shrub_02', 'shrub_03', 'shrub_04', 'fern_02', 'painted_wooden_cabinet', 'ornate_mirror_01', 'electric_stove', ]

const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return Buffer.from(await r.arrayBuffer()) }
const save = async (file, buf) => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, buf) }
const meta = async (id) => JSON.parse((await get(API + id)).toString())
const manifest = { license: 'CC0-1.0 (Poly Haven)', hdri: [], textures: [], models: [] }

for (const id of HDRI) try {
  const f = (await meta(id)).hdri[RES].hdr
  await save(path.join(root, 'hdr', `${id}.hdr`), await get(f.url)); manifest.hdri.push(id); console.log('✓ hdri', id)
} catch (e) { console.warn('✗ hdri', id, e.message) }

for (const id of TEX) try {
  const m = await meta(id)
  for (const [key, name] of [['Diffuse', 'diff'], ['nor_gl', 'nor'], ['arm', 'arm']]) await save(path.join(root, 'tex', id, `${name}.jpg`), await get(m[key][RES].jpg.url))
  manifest.textures.push(id); console.log('✓ tex', id)
} catch (e) { console.warn('✗ tex', id, e.message) }

for (const id of MODELS) try {
  const g = (await meta(id)).gltf[RES].gltf
  const dir = path.join(root, 'models', id)
  await save(path.join(dir, `${id}.gltf`), await get(g.url))
  for (const [rel, f] of Object.entries(g.include)) await save(path.join(dir, rel), await get(f.url))
  manifest.models.push(id); console.log('✓ model', id)
} catch (e) { console.warn('✗ model', id, e.message) }

await save(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`fertig: ${manifest.hdri.length} HDRI, ${manifest.textures.length} Texturen, ${manifest.models.length} Modelle`)
