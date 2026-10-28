export const FIRMA = {
  name: 'SELLITA',
  sub: 'Sanitär • Leckortung • Sanierung',
  street: 'Rohrweg 20',
  city: '71116 Gärtringen',
  phone: '0178 30 14 260',
  tel: 'tel:+491783014260',
  wa: 'https://wa.me/491783014260',
  mail: 'selita.service@web.de',
  tax: 'Steuernummer: [wird nachgereicht / beim Finanzamt Böblingen]',
}

export const SCENES = [
  { id: 'aussen', hud: 'Außenansicht', color: '#F8FAFC' },
  { id: 'wand', hud: 'Blick in die Wand', color: '#EF4444' },
  { id: 'sanitaer', hud: 'Bad & Sanitär', color: '#38BDF8' },
  { id: 'leck', hud: 'Leckortung', color: '#0EA5E9' },
  { id: 'reno', hud: 'Renovierung & Balkon', color: '#FACC15' },
  { id: 'anfrage', hud: 'Anfrage', color: '#FF5722' },
]

export const SERVICES = [
  { id: 'sanitaer', label: 'Sanitär', icon: 'Droplets' },
  { id: 'leck', label: 'Leckortung', icon: 'ScanSearch' },
  { id: 'bad', label: 'Badsanierung', icon: 'Bath' },
  { id: 'balkon', label: 'Balkonsanierung', icon: 'Fence' },
  { id: 'wohnung', label: 'Wohnungsrenovierung', icon: 'PaintRoller' },
  { id: 'moebel', label: 'Möbel demontieren', icon: 'Hammer' },
  { id: 'elektrik', label: 'Elektrik / Montage', icon: 'Zap' },
] as const

// Approximate centres of PLZ zones (first two digits) around Baden-Württemberg
export const HOME = { lat: 48.6417, lon: 8.8996 }
export const PLZ_ZONES: Record<string, [number, number]> = {
  '68': [49.49, 8.47], '69': [49.4, 8.69], '70': [48.78, 9.18], '71': [48.69, 9.0], '72': [48.45, 8.8],
  '73': [48.7, 9.5], '74': [49.14, 9.22], '75': [48.89, 8.7], '76': [49.0, 8.4], '77': [48.47, 7.94],
  '78': [48.06, 8.46], '79': [47.99, 7.85], '88': [47.9, 9.5], '89': [48.4, 9.99], '67': [49.3, 8.2],
  '64': [49.87, 8.65], '97': [49.8, 9.9], '63': [50.0, 9.1],
}
export const CITY_LOOKUP: Record<string, [number, number]> = {
  gärtringen: [48.6417, 8.8996], böblingen: [48.683, 9.012], stuttgart: [48.7758, 9.1829], calw: [48.714, 8.739],
  tübingen: [48.5216, 9.0576], karlsruhe: [49.0069, 8.4037], pforzheim: [48.8922, 8.6946], herrenberg: [48.5958, 8.8663],
  sindelfingen: [48.7133, 9.0033], nagold: [48.5522, 8.7242], reutlingen: [48.4914, 9.2043], esslingen: [48.7406, 9.3051],
  ludwigsburg: [48.8975, 9.1920], heilbronn: [49.1427, 9.2109], freudenstadt: [48.4636, 8.4112], 'baden-baden': [48.7606, 8.2398],
  rastatt: [48.8587, 8.2085], bruchsal: [49.1245, 8.5986], offenburg: [48.4733, 7.9441], freiburg: [47.999, 7.8421], mannheim: [49.4875, 8.466],
}
export function distKm(a: [number, number], b: [number, number]) {
  const R = 6371, r = Math.PI / 180
  const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export function checkArea(input: string): { known: boolean; inside: boolean; km?: number } {
  const q = input.trim().toLowerCase()
  if (!q) return { known: false, inside: false }
  let pos: [number, number] | undefined
  const plz = q.match(/\b(\d{5})\b/)
  if (plz) {
    if (plz[1] === '71116') pos = [HOME.lat, HOME.lon]
    else pos = PLZ_ZONES[plz[1].slice(0, 2)]
    if (!pos) return { known: true, inside: false }
  } else {
    const key = Object.keys(CITY_LOOKUP).find((c) => q.includes(c))
    if (key) pos = CITY_LOOKUP[key]
  }
  if (!pos) return { known: false, inside: false }
  const km = Math.round(distKm([HOME.lat, HOME.lon], pos))
  return { known: true, inside: km <= 100, km }
}
