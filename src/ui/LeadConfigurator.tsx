import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { icons, Camera, Check, ChevronLeft, ChevronRight, MapPin, Mail, MessageCircle, Phone } from 'lucide-react'
import { FIRMA, SERVICES, checkArea } from '../data'

type IconName = keyof typeof icons

export function LeadConfigurator() {
  const [step, setStep] = useState(0)
  const [sel, setSel] = useState<string[]>([])
  const [ort, setOrt] = useState('')
  const [c, setC] = useState({ name: '', tel: '', mail: '', msg: '' })
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null)
  const area = useMemo(() => checkArea(ort), [ort])

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const labels = SERVICES.filter((s) => sel.includes(s.id)).map((s) => s.label)
  const text = `Anfrage über sellita-website\n\nLeistungen: ${labels.join(', ') || '–'}\nObjekt: ${ort || '–'}\nName: ${c.name}\nTelefon: ${c.tel}\nE-Mail: ${c.mail}\n${c.msg ? `\nNachricht: ${c.msg}` : ''}${photo ? `\nFoto: ${photo.name} (bitte als Anhang mitsenden)` : ''}`
  const mailto = `mailto:${FIRMA.mail}?subject=${encodeURIComponent('Anfrage: ' + (labels.join(', ') || 'SELLITA'))}&body=${encodeURIComponent(text)}`
  const wa = `${FIRMA.wa}?text=${encodeURIComponent(text)}`
  const canNext = step === 0 ? sel.length > 0 : step === 1 ? ort.trim().length > 2 : c.name.trim() && (c.tel.trim() || c.mail.trim())

  const inp = 'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-sky-400'

  return (
    <div className="glass glass-solid pointer-events-auto flex max-h-[56vh] md:max-h-[calc(100vh-290px)] w-full flex-col rounded-2xl p-4 md:p-5" data-lenis-prevent>
      <div className="mb-3 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8]' : 'bg-white/15'}`} />
        ))}
        <span className="ml-1 text-[11px] font-semibold tracking-widest text-white/60">{step + 1}/3</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <>
                <h3 className="mb-3 text-lg font-bold">Was steht an?</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map((s) => {
                    const Icon = icons[s.icon as IconName]
                    const on = sel.includes(s.id)
                    return (
                      <button key={s.id} onClick={() => toggle(s.id)} aria-pressed={on}
                        className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left text-[13px] font-semibold transition ${on ? 'border-sky-400 bg-sky-400/15' : 'border-white/12 bg-white/5 hover:bg-white/10'}`}>
                        <Icon size={20} className={on ? 'text-sky-300' : 'text-white/70'} />
                        {s.label}
                        {on && <Check size={14} className="absolute right-2 top-2 text-sky-300" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h3 className="mb-3 text-lg font-bold">Wo befindet sich das Objekt?</h3>
                <label className="relative block">
                  <MapPin size={16} className="absolute left-3 top-3.5 text-sky-300" />
                  <input className={inp + ' pl-9'} placeholder="PLZ oder Ort, z. B. 76133 Karlsruhe" value={ort} onChange={(e) => setOrt(e.target.value)} autoFocus />
                </label>
                <div className="mt-3 min-h-12 text-sm" aria-live="polite">
                  {ort.trim().length > 2 && area.known && area.inside && (
                    <p className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-emerald-200">✓ Liegt in unserem 100-km-Einsatzgebiet rund um Gärtringen &amp; Karlsruhe{area.km !== undefined ? ` (ca. ${area.km} km)` : ''}.</p>
                  )}
                  {ort.trim().length > 2 && area.known && !area.inside && (
                    <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-amber-200">Das liegt außerhalb unseres Standard-Einsatzgebiets{area.km ? ` (ca. ${area.km} km)` : ''}. Rufen Sie uns an – wir klären das gern persönlich.</p>
                  )}
                  {ort.trim().length > 2 && !area.known && <p className="text-white/55">Tipp: 5-stellige PLZ oder bekannter Ortsname für den Gebietscheck.</p>}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h3 className="mb-3 text-lg font-bold">Ihre Kontaktdaten</h3>
                <div className="space-y-2">
                  <input className={inp} placeholder="Name *" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} autoComplete="name" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inp} placeholder="Telefon" inputMode="tel" value={c.tel} onChange={(e) => setC({ ...c, tel: e.target.value })} autoComplete="tel" />
                    <input className={inp} placeholder="E-Mail" type="email" value={c.mail} onChange={(e) => setC({ ...c, mail: e.target.value })} autoComplete="email" />
                  </div>
                  <textarea className={inp} rows={2} placeholder="Kurze Beschreibung (optional)" value={c.msg} onChange={(e) => setC({ ...c, msg: e.target.value })} />
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/25 bg-white/5 px-3 py-2.5 text-sm text-white/75 hover:bg-white/10">
                    {photo ? <img src={photo.url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <Camera size={18} className="text-sky-300" />}
                    <span className="min-w-0 flex-1 truncate">{photo ? photo.name : 'Schadensfoto hinzufügen (optional)'}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (photo) URL.revokeObjectURL(photo.url)
                      setPhoto(f ? { name: f.name, url: URL.createObjectURL(f) } : null)
                    }} />
                  </label>
                  {photo && <p className="text-[11px] text-white/50">Hinweis: Das Foto bitte direkt an die E-Mail bzw. WhatsApp-Nachricht anhängen – es wird nicht automatisch hochgeladen.</p>}
                </div>
                <div className="mt-3 grid gap-2">
                  <a href={mailto} className="flex items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold shadow-lg shadow-sky-900/40"><Mail size={16} /> Per E-Mail senden</a>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={wa} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-3 py-2.5 text-sm font-semibold"><MessageCircle size={16} /> WhatsApp</a>
                    <a href={FIRMA.tel} className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/50 bg-sky-400/10 px-3 py-2.5 text-sm font-semibold"><Phone size={16} /> {FIRMA.phone}</a>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-white/70 disabled:opacity-30"><ChevronLeft size={16} /> Zurück</button>
        {step < 2 && (
          <button disabled={!canNext} onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Weiter <ChevronRight size={16} /></button>
        )}
      </div>
    </div>
  )
}
