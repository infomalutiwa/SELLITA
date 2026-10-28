// Lädt freie CC0/MIT .glb-Beispielassets nach /public/models und schreibt manifest.json.
// Fehlende Downloads sind kein Fehler: die App nutzt dann die prozeduralen Meshes.
// Aufruf: npm run assets
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models')
const KHRONOS = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models'
const ASSETS = [
  // Khronos glTF-Sample-Assets (WaterBottle: CC0) – wird als Deko am Waschtisch genutzt
  { file: 'WaterBottle.glb', urls: [`${KHRONOS}/WaterBottle/glTF-Binary/WaterBottle.glb`] },
]

await mkdir(out, { recursive: true })
const ok = []
for (const a of ASSETS) {
  for (const url of a.urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.subarray(0, 4).toString() !== 'glTF') throw new Error('keine gültige GLB-Datei')
      await writeFile(path.join(out, a.file), buf)
      ok.push(a.file)
      console.log(`✓ ${a.file}  (${(buf.length / 1024).toFixed(0)} KB)  <- ${url}`)
      break
    } catch (e) {
      console.warn(`✗ ${a.file}: ${e.message} (${url}) -> prozeduraler Fallback`)
    }
  }
}
await writeFile(path.join(out, 'manifest.json'), JSON.stringify({ models: ok }, null, 2) + '\n')
console.log(`manifest.json: ${ok.length} Modell(e)`)
