// Exportiert die SELLITA-Szene (GLB) und die Animation pro Filmbild (JSON) für das Blender-Rendering.
// Aufruf: node render/export.cjs <url> <outDir> <frames> <pMax>
const { chromium } = require('playwright')
const fs = require('fs')
;(async () => {
  const [url = 'http://localhost:4173/?export', out = 'render/out', N = '360', PMAX = '0.88'] = process.argv.slice(2)
  fs.mkdirSync(out, { recursive: true })
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const pg = await b.newPage({ viewport: { width: 480, height: 270 } })
  pg.on('pageerror', (e) => console.log('pageerror', e.message))
  await pg.goto(url)
  await pg.waitForFunction(() => window.__sellita, null, { timeout: 120000 })
  await pg.waitForTimeout(25000)
  const meta = await pg.evaluate(() => {
    const { scene, S } = window.__sellita
    S.p = S.target = 0
    const planes = []
    const meta = { objects: {}, materials: {}, planes: [] }
    let i = 0, j = 0
    const mats = new Map()
    scene.traverse((o) => {
      o.name = 'n' + i++
      const wp = o.getWorldPosition(o.position.clone())
      const info = { type: o.type }
      if (wp.y < -40) info.skip = 'map'
      if (o.isPoints || o.isLine || o.isLineSegments) info.skip = 'points'
      const m = o.material
      if (m && !Array.isArray(m)) {
        if (!mats.has(m)) { m.name = 'm' + j++; mats.set(m, m.name); meta.materials[m.name] = { type: m.type, emissive: m.emissive ? m.emissive.getHexString() : null, toneMapped: m.toneMapped, transparent: m.transparent, opacity: m.opacity, color: m.color ? m.color.getHexString() : null, blending: m.blending } }
        info.mat = m.name
        if (m.isShaderMaterial) info.skip = m.uniforms && m.uniforms.uScan ? undefined : 'shader'
        if (m.isShaderMaterial && m.uniforms && m.uniforms.uScan) info.thermo = true
        if (m.clippingPlanes && m.clippingPlanes.length) {
          let k = planes.indexOf(m.clippingPlanes[0]); if (k < 0) { planes.push(m.clippingPlanes[0]); k = planes.length - 1 }
          info.clip = k
        }
      }
      meta.objects[o.name] = info
    })
    window.__planes = planes
    meta.planes = planes.map((p) => [p.normal.x, p.normal.y, p.normal.z])
    return meta
  })
  fs.writeFileSync(out + '/meta.json', JSON.stringify(meta))
  console.log('objects', Object.keys(meta.objects).length, 'materials', Object.keys(meta.materials).length, 'planes', meta.planes.length)

  // GLB (alle Objekte, auch momentan unsichtbare)
  const b64 = await pg.evaluate(async () => {
    const ex = await window.__sellita.exporter()
    const buf = await ex.parseAsync(window.__sellita.scene, { binary: true, onlyVisible: false, maxTextureSize: 2048 })
    const bytes = new Uint8Array(buf); let s = ''
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
    return btoa(s)
  })
  fs.writeFileSync(out + '/scene.glb', Buffer.from(b64, 'base64'))
  console.log('glb MB', (b64.length * 0.75 / 1e6).toFixed(1))

  // Animation pro Bild: nur Änderungen gegenüber dem vorherigen Bild
  const frames = []
  for (let f = 0; f < +N; f++) {
    const p = (+PMAX * f) / (+N - 1)
    const fr = await pg.evaluate(async (p) => {
      const { scene, camera, S, FOCUS } = window.__sellita
      window.__setTime(p * 65)
      S.p = S.target = p
      for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r))
      scene.updateMatrixWorld(true)
      const last = window.__last || (window.__last = {})
      const ch = {}
      scene.traverse((o) => {
        if (!(o.isMesh || o.isLight)) return
        let vis = true; for (let q = o; q; q = q.parent) if (!q.visible) { vis = false; break }
        const e = Array.from(o.matrixWorld.elements, (v) => Math.round(v * 1e5) / 1e5)
        const key = e.join(',') + (vis ? 1 : 0)
        if (last[o.name] !== key) { last[o.name] = key; ch[o.name] = [vis ? 1 : 0, ...e] }
      })
      const lastM = window.__lastM || (window.__lastM = {})
      const em = {}
      scene.traverse((o) => {
        const m = o.material
        if (!m || Array.isArray(m)) return
        const v = m.isShaderMaterial ? null : [m.emissiveIntensity ?? 0, m.opacity]
        if (!v) return
        const k = v.join(',')
        if (lastM[m.name] !== k) { lastM[m.name] = k; em[m.name] = v }
      })
      let thermo = null
      scene.traverse((o) => { const u = o.material && o.material.uniforms; if (u && u.uScan) thermo = [u.uScan.value, u.uOpacity.value, u.uFound.value, u.uCut.value, u.uTime.value] })
      return { p, focus: [FOCUS.x, FOCUS.y, FOCUS.z], cam: [...camera.matrixWorld.elements], fov: camera.fov, aspect: camera.aspect, ch, em, planes: window.__planes.map((q) => q.constant), thermo }
    }, p)
    frames.push(fr)
    if (f % 20 === 0) console.log('frame', f, 'changes', Object.keys(fr.ch).length)
  }
  fs.writeFileSync(out + '/frames.json', JSON.stringify(frames))
  await b.close()
})()
