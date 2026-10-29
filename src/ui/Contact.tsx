import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { FIRMA, MAPS, SERVICES, checkArea } from '../data'

const inp = 'w-full rounded-lg border border-white/15 bg-black/30 px-3.5 py-3 text-[15px] outline-none transition placeholder:text-white/35 focus:border-sky-400 focus:bg-black/40'

export function DirectContact() {
  const rows = [
    { href: FIRMA.tel, icon: <Phone size={18} />, label: 'Anrufen', value: FIRMA.phone },
    { href: FIRMA.wa, icon: <MessageCircle size={18} />, label: 'WhatsApp', value: 'Nachricht oder Fotos schicken', ext: true },
    { href: `mailto:${FIRMA.mail}`, icon: <Mail size={18} />, label: 'E-Mail', value: FIRMA.mail },
    { href: MAPS, icon: <MapPin size={18} />, label: 'Adresse', value: `${FIRMA.street}, ${FIRMA.city}`, ext: true },
  ]
  return (
    <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#0b0e13]/85 backdrop-blur">
      {rows.map((r) => (
        <li key={r.label}>
          <a href={r.href} {...(r.ext ? { target: '_blank', rel: 'noreferrer' } : {})} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-sky-300">{r.icon}</span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.14em] text-white/50">{r.label}</span>
              <span className="block truncate text-[15px] font-medium">{r.value}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function RequestForm({ preselect }: { preselect: { id: string; n: number } | null }) {
  const [sel, setSel] = useState<string[]>([])
  const [f, setF] = useState({ name: '', tel: '', mail: '', ort: '', msg: '' })
  const [tried, setTried] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (preselect) setSel((s) => (s.includes(preselect.id) ? s : [...s, preselect.id])) }, [preselect])

  const labels = SERVICES.filter((s) => sel.includes(s.id)).map((s) => s.label)
  const area = useMemo(() => checkArea(f.ort), [f.ort])
  const missing = !f.name.trim() ? 'Bitte Ihren Namen angeben.' : !f.tel.trim() && !f.mail.trim() ? 'Bitte Telefon oder E-Mail angeben, damit wir Sie erreichen.' : ''
  const text = [
    'Hallo SELLITA, ich habe eine Anfrage:',
    '',
    `Leistung: ${labels.join(', ') || 'noch offen'}`,
    ...(f.ort ? [`Ort: ${f.ort}`] : []),
    ...(f.msg ? [`Beschreibung: ${f.msg}`] : []),
    '',
    `Name: ${f.name}`,
    ...(f.tel ? [`Telefon: ${f.tel}`] : []),
    ...(f.mail ? [`E-Mail: ${f.mail}`] : []),
  ].join('\n')
  const subject = `Anfrage${labels.length ? ': ' + labels.join(', ') : ''} – ${f.name || 'Website'}`
  const mailto = `mailto:${FIRMA.mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
  const wa = `${FIRMA.wa}?text=${encodeURIComponent(text)}`

  const guard = (e: React.MouseEvent) => { if (missing) { e.preventDefault(); setTried(true) } }
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${FIRMA.mail}\n\n${text}`); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { /* Zwischenablage nicht verfügbar */ }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="rounded-xl border border-white/10 bg-[#0b0e13]/90 p-5 backdrop-blur md:p-7" data-lenis-prevent>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-white/70">Worum geht es?</legend>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = sel.includes(s.id)
            return (
              <button type="button" key={s.id} aria-pressed={on} onClick={() => setSel(on ? sel.filter((x) => x !== s.id) : [...sel, s.id])}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition ${on ? 'border-sky-400 bg-sky-400/15 text-white' : 'border-white/15 text-white/75 hover:border-white/30'}`}>
                {on && <Check size={14} className="text-sky-300" />}{s.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="sr-only">Name</span>
          <input className={inp} placeholder="Ihr Name *" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label><span className="sr-only">Telefon</span>
          <input className={inp} placeholder="Telefon" inputMode="tel" autoComplete="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
        </label>
        <label><span className="sr-only">E-Mail</span>
          <input className={inp} placeholder="E-Mail" type="email" autoComplete="email" value={f.mail} onChange={(e) => setF({ ...f, mail: e.target.value })} />
        </label>
        <label className="sm:col-span-2"><span className="sr-only">PLZ oder Ort</span>
          <input className={inp} placeholder="PLZ oder Ort des Objekts" autoComplete="postal-code" value={f.ort} onChange={(e) => setF({ ...f, ort: e.target.value })} />
          {f.ort.trim().length > 2 && area.known && (
            <span className={`mt-1.5 block text-[13px] ${area.inside ? 'text-emerald-300' : 'text-amber-300'}`}>
              {area.inside ? `Liegt in unserem Einsatzgebiet${area.km ? ` (ca. ${area.km} km)` : ''}.` : `Etwa ${area.km} km entfernt – rufen Sie kurz an, dann klären wir das.`}
            </span>
          )}
        </label>
        <label className="sm:col-span-2"><span className="sr-only">Beschreibung</span>
          <textarea className={inp} rows={4} placeholder="Was ist passiert bzw. was soll gemacht werden?" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} />
        </label>
      </div>

      {tried && missing && <p className="mt-3 text-sm text-amber-300" role="alert">{missing}</p>}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <a href={wa} target="_blank" rel="noreferrer" onClick={guard} className="flex items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 py-3.5 text-[15px] font-semibold text-[#0b1a10] transition hover:brightness-110">
          <MessageCircle size={18} /> Per WhatsApp senden
        </a>
        <a href={mailto} onClick={guard} className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-sky-400">
          <Mail size={18} /> Per E-Mail senden
        </a>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-white/50">
        <span>Fotos vom Schaden am besten direkt per WhatsApp mitschicken.</span>
        <button type="button" onClick={() => (missing ? setTried(true) : copy())} className="flex items-center gap-1.5 text-white/60 underline-offset-4 hover:text-white hover:underline">
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Kopiert' : 'Text kopieren'}
        </button>
      </div>
    </form>
  )
}
