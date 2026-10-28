// Lädt freie CC0-.glb-Assets (Kenney „Furniture Kit“, CC0-1.0, gespiegelt bei Flockbay) nach /public/models
// und schreibt manifest.json. Fehlende Downloads sind kein Fehler: die App nutzt dann die prozeduralen Meshes.
// Aufruf: npm run assets
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/models')
const FB = 'https://api.flockbay.com/bootstrap/library/models/v1'
const H = {
  'bathtub.glb': 'af0a10f0eb64433cfe45ac9072b9bd78cd363652e4adfb03cf436b9c475c4049',
  'bathroomSink.glb': '02440778cef31741f9c3e93fb0987d4c8690c2e30c969b67a21687c2ae57ff36',
  'toilet.glb': '09560cdaf1894228978439c84fbd74cc91cef55bebe3027e38577bd65b0bc2b5',
  'showerRound.glb': '7974c987e6124cd830a67d351faa956875e135139ab98a18b9638be1873d9e5c',
  'bathroomMirror.glb': 'ace38575eb81e6362f59b17acd9fb25f9f191445d109ef0cc4538ab83012044f',
  'bathroomCabinetDrawer.glb': '8d668d8f1c73a8aa3f9c72f9e501f1cc5fbb88bdec539e3554700dc230f0634b',
  'washer.glb': 'f45c4b22e4242349fed9dd029ffd186496f14a34e814a0b8e6897fdc1f55680f',
  'dryer.glb': '07d8acc1d5381c2e1993089efe8b493407fa56b8d3dbf09a28cc698ddc738282',
  'loungeDesignSofa.glb': '376501a995db7d06e5d4d62184c258e7c8cfcc6c37fabf8efaab049e7ec92238',
  'loungeSofa.glb': '4dfc44f55a5ce59122e3b5c66237844ece5c20fab8561c3f00fc33bcc7bd9e34',
  'tableCoffee.glb': '4a83ad770e37855aedafa9945438387a123f685fbeea42f794972cff46ad7cbd',
  'rugRectangle.glb': '442538e602d17fda90344580758377e0e931f3401cd368ce4a2973ef284957d9',
  'lampRoundFloor.glb': 'da69158c49b2e1678e1c4e0721edd6c797eb4920d6992d1b91f66bed6554d4a8',
  'lampSquareFloor.glb': '9689791d37bb836b45dbe7beda4eec17e8ba2ef7a3dd1a2c2f70edf42b8ade4e',
  'pottedPlant.glb': '2015549938580c53dd0f69dfc3953d57666633d0ca4d41ea68d83a1d6c369772',
  'kitchenCabinet.glb': '2d654a72eab95d37a4d2cafb1379099a914b62d56f6ac8e5153eb3d1f522d2ef',
  'kitchenStove.glb': '29fbcf556b2470f5c3a0b440e9f8ba393c69253e89b693bcc5d9ef3c3a8b1862',
  'kitchenFridgeLarge.glb': '4655177b2aa978d4efcd6c279ec65013a90cb571b709526ad047ebac6c0a9404',
  'kitchenSink.glb': '0f450fbacc9138e0e3cb59736a7dda82fb63726353cacf0c75b21152e05b7376',
  'kitchenCabinetUpper.glb': '9ec9c00a65a06a668318d34f140e08674bcc11d196b7136ef7e39e13f696b87f',
  'hoodModern.glb': 'c94298586c5f3977afa23c47cd5d587413386aa40e779314c48de6fbc8e69eb7',
  'tableRound.glb': 'f60eeeeece6c0089b1e141787fbd0f27fc92c36ba90df489c43dc9dfb4fb9985',
  'chairDesk.glb': '71e8794b8ba0179f808af4db3c6071dc06995f85d8b277247eda5549ba1cd482',
  'cabinetTelevision.glb': 'c207bc12bebf8edcb9a31609277333bb5f8ae7d96c3c38550c2086e3191bfb13',
  'televisionModern.glb': '6b4b834d0837402ce601bacdcbc524ba082510a49d49f2b37b6dc8709bd441bc',
  'lampSquareTable.glb': '73b0f02934aaad480e29a242c6adcc790d6daa6166eb9c3f45930c0ff3e08ade',
  'sideTable.glb': '9391bb6c82b588b1c936e80ac6a40e448a501d729df3aa5f5108b799e3aa5865',
  'rugRound.glb': 'd88ace390036f46ec8d5eccc11e6907e4e7804cb33f2dbd7a5082392b562d18c',
  'coatRack.glb': 'e598534ba0eef6c6685a7d035351ec0ba8492edd6da95342862158ed76371cad',
  'bookcaseClosed.glb': '8ad26a0bb553221a33abb8a72cce3ef1cf5b9613fc6eef3e40e4005ec204dd8a',
}

await mkdir(out, { recursive: true })
const ok = []
for (const [file, hash] of Object.entries(H)) {
  const url = `${FB}/${hash}/${file}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.subarray(0, 4).toString() !== 'glTF') throw new Error('keine gültige GLB-Datei')
    await writeFile(path.join(out, file), buf)
    ok.push(file)
    console.log(`✓ ${file}  (${(buf.length / 1024).toFixed(0)} KB)`)
  } catch (e) {
    console.warn(`✗ ${file}: ${e.message} -> prozeduraler Fallback`)
  }
}
await writeFile(path.join(out, 'manifest.json'), JSON.stringify({ license: 'CC0-1.0 (Kenney Furniture Kit, kenney.nl)', models: ok }, null, 2) + '\n')
console.log(`manifest.json: ${ok.length} Modell(e)`)
