import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import type { LegalKind } from './LegalModal'
import { FIRMA, SERVICES, checkArea } from '../data'

// Felder als hellere Fläche im Blau des Coupons, ohne Rahmen
const inp = 'block h-[54px] w-full bg-white/14 px-4 text-[16px] text-white outline-none transition-colors placeholder:text-white/80 focus:bg-white/24'

/** Anfrage als Coupon zum Abtrennen: links die Überschrift, rechts die Felder. Abgeschickt wird per Formular (send.php), WhatsApp oder E-Mail. */
/** Eigenes Auswahlmenü statt des Browser-Standards: Tastatur (Pfeile, Enter, Esc, Buchstaben) und Screenreader (listbox) funktionieren. */
function Pick({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const items = [{ id: '', label: 'Worum geht es? (Leistung wählen)' }, ...SERVICES.map((s) => ({ id: s.id, label: s.label }))]
  const cur = items.find((i) => i.id === value) ?? items[0]

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    addEventListener('pointerdown', away)
    return () => removeEventListener('pointerdown', away)
  }, [open])

  const show = () => { setHi(Math.max(0, items.findIndex((i) => i.id === value))); setOpen(true) }
  const pick = (i: number) => { onChange(items[i].id); setOpen(false) }
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'Tab') { setOpen(false); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) { show(); return }
      setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open ? pick(hi) : show()
    } else if (e.key.length === 1) {
      const n = items.findIndex((i, idx) => idx > 0 && i.label.toLowerCase().startsWith(e.key.toLowerCase()))
      if (n > 0) { setHi(n); if (!open) setOpen(true) }
    }
  }

  return (
    <div ref={root} className="relative">
      <button type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls="leistung-liste" aria-label="Leistung"
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={key}
        className={`${inp} flex items-center justify-between gap-3 text-left ${open ? 'bg-white/24' : ''} ${value ? '' : 'text-white/80'}`}>
        <span className="truncate">{cur.label}</span>
        <ChevronDown size={20} aria-hidden className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul id="leistung-liste" role="listbox" data-lenis-prevent
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto bg-white py-1 text-ink shadow-xl"> {/* taste-skill-ignore: Auswahlliste liegt über dem Formular */}
          {items.map((it, i) => (
            <li key={it.id || 'none'} role="option" aria-selected={it.id === value}
              onPointerEnter={() => setHi(i)} onClick={() => pick(i)}
              className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 text-[16px] ${i === 0 ? 'text-muted' : 'font-semibold'} ${hi === i ? 'bg-tile' : ''}`}>
              <span>{it.label}</span>
              {it.id === value && <Check size={18} className="text-water" aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CouponForm({ preselect, onLegal }: { preselect: { id: string; n: number } | null; onLegal: (k: LegalKind) => void }) {
  const [service, setService] = useState('')
  const [f, setF] = useState({ name: '', tel: '', mail: '', ort: '', msg: '' })
  const [tried, setTried] = useState(false)
  const [copied, setCopied] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [trap, setTrap] = useState('') // Honeypot gegen Spam-Bots
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
  const missing = !f.name.trim() ? 'Bitte Ihren Namen angeben.'
    : !f.tel.trim() ? 'Bitte Ihre Telefonnummer angeben, damit wir Sie erreichen.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.mail.trim()) ? 'Bitte eine gültige E-Mail-Adresse angeben.' : ''
  const text = [
    'Hallo SELLITA, ich habe eine Anfrage:',
    '',
    `Leistung: ${label ?? 'noch offen'}`,
    ...(f.ort ? [`Ort: ${f.ort}`] : []),
    ...(f.msg ? [`Beschreibung: ${f.msg}`] : []),
    '',
    `Name: ${f.name}`,
    `Telefon: ${f.tel}`,
    `E-Mail: ${f.mail}`,
  ].join('\n')
  const subject = `Anfrage${label ? ': ' + label : ''} – ${f.name || 'Website'}`
  const mailto = `mailto:${FIRMA.mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
  const wa = `${FIRMA.wa}?text=${encodeURIComponent(text)}`

  const send = async () => {
    if (missing) { setTried(true); return }
    setState('sending')
    try {
      const r = await fetch('/send.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: f.name, tel: f.tel, mail: f.mail.trim(), ort: f.ort, msg: f.msg, service: label ?? '', website: trap }),
      })
      const j = await r.json()
      setState(j.ok ? 'ok' : 'error')
    } catch { setState('error') }
  }
  const guard = (e: React.MouseEvent) => { if (missing) { e.preventDefault(); setTried(true) } }
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${FIRMA.mail}\n\n${text}`); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { /* Zwischenablage nicht verfügbar */ }
  }

  return (
    <form ref={card} noValidate onSubmit={(e) => { e.preventDefault(); if (state !== 'sending' && state !== 'ok') send() }} data-lenis-prevent
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
        <Pick value={service} onChange={setService} />
        <label><span className="sr-only">Name</span>
          <input className={inp} placeholder="Ihr Name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label><span className="sr-only">Telefon</span>
          <input className={inp} type="tel" placeholder="Telefon" autoComplete="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
        </label>
        <label><span className="sr-only">E-Mail</span>
          <input className={inp} type="email" inputMode="email" placeholder="E-Mail" autoComplete="email" value={f.mail} onChange={(e) => setF({ ...f, mail: e.target.value })} />
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
        <input type="text" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        {state === 'ok' ? (
          <p className="mt-2 flex min-h-14 items-center bg-ink px-4 font-bold" role="status">Danke, Ihre Anfrage ist bei uns angekommen. Wir melden uns bei Ihnen.</p>
        ) : (
          <button type="submit" disabled={state === 'sending'}
            className="mt-2 flex h-14 items-center justify-center bg-ink font-bold transition-[background-color,transform] duration-150 active:scale-[.98] hover:bg-[#15171b] disabled:opacity-70">
            {state === 'sending' ? 'Wird gesendet …' : 'Anfrage senden'}
          </button>
        )}
        {state === 'error' && <p className="font-semibold" role="alert">Das Senden hat nicht geklappt. Bitte per WhatsApp, E-Mail oder Telefon melden.</p>}
        <p className="text-[14px] leading-snug text-white/90">
          Mit dem Absenden werden Ihre Angaben per E-Mail an uns übermittelt und nur zur Bearbeitung Ihrer Anfrage verwendet. Mehr dazu in der{' '}
          <button type="button" onClick={() => onLegal('datenschutz')} className="link font-semibold">Datenschutzerklärung</button>.
        </p>
        <a href={wa} target="_blank" rel="noreferrer" onClick={guard} className="link font-semibold">Oder per WhatsApp senden</a>
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
