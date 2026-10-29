import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Check, Flame, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { Clip } from './ui/Clip'
import { DirectContact, RequestForm } from './ui/Contact'
import { LegalModal, type LegalKind } from './ui/LegalModal'
import { Logo } from './ui/Logo'
import { heroScroll } from './ui/heroScroll'
import { CITY_LOOKUP, FIRMA, HOME, SERVICES, checkArea, distKm } from './data'

gsap.registerPlugin(ScrollTrigger)
const Tools3D = lazy(() => import('./ui/Tools3D'))

const NAV = [['leistungen', 'Leistungen'], ['ablauf', 'Ablauf'], ['einsatzgebiet', 'Einsatzgebiet'], ['kontakt', 'Kontakt']] as const
const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition'
const h2 = 'display text-[2.2rem] md:text-[3.6rem]'

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
    // Lenis und ScrollTrigger auf demselben Takt
    l.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const onScroll = () => setScrolled(scrollY > 40)
    addEventListener('scroll', onScroll, { passive: true })

    const ctx = gsap.context(() => {
      // Werkzeuge fliegen beim Herunterscrollen auseinander
      ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', onUpdate: (s) => { heroScroll.p = s.progress } })
      // Video-Band: leichte Parallaxe
      gsap.fromTo('#band-media', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#band', start: 'top bottom', end: 'bottom top', scrub: true } })
      // Ablauf: Linie füllt sich, Schritte werden aktiv
      gsap.fromTo('#steps-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 70%', end: 'bottom 55%', scrub: true } })
      gsap.utils.toArray<HTMLElement>('#steps li').forEach((li) => ScrollTrigger.create({ trigger: li, start: 'top 62%', toggleClass: 'on' }))
    })
    return () => { ctx.revert(); gsap.ticker.remove(tick); l.destroy(); removeEventListener('scroll', onScroll) }
  }, [])

  const go = useCallback((id: string) => {
    setMenu(false)
    const el = document.getElementById(id)
    if (el) lenis.current?.scrollTo(el, { offset: -64, duration: 1.4 })
  }, [])
  const ask = useCallback((id: string) => { setPre((p) => ({ id, n: (p?.n ?? 0) + 1 })); go('kontakt') }, [go])

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 transition-shadow duration-300 bg-white ${scrolled || menu ? 'shadow-[0_1px_0_var(--color-line)]' : ''}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#top" onClick={(e) => { e.preventDefault(); lenis.current?.scrollTo(0) }} aria-label="Zum Seitenanfang"><Logo /></a>
          <nav className="hidden items-center gap-8 text-[15px] text-ink-soft lg:flex">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="transition hover:text-ink">{label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={FIRMA.wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white transition hover:border-ink/30 sm:flex"><MessageCircle size={18} /></a>
            <a href={FIRMA.tel} className={`${btn} bg-ink !px-4 !py-2.5 text-white hover:bg-water-deep`}><Phone size={16} /><span className="hidden sm:inline">{FIRMA.phone}</span><span className="sm:hidden">Anrufen</span></a>
            <button onClick={() => setMenu(!menu)} aria-label="Menü" aria-expanded={menu} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white lg:hidden">{menu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-line bg-white px-4 pb-4 lg:hidden">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="block border-b border-line py-3.5 text-lg">{label}</a>)}
          </nav>
        )}
      </header>

      <main id="top">
        {/* Einstieg: Werkzeug in 3D */}
        <section id="hero" className="tiles relative overflow-hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 md:px-8 lg:min-h-[100svh] lg:flex-row lg:items-center">
            <div className="relative z-10 order-2 pb-14 lg:order-1 lg:w-[46%] lg:py-28">
              <p className="fade-late mb-5 flex items-center gap-2 text-[15px] text-ink-soft"><MapPin size={16} className="text-water" /> Handwerksbetrieb in Gärtringen, Kreis Böblingen</p>
              <h1 className="rise display text-[3rem] sm:text-[4rem] lg:text-[4.7rem] xl:text-[5.2rem]">
                <span><span>Warmes Wasser.</span></span>
                <span><span>Dichte Leitungen.</span></span>
              </h1>
              <p className="fade-late mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-soft md:text-[19px]">
                Heizung und Sanitär aus Gärtringen: Wir planen und warten Heizungen, installieren Bäder, finden Lecks und renovieren. Im Umkreis von 100 km.
              </p>
              <div className="fade-late mt-8 flex flex-wrap gap-3">
                <a href={FIRMA.tel} className={`${btn} bg-water text-white hover:bg-water-deep`}><Phone size={17} /> {FIRMA.phone}</a>
                <a href={FIRMA.wa} target="_blank" rel="noreferrer" className={`${btn} border border-ink/15 bg-white hover:border-ink/35`}><MessageCircle size={17} /> Fotos per WhatsApp</a>
              </div>
              <p className="fade-late mt-8 flex max-w-[34rem] items-start gap-3 rounded-2xl border border-signal/25 bg-white px-4 py-3 text-[15px] leading-snug">
                <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-signal" />
                <span><b>Wasser läuft gerade?</b> Hauptwasserhahn zudrehen, Strom im betroffenen Raum aus, dann anrufen.</span>
              </p>
            </div>
            <div className="relative order-1 -mx-4 h-[46svh] min-h-[300px] md:mx-0 lg:absolute lg:inset-y-0 lg:right-0 lg:order-2 lg:h-auto lg:w-[58vw]">
              <div className="card-slant absolute inset-0" /><div className="card-line absolute inset-0" />
              <Suspense fallback={null}><Tools3D className="absolute inset-0" /></Suspense>
            </div>
          </div>
        </section>

        <Services onAsk={ask} />

        {/* Video-Band */}
        <section id="band" className="relative h-[78svh] min-h-[460px] overflow-hidden bg-ink text-white">
          <div id="band-media" className="absolute inset-x-0 -inset-y-[12%]"><Clip name="rundgang" /></div>
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(37,40,46,.88),rgba(37,40,46,.2)_70%)] md:bg-[linear-gradient(90deg,rgba(37,40,46,.85),rgba(37,40,46,.35)_60%,transparent)]" />
          <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-14 md:items-center md:px-8 md:pb-0">
            <div className="max-w-xl">
              <h2 className={h2}>Ein Ansprechpartner für das ganze Projekt.</h2>
              <p className="mt-5 text-[17px] leading-relaxed text-white/80 md:text-[19px]">Ob nur eine Armatur oder die ganze Wohnung: Sie sprechen mit einer Person, die den Auftrag kennt, vom ersten Anruf bis zur Übergabe.</p>
            </div>
          </div>
        </section>

        {/* Ablauf */}
        <section id="ablauf" className="py-20 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <h2 className={h2}>So läuft ein Auftrag.</h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-soft">Keine Überraschungen: Sie wissen vor dem ersten Handgriff, was gemacht wird und was es kostet.</p>
            </div>
            <ol id="steps" className="relative pl-12 md:pl-16">
              <span className="absolute bottom-3 left-[15px] top-3 w-px bg-line md:left-[19px]" />
              <span id="steps-line" className="absolute bottom-3 left-[15px] top-3 w-px origin-top bg-water md:left-[19px]" />
              {[
                ['Kurz melden', 'Anruf, WhatsApp oder E-Mail. Am besten mit ein paar Fotos vom Schaden oder vom Raum.'],
                ['Termin vor Ort', 'Wir schauen uns alles an, messen nach und besprechen mit Ihnen, was wirklich nötig ist.'],
                ['Angebot', 'Sie wissen vorher, was gemacht wird und was es kostet. Erst wenn Sie zusagen, geht es los.'],
                ['Ausführung und Übergabe', 'Wir arbeiten sauber, halten Sie auf dem Laufenden und übergeben aufgeräumt.'],
              ].map(([t, d], i) => (
                <li key={t} className="group relative pb-14 last:pb-0">
                  <span className="absolute -left-12 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold tabular-nums text-ink-soft transition-colors duration-500 group-[.on]:border-water group-[.on]:bg-water group-[.on]:text-white md:-left-16 md:h-10 md:w-10">{i + 1}</span>
                  <h3 className="wide text-[1.5rem] font-bold leading-tight md:text-[1.9rem]">{t}</h3>
                  <p className="mt-2 max-w-md text-[16px] leading-relaxed text-ink-soft">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Area />

        {/* Kontakt */}
        <section id="kontakt" className="bg-tile pb-28 pt-20 md:pb-32 md:pt-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
            <div>
              <h2 className={h2}>Erzählen Sie uns, worum es geht.</h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-soft">Am schnellsten per Telefon oder WhatsApp. Oder Sie füllen das Formular aus, dann melden wir uns.</p>
              <div className="mt-8"><DirectContact /></div>
            </div>
            <RequestForm preselect={pre} />
          </div>
        </section>
      </main>

      <footer className="bg-ink pb-24 text-white md:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-white/60 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-3 text-white md:flex-row md:items-center md:gap-8">
            <Logo light />
            <span className="text-white/60">{FIRMA.street}, {FIRMA.city}</span>
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
      <div className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white text-[13px] font-medium transition-transform duration-300 md:hidden ${scrolled ? 'translate-y-0' : 'translate-y-full'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <a href={FIRMA.tel} className="flex flex-col items-center gap-1 py-2.5"><Phone size={19} className="text-water" />Anrufen</a>
        <a href={FIRMA.wa} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 py-2.5"><MessageCircle size={19} className="text-[#1faa53]" />WhatsApp</a>
        <button onClick={() => go('kontakt')} className="flex flex-col items-center gap-1 py-2.5"><ArrowRight size={19} />Anfrage</button>
      </div>

      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  )
}

/** Leistungen: am Desktop eine waagrechte Strecke, die beim Scrollen durchläuft; am Handy untereinander. */
function Services({ onAsk }: { onAsk: (id: string) => void }) {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const st = useRef<ScrollTrigger | null>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const dist = () => track.current!.scrollWidth - innerWidth
      const tw = gsap.to(track.current, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: section.current, pin: true, scrub: 0.6, start: 'top top', end: () => `+=${dist()}`, invalidateOnRefresh: true,
          onUpdate: (s) => setActive(Math.min(SERVICES.length - 1, Math.round(s.progress * (SERVICES.length - 1)))),
        },
      })
      st.current = tw.scrollTrigger!
      return () => { st.current = null }
    })
    return () => mm.revert()
  }, [])

  const jump = (i: number) => {
    const s = st.current
    if (s) scrollTo({ top: s.start + (s.end - s.start) * (i / (SERVICES.length - 1)) })
  }

  return (
    <section ref={section} id="leistungen" className="overflow-hidden bg-white py-20 lg:flex lg:h-[100svh] lg:flex-col lg:py-0 lg:pt-24">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className={h2}>Was wir für Sie machen.</h2>
          <div className="hidden flex-wrap gap-1.5 lg:flex">
            {SERVICES.map((s, i) => (
              <button key={s.id} aria-current={active === i} onClick={() => jump(i)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${active === i ? 'bg-ink text-white' : 'text-ink-soft hover:bg-tile'}`}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:flex lg:flex-1 lg:items-center">
        <div ref={track} className="mt-10 flex flex-col gap-16 px-4 md:px-8 lg:mt-0 lg:flex-row lg:gap-16 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-[8vw]">
          {SERVICES.map((s) => (
            <article key={s.id} id={s.id} className="scroll-mt-20 md:grid md:grid-cols-[1.2fr_1fr] md:items-center md:gap-10 lg:w-[min(72vw,1000px)] lg:shrink-0">
              <div className="aspect-[16/10] overflow-hidden rounded-[22px] bg-tile">{s.clip ? <Clip name={s.clip} /> : <HeatPanel />}</div>
              <div className="mt-6 md:mt-0">
                <p className={`text-[15px] font-semibold ${s.id === 'heizung' ? 'text-signal' : 'text-water'}`}>{s.label}</p>
                <h3 className="wide mt-2 text-[1.7rem] font-bold leading-[1.08] md:text-[2.1rem]">{s.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{s.text}</p>
                <ul className="mt-4 space-y-1.5">
                  {s.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-[15px]"><Check size={17} className="mt-0.5 shrink-0 text-water" />{p}</li>)}
                </ul>
                <button onClick={() => onAsk(s.id)} className={`${btn} mt-6 border border-ink/15 !py-2.5 hover:border-ink/40`}>{s.label} anfragen <ArrowRight size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-auto hidden w-full max-w-7xl px-8 pb-8 lg:block">
        <div className="h-[3px] rounded-full bg-tile"><div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${((active + 1) / SERVICES.length) * 100}%` }} /></div>
      </div>
    </section>
  )
}

/** Heizung hat kein Video: Fläche im Stil der Visitenkarte mit Flamme und den drei Leistungen. */
function HeatPanel() {
  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute inset-y-0 left-0 w-[64%] bg-ink [clip-path:polygon(0_0,100%_0,72%_100%,0_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[64%] bg-water [clip-path:polygon(100%_0,calc(100%+6px)_0,calc(72%+6px)_100%,72%_100%)]" />
      <div className="relative flex h-full flex-col justify-center gap-5 p-7 text-white md:p-9">
        <Flame size={56} strokeWidth={1.6} className="text-signal" fill="currentColor" />
        <ul className="wide space-y-1 text-[15px] font-bold tracking-[0.08em]">
          {['PLANUNG', 'MONTAGE', 'WARTUNG'].map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </div>
  )
}

function Area() {
  const [q, setQ] = useState('')
  const r = useMemo(() => checkArea(q), [q])
  const cities = useMemo(() => Object.entries(CITY_LOOKUP)
    .map(([name, pos]) => ({ name: name.replace(/(^|-)\p{L}/gu, (c) => c.toUpperCase()), km: Math.round(distKm([HOME.lat, HOME.lon], pos)) }))
    .filter((c) => c.km > 2 && c.km <= 100).sort((a, b) => a.km - b.km), [])
  return (
    <section id="einsatzgebiet" className="border-t border-line py-20 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className={h2}>Bis zu 100 km rund um Gärtringen.</h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">Vom Kreis Böblingen über Stuttgart und Tübingen bis Pforzheim und Karlsruhe. Prüfen Sie Ihren Ort:</p>
          <label className="mt-7 block max-w-md">
            <span className="sr-only">PLZ oder Ort</span>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-water" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PLZ oder Ort, z. B. 72070 Tübingen"
                className="w-full rounded-full border border-line bg-white py-3.5 pl-11 pr-4 text-[16px] outline-none transition placeholder:text-ink-soft/60 focus:border-water" />
            </div>
          </label>
          <p className="mt-3 min-h-6 text-[15px]" aria-live="polite">
            {q.trim().length > 2 && (r.known
              ? r.inside
                ? <span className="font-medium text-emerald-700">Ja, das liegt in unserem Einsatzgebiet{r.km ? `, ca. ${r.km} km von Gärtringen` : ''}.</span>
                : <span className="font-medium text-amber-700">Ca. {r.km} km, etwas weiter weg. Rufen Sie an, oft geht es trotzdem.</span>
              : <span className="text-ink-soft">Bitte eine 5-stellige PLZ oder einen größeren Ort eingeben.</span>)}
          </p>
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-ink-soft">Entfernung ab Gärtringen</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-8 sm:grid-cols-3">
            {cities.map((c) => (
              <li key={c.name} className="flex items-baseline justify-between border-b border-line py-2.5 text-[15px]">
                <span>{c.name}</span><span className="tabular-nums text-ink-soft">{c.km} km</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
