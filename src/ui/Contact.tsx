import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { FIRMA, SERVICES, checkArea } from '../data'

// Felder als hellere Fläche im Blau des Coupons, ohne Rahmen
const inp = 'block h-[54px] w-full bg-white/14 px-4 text-[16px] text-white outline-none transition-colors placeholder:text-white/80 focus:bg-white/24'

/** Anfrage als Coupon zum Abtrennen: links die Überschrift, rechts die Felder. Abgeschickt wird per WhatsApp oder E-Mail. */
export function CouponForm({ preselect }: { preselect: { id: string; n: number } | null }) {
  const [service, setService] = useState('')
  const [f, setF] = useState({ name: '', reach: '', ort: '', msg: '' })
  const [tried, setTried] = useState(false)
  const [copied, setCopied] = useState(false)
  const card = useRef<HTMLFormElement>(null)
  const perf = useRef<HTMLDivElement>(null)
  useEffect(() => { if (preselect) setService(preselect.id) }, [preselect])

  // Am Handy liegen die Kerben links und rechts auf Höhe der Perforation
  useLayoutEffect(() => {
    const set = () => card.current?.style.setProperty('--cut-y', `${perf.current!.offsetTop + perf.current!.offsetHeight / 2}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(card.current!)
    return () => ro.disconnect()
  }, [])

  const label = SERVICES.find((s) => s.id === service)?.label
  const area = useMemo(() => checkArea(f.ort), [f.ort])
  const missing = !f.name.trim() ? 'Bitte Ihren Namen angeben.' : !f.reach.trim() ? 'Bitte Telefon oder E-Mail angeben, damit wir Sie erreichen.' : ''
  const text = [
    'Hallo SELLITA, ich habe eine Anfrage:',
    '',
    `Leistung: ${label ?? 'noch offen'}`,
    ...(f.ort ? [`Ort: ${f.ort}`] : []),
    ...(f.msg ? [`Beschreibung: ${f.msg}`] : []),
    '',
    `Name: ${f.name}`,
    `Erreichbar unter: ${f.reach}`,
  ].join('\n')
  const subject = `Anfrage${label ? ': ' + label : ''} – ${f.name || 'Website'}`
  const mailto = `mailto:${FIRMA.mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
  const wa = `${FIRMA.wa}?text=${encodeURIComponent(text)}`

  const guard = (e: React.MouseEvent) => { if (missing) { e.preventDefault(); setTried(true) } }
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${FIRMA.mail}\n\n${text}`); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { /* Zwischenablage nicht verfügbar */ }
  }

  return (
    <form ref={card} onSubmit={(e) => e.preventDefault()} data-lenis-prevent
      className="coupon relative grid bg-water text-white lg:grid-cols-[46%_54%]">
      <div className="flex flex-col justify-between gap-6 p-6 pb-8 md:p-12">
        <h2 className="t3 wide uppercase">Anfrage<br />an SELLITA</h2>
        <p className="t5 max-w-sm">
          Wir melden uns per Telefon oder WhatsApp zurück. Direkt geht es unter{' '}
          <a href={FIRMA.tel} className="link font-semibold">{FIRMA.phone}</a> oder{' '}
          <a href={`mailto:${FIRMA.mail}`} className="link font-semibold">{FIRMA.mail}</a>.
        </p>
      </div>
      <div ref={perf} className="perf mx-6 h-[5px] lg:absolute lg:inset-y-6 lg:left-[46%] lg:mx-0 lg:h-auto lg:w-[5px] lg:-translate-x-1/2" aria-hidden />
      <div className="flex flex-col gap-2.5 p-6 pt-8 md:p-12">
        <label><span className="sr-only">Leistung</span>
          <select value={service} onChange={(e) => setService(e.target.value)} className={`${inp} appearance-none`}>
            <option value="" className="text-ink">Worum geht es? (Leistung wählen)</option>
            {SERVICES.map((s) => <option key={s.id} value={s.id} className="text-ink">{s.label}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Name</span>
          <input className={inp} placeholder="Ihr Name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label><span className="sr-only">Telefon oder E-Mail</span>
          <input className={inp} placeholder="Telefon oder E-Mail" autoComplete="tel" value={f.reach} onChange={(e) => setF({ ...f, reach: e.target.value })} />
        </label>
        <label><span className="sr-only">PLZ oder Ort des Objekts</span>
          <input className={inp} placeholder="PLZ oder Ort des Objekts" autoComplete="postal-code" aria-describedby="ort-hint" value={f.ort} onChange={(e) => setF({ ...f, ort: e.target.value })} />
          <span id="ort-hint" className="mt-1 block min-h-6 text-[16px]" aria-live="polite">
            {f.ort.trim().length > 2 && area.known && (area.inside ? `Liegt in unserem Einsatzgebiet${area.km ? `, ca. ${area.km} km` : ''}.` : `Etwa ${area.km} km entfernt. Rufen Sie kurz an, dann klären wir das.`)}
          </span>
        </label>
        <label><span className="sr-only">Beschreibung</span>
          <textarea className={`${inp} h-28 resize-none py-3`} placeholder="Was ist passiert bzw. was soll gemacht werden?" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} />
        </label>
        {tried && missing && <p className="font-semibold" role="alert">{missing}</p>}
        <a href={wa} target="_blank" rel="noreferrer" onClick={guard}
          className="mt-2 flex h-14 items-center justify-center bg-ink font-bold transition-[background-color,transform] duration-150 active:scale-[.98] hover:bg-[#15171b]">
          Per WhatsApp senden
        </a>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-1">
          <a href={mailto} onClick={guard} className="link font-semibold">Lieber per E-Mail senden</a>
          <button type="button" onClick={() => (missing ? setTried(true) : copy())} className="link flex items-center gap-1.5">
            {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Kopiert' : 'Text kopieren'}
          </button>
        </div>
      </div>
    </form>
  )
}
