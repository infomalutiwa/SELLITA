import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import { ArrowRight, Bath, Check, Droplets, Fence, Hammer, MapPin, Menu, MessageCircle, PaintRoller, Phone, ScanSearch, X, Zap } from 'lucide-react'
import { BgFilm } from './ui/BgFilm'
import { DirectContact, RequestForm } from './ui/Contact'
import { LegalModal, type LegalKind } from './ui/LegalModal'
import { Logo } from './ui/Logo'
import { CITY_LOOKUP, FIRMA, HOME, SERVICES, checkArea, distKm } from './data'

const ICONS = { ScanSearch, Bath, Droplets, Zap, Hammer, Fence, PaintRoller }
const NAV = [['leistungen', 'Leistungen'], ['ablauf', 'Ablauf'], ['einsatzgebiet', 'Einsatzgebiet'], ['kontakt', 'Kontakt']] as const
const btn = 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold transition'

export default function App() {
  const lenis = useRef<Lenis | null>(null)
  const [legal, setLegal] = useState<LegalKind>(null)
  const [pre, setPre] = useState<{ id: string; n: number } | null>(null)
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const l = new Lenis({ duration: 1.1, smoothWheel: !reduce })
    lenis.current = l
    let raf = requestAnimationFrame(function tick(t) { l.raf(t); raf = requestAnimationFrame(tick) })
    const onScroll = () => setScrolled(scrollY > 40)
    addEventListener('scroll', onScroll, { passive: true })
    // Inhalte weich einblenden, sobald sie ins Bild kommen
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.15 })
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => { cancelAnimationFrame(raf); l.destroy(); io.disconnect(); removeEventListener('scroll', onScroll) }
  }, [])

  const go = useCallback((id: string) => {
    setMenu(false)
    const el = document.getElementById(id)
    if (el) lenis.current?.scrollTo(el, { offset: -64, duration: 1.4 })
  }, [])
  const ask = useCallback((id: string) => { setPre((p) => ({ id, n: (p?.n ?? 0) + 1 })); go('kontakt') }, [go])

  return (
    <>
      <BgFilm />

      <header className={`fixed inset-x-0 top-0 z-40 bg-[#07090e] transition-colors duration-300 ${scrolled || menu ? 'md:border-b md:border-white/10 md:bg-[#07090e]' : 'md:bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#top" onClick={(e) => { e.preventDefault(); lenis.current?.scrollTo(0) }} aria-label="Zum Seitenanfang"><Logo /></a>
          <nav className="hidden items-center gap-7 text-[15px] text-white/75 lg:flex">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="transition hover:text-white">{label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={FIRMA.wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hidden h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/85 transition hover:border-white/35 sm:flex"><MessageCircle size={18} /></a>
            <a href={FIRMA.tel} className={`${btn} bg-sky-500 !px-4 !py-2.5 text-white hover:bg-sky-400`}><Phone size={16} /><span className="hidden sm:inline">{FIRMA.phone}</span><span className="sm:hidden">Anrufen</span></a>
            <button onClick={() => setMenu(!menu)} aria-label="Menü" aria-expanded={menu} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 lg:hidden">{menu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-white/10 px-4 pb-4 lg:hidden">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="block border-b border-white/5 py-3.5 text-lg">{label}</a>)}
          </nav>
        )}
      </header>

      <main id="top" className="relative z-10">
        {/* Einstieg */}
        <section data-film="intro" data-dim="0.12" data-x="0.25" data-z="0.78" data-fit="0.12" data-ay="0.5" className="pb-16 pt-[calc(4rem+var(--win)+1.5rem)] md:flex md:min-h-[100svh] md:items-end md:pb-20 md:pt-0">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
            <div className="reveal max-w-3xl">
              <p className="mb-4 flex items-center gap-2 text-sm text-white/70"><MapPin size={15} className="text-sky-300" /> Gärtringen · Landkreis Böblingen</p>
              <h1 className="text-[2.1rem] font-semibold leading-[1.08] tracking-tight md:text-6xl">Sanitär, Leckortung und Sanierung aus einer Hand.</h1>
              <p className="mt-4 max-w-2xl text-[17px] text-white/75 md:mt-5 md:text-xl">Wir finden Lecks, sanieren Bäder und Balkone, renovieren Wohnungen und übernehmen Montagen – in Gärtringen und bis zu 100 km drumherum.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => go('kontakt')} className={`${btn} bg-white text-[#07090e] hover:bg-white/90`}>Anfrage stellen <ArrowRight size={17} /></button>
                <a href={FIRMA.tel} className={`${btn} border border-white/25 hover:border-white/50`}><Phone size={17} /> {FIRMA.phone}</a>
              </div>
            </div>
            <ul className="reveal mt-12 hidden flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 md:flex">
              {SERVICES.map((s) => <li key={s.id}><a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); go(s.id) }} className="transition hover:text-white">{s.label}</a></li>)}
            </ul>
          </div>
        </section>

        {/* Leistungen */}
        <div id="leistungen" className="mx-auto max-w-7xl px-4 pt-6 md:px-8 md:pt-16">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-300">Leistungen</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Sieben Leistungen, ein Ansprechpartner.</h2>
          </div>
        </div>
        {SERVICES.map((s, i) => <ServiceSection key={s.id} s={s} i={i} onAsk={ask} />)}

        {/* Ablauf */}
        <section id="ablauf" data-film="alles" data-dim="0.6" className="py-16 md:py-40">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="reveal max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-300">Ablauf</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">So läuft es bei uns.</h2>
            </div>
            <ol className="mt-12 grid gap-4 md:grid-cols-4">
              {[
                ['Kurz melden', 'Anruf, WhatsApp oder E-Mail – gern mit ein paar Fotos vom Schaden oder vom Raum.'],
                ['Termin vor Ort', 'Wir schauen uns alles an und besprechen mit Ihnen, was wirklich nötig ist.'],
                ['Angebot', 'Sie wissen vorher, was gemacht wird und was es kostet.'],
                ['Ausführung', 'Wir arbeiten sauber und übergeben die Baustelle aufgeräumt.'],
              ].map(([t, d], i) => (
                <li key={t} className="reveal rounded-xl border border-white/10 bg-[#0b0e13]/92 p-6" style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="text-sm tabular-nums text-sky-300">0{i + 1}</span>
                  <h3 className="mt-3 text-xl font-semibold">{t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/65">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Area />

        {/* Kontakt */}
        <section id="kontakt" data-film="outro" data-a="0.5" data-b="1" data-dim="0.72" data-mo="1" className="pb-28 pt-16 md:pb-32 md:pt-28">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
            <div className="reveal">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-300">Kontakt</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Erzählen Sie uns, worum es geht.</h2>
              <p className="mt-4 max-w-md text-lg text-white/70">Am schnellsten geht es per Telefon oder WhatsApp. Oder Sie füllen das Formular aus – wir melden uns zurück.</p>
              <div className="mt-8"><DirectContact /></div>
            </div>
            <div className="reveal"><RequestForm preselect={pre} /></div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#07090e] pb-24 md:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-white/55 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <Logo />
            <span>{FIRMA.street}, {FIRMA.city}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={FIRMA.tel} className="hover:text-white">{FIRMA.phone}</a>
            <a href={`mailto:${FIRMA.mail}`} className="hover:text-white">{FIRMA.mail}</a>
            <button onClick={() => setLegal('impressum')} className="hover:text-white">Impressum</button>
            <button onClick={() => setLegal('datenschutz')} className="hover:text-white">Datenschutz</button>
          </div>
        </div>
      </footer>

      {/* Schnellkontakt am Handy */}
      <div className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#07090e] text-[13px] font-medium transition-transform duration-300 md:hidden ${scrolled ? 'translate-y-0' : 'translate-y-full'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <a href={FIRMA.tel} className="flex flex-col items-center gap-1 py-2.5"><Phone size={19} className="text-sky-300" />Anrufen</a>
        <a href={FIRMA.wa} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 py-2.5"><MessageCircle size={19} className="text-[#25d366]" />WhatsApp</a>
        <button onClick={() => go('kontakt')} className="flex flex-col items-center gap-1 py-2.5"><ArrowRight size={19} />Anfrage</button>
      </div>

      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  )
}

function ServiceSection({ s, i, onAsk }: { s: (typeof SERVICES)[number]; i: number; onAsk: (id: string) => void }) {
  const Icon = ICONS[s.icon as keyof typeof ICONS]
  const right = i % 2 === 1
  return (
    <section id={s.id} data-film={s.film} data-dim="0.3" className="min-h-[135svh] md:min-h-[165vh]">
      <div className="sticky top-[calc(4rem+var(--win))] mx-auto max-w-7xl px-4 py-6 md:top-[max(5rem,18vh)] md:px-8 md:py-10">
        <article className={`reveal max-w-[34rem] md:rounded-xl md:border md:border-white/10 md:bg-[#0b0e13]/92 md:p-8 ${right ? 'md:ml-auto' : ''}`}>
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-2 text-sm font-medium ${s.id === 'leck' ? 'text-red-400' : 'text-sky-300'}`}><Icon size={17} /> {s.label}</span>
            <span className="text-sm tabular-nums text-white/40">{String(i + 1).padStart(2, '0')} / {String(SERVICES.length).padStart(2, '0')}</span>
          </div>
          <h3 className="mt-3 text-[1.6rem] font-semibold leading-tight tracking-tight md:mt-4 md:text-[2.25rem]">{s.title}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70 md:text-[16px]">{s.text}</p>
          <ul className="mt-4 space-y-1.5 md:mt-5 md:space-y-2">
            {s.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-[15px]"><Check size={17} className="mt-0.5 shrink-0 text-sky-300" />{p}</li>)}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => onAsk(s.id)} className={`${btn} bg-white !py-2.5 text-[#07090e] hover:bg-white/90`}>Dazu anfragen <ArrowRight size={16} /></button>
            <a href={FIRMA.tel} className={`${btn} border border-white/20 !py-2.5 hover:border-white/45 max-md:hidden`}><Phone size={16} /> Anrufen</a>
          </div>
        </article>
      </div>
    </section>
  )
}

function Area() {
  const [q, setQ] = useState('')
  const r = useMemo(() => checkArea(q), [q])
  const cities = useMemo(() => Object.entries(CITY_LOOKUP)
    .map(([name, pos]) => ({ name: name.replace(/(^|-)\p{L}/gu, (c) => c.toUpperCase()), km: Math.round(distKm([HOME.lat, HOME.lon], pos)) }))
    .filter((c) => c.km > 2 && c.km <= 100).sort((a, b) => a.km - b.km), [])
  return (
    <section id="einsatzgebiet" data-film="outro" data-a="0" data-b="0.5" data-dim="0.55" data-mo="1" className="py-16 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-2 lg:items-start">
        <div className="reveal">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-300">Einsatzgebiet</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Bis zu 100 km rund um Gärtringen.</h2>
          <p className="mt-4 max-w-lg text-lg text-white/70">Vom Kreis Böblingen über Stuttgart und Tübingen bis Pforzheim und Karlsruhe. Prüfen Sie Ihren Ort:</p>
          <label className="mt-6 block max-w-md">
            <span className="sr-only">PLZ oder Ort</span>
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-300" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PLZ oder Ort, z. B. 72070 Tübingen"
                className="w-full rounded-lg border border-white/15 bg-[#0b0e13] py-3.5 pl-11 pr-4 text-[15px] outline-none placeholder:text-white/35 focus:border-sky-400" />
            </div>
          </label>
          <p className="mt-3 min-h-6 text-[15px]" aria-live="polite">
            {q.trim().length > 2 && (r.known
              ? r.inside
                ? <span className="text-emerald-300">Ja, das liegt in unserem Einsatzgebiet{r.km ? ` – ca. ${r.km} km von Gärtringen` : ''}.</span>
                : <span className="text-amber-300">Ca. {r.km} km – etwas weiter weg. Rufen Sie an, oft geht es trotzdem.</span>
              : <span className="text-white/50">Bitte eine 5-stellige PLZ oder einen größeren Ort eingeben.</span>)}
          </p>
        </div>
        <div className="reveal rounded-xl border border-white/10 bg-[#0b0e13]/92 p-6 md:p-8">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-white/55">Entfernung ab Gärtringen</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {cities.map((c) => (
              <li key={c.name} className="flex items-baseline justify-between border-b border-white/8 py-2.5 text-[15px]">
                <span>{c.name}</span><span className="tabular-nums text-white/50">{c.km} km</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
