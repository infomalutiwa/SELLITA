import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { Clip } from './ui/Clip'
import { CouponForm } from './ui/Contact'
import { LegalModal, type LegalKind } from './ui/LegalModal'
import { Logo } from './ui/Logo'
import { CITY_LOOKUP, FIRMA, HOME, SERVICES, checkArea, distKm, type Service } from './data'

const NAV = [['leistungen', 'Leistungen'], ['arbeiten', 'Arbeiten'], ['ablauf', 'Ablauf'], ['kontakt', 'Kontakt']] as const
const ICON3D: Record<string, string> = { sanitaer: 'shower', leck: 'droplet', bad: 'bathtub', balkon: 'nut_and_bolt', wohnung: 'toilet', elektrik: 'wrench', moebel: 'hammer' }
const poster = (s: Service) => `clips/${s.clip}.webp`

export default function App() {
  const lenis = useRef<Lenis | null>(null)
  const [legal, setLegal] = useState<LegalKind>(null)
  const [pre, setPre] = useState<{ id: string; n: number } | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const l = new Lenis({ lerp: 0.12, smoothWheel: !reduce })
    lenis.current = l
    let raf = requestAnimationFrame(function tick(t) { l.raf(t); raf = requestAnimationFrame(tick) })
    const onScroll = () => setScrolled(scrollY > 300)
    addEventListener('scroll', onScroll, { passive: true })
    // Teile eines Abschnitts nacheinander einblenden, einmal
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: 0.2 })
    document.querySelectorAll('[data-in], [data-grow]').forEach((el) => io.observe(el))
    // Bilder wandern beim Scrollen leicht in ihrem Rahmen (höchstens 4 %)
    let drift = 0
    const moveAll = () => {
      drift = 0
      document.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
        const r = el.parentElement!.getBoundingClientRect()
        if (r.bottom < 0 || r.top > innerHeight) return
        const p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2)
        el.style.setProperty('--drift', `${(p * -4).toFixed(2)}%`)
      })
    }
    const onDrift = () => { if (!drift) drift = requestAnimationFrame(moveAll) }
    if (!reduce) { addEventListener('scroll', onDrift, { passive: true }); moveAll() }
    return () => { cancelAnimationFrame(raf); l.destroy(); io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('scroll', onDrift) }
  }, [])

  const go = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) lenis.current?.scrollTo(el, { offset: -72, duration: 1.3 })
  }, [])
  const ask = useCallback((id: string) => { setPre((p) => ({ id, n: (p?.n ?? 0) + 1 })); go('kontakt') }, [go])

  return (
    <>
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-8">
          <a href="#top" onClick={(e) => { e.preventDefault(); lenis.current?.scrollTo(0) }} aria-label="SELLITA, zum Seitenanfang"><Logo /></a>
          <nav className="flex items-center gap-4 lg:gap-8">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="link hidden font-medium md:inline">{label}</a>)}
            <a href={FIRMA.tel} className="cut !px-6 !py-3"><Phone size={16} /><span className="hidden lg:inline">{FIRMA.phone}</span><span className="lg:hidden">Anrufen</span></a>
          </nav>
        </div>
      </header>

      <main id="top">
        <Hero />
        <ServiceList onAsk={ask} />
        <Showcase />
        <Work />
        <Steps />
        <Area />
        <section id="kontakt" className="px-4 py-24 md:px-8 md:py-36">
          <div className="mx-auto max-w-[1120px]" data-in><CouponForm preselect={pre} /></div>
        </section>
      </main>

      <Footer onLegal={setLegal} go={go} />

      {/* Schnellkontakt am Handy, sobald der Einstieg verlassen ist */}
      <div className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 bg-ink text-[16px] font-semibold text-white transition-transform duration-300 md:hidden ${scrolled ? 'translate-y-0' : 'translate-y-full'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <a href={FIRMA.tel} className="flex items-center justify-center gap-2 py-4"><Phone size={18} /> Anrufen</a>
        <a href={FIRMA.wa} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-water py-4"><MessageCircle size={18} /> WhatsApp</a>
      </div>

      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  )
}

/** Einstieg: Überschrift auf weißem Grund, rechts das Video in der schrägen Form der Visitenkarte. */
function Hero() {
  return (
    <section className="relative overflow-hidden md:h-[calc(100svh-72px)] md:min-h-[600px]">
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col px-4 pt-[10svh] md:justify-center md:px-8 md:pt-0">
        <div className="md:w-[47%]">
          <h1 className="t1 rise"><span><span>Sanitär und</span></span><span><span>Bäder.</span></span></h1>
          <p className="t4 after-rise mt-8 max-w-[30rem] md:text-[19px]">
            SELLITA aus Gärtringen baut Bäder, installiert Sanitär, findet Lecks und renoviert. Im Umkreis von 100 km.
          </p>
          <div className="after-rise mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a href={FIRMA.tel} className="cut cut-blue"><Phone size={17} /> {FIRMA.phone} anrufen</a>
            <a href={FIRMA.wa} target="_blank" rel="noreferrer" className="link font-semibold">Oder Fotos per WhatsApp schicken</a>
          </div>
          <p className="after-rise mt-8 max-w-[30rem] text-muted">
            <b className="text-signal">Wasser läuft gerade?</b> Hauptwasserhahn zudrehen, Strom im Raum aus, dann anrufen.
          </p>
        </div>
      </div>
      <div className="slant relative mt-10 h-[46svh] [--s:9svh] md:absolute md:inset-y-0 md:left-[52%] md:right-0 md:mt-0 md:h-auto md:[--s:22svh]">
        <div><div className="shutter h-full"><Clip name="sanitaer" eager /></div></div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[44%] z-20 hidden w-[16%] md:block">
        {[['wrench', 'md:top-[10%] md:left-[18%]', 'w-16 md:w-28', '0s'], ['shower', 'md:top-[36%] md:left-[0%]', 'w-16 md:w-32', '-1.4s'], ['droplet', 'md:top-[62%] md:left-[22%]', 'w-14 md:w-24', '-2.6s']].map(([n, pos, w, d]) => (
          <img key={n} src={`img/3d/${n}.png`} alt="" width={256} height={256} className={`float md:absolute ${pos} ${w}`} style={{ animationDelay: d }} />
        ))}
      </div>
    </section>
  )
}

/** Leistungen als zweispaltige Liste; das Vorschaubild ist schräg zugeschnitten wie die Visitenkarte. */
function ServiceList({ onAsk }: { onAsk: (id: string) => void }) {
  return (
    <section id="leistungen" className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-40">
      <div className="flex items-baseline justify-between gap-6" data-in>
        <h2 className="t2">Leistungen</h2>
        <p className="text-muted">{SERVICES.length} Leistungen, ein Ansprechpartner</p>
      </div>
      <ul className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 lg:grid-cols-2" data-in>
        {SERVICES.map((s) => (
          <li key={s.id} id={s.id} className="flex min-w-0 gap-5 scroll-mt-24">
            <div className="relative shrink-0 self-start">
              <div className="thumb slant slant-sm h-[88px] w-[88px] [--s:22%]"><div><img src={poster(s)} alt="" width={88} height={88} className="h-full w-full object-cover" /></div></div>
              <img src={`img/3d/${ICON3D[s.id]}.png`} alt="" width={256} height={256} loading="lazy" className="float absolute -bottom-3 -right-4 w-14" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="t4 min-w-0 font-bold [overflow-wrap:anywhere]">{s.label}</h3>
                <button onClick={() => onAsk(s.id)} className="link shrink-0 font-semibold text-water">Anfragen</button>
              </div>
              <p className="mt-1 max-w-[42ch]">{s.text}</p>
              <p className={`mt-2 font-medium text-water`}>{s.points.join(', ')}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Die Videos: links die Leistungen zum Auswählen, rechts der Clip in der schrägen Form. */
function Showcase() {
  const items = SERVICES.filter((s) => s.clip && s.clip !== 'sanitaer')
  const [i, setI] = useState(0)
  const s = items[i]
  return (
    <section className="bg-tile px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-12 lg:items-end lg:gap-10" data-in>
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-4">
          <h2 className="t3 text-muted">So sieht das aus</h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 lg:mt-2 lg:flex-col lg:gap-1" role="tablist" aria-label="Leistung im Video">
            {items.map((it, k) => (
              <button key={it.id} role="tab" aria-selected={k === i} onClick={() => setI(k)}
                className={`t3 shrink-0 text-left transition-colors duration-200 ${k === i ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                {it.label}
              </button>
            ))}
          </div>
          <p className="t4 mt-6 lg:hidden">{s.title}.</p>
        </div>
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-8">
          <div className="slant aspect-[16/10] [--s:12%]"><div><div key={s.id} className="swap h-full"><div data-drift><Clip name={s.clip} /></div></div></div></div>
          <p className="t4 mt-4 hidden text-right lg:block">{s.title}.</p>
        </div>
      </div>
    </section>
  )
}

const WORK: [string, string][] = [
  ['Dachbad mit bodengleicher Dusche', ''],
  ['Dachbad in Terrazzo und Messing', ''],
  ['Dusche mit Holzoptik-Fliesen und Nische', ''],
  ['Walk-in-Dusche in Marmoroptik', ''],
  ['Duschbad mit Spiegelschrank', ''],
  ['Duschbad mit Rinne und Nische', ''],
  ['Dusche und WC, bodeneben', ''],
  ['Duschbad mit Schiebetür', ''],
]

/** Bisherige Arbeiten: echte Bäder von Kunden, das erste groß; ein Klick öffnet das Bild. */
function Work() {
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    if (open === null) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((o) => (o! + 1) % WORK.length)
      if (e.key === 'ArrowLeft') setOpen((o) => (o! + WORK.length - 1) % WORK.length)
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open])
  return (
    <section id="arbeiten" className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-40">
      <div className="flex flex-wrap items-end justify-between gap-4" data-in>
        <h2 className="t2">Bisherige Arbeiten</h2>
        <p className="text-muted">Bäder, die wir für Kunden gebaut haben</p>
      </div>
      <ul className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4" data-in>
        {WORK.map(([t], k) => (
          <li key={k} className={k === 0 ? 'col-span-2 row-span-2' : k === WORK.length - 1 ? 'col-span-2' : ''}>
            <button onClick={() => setOpen(k)} className="work group relative block h-full w-full overflow-hidden bg-tile text-left" aria-label={`${t} vergrößern`}>
              <img src={`img/arbeiten/${k + 1}.webp`} alt={t} loading="lazy" className={`h-full w-full object-cover ${k === 0 ? 'aspect-[4/3] lg:aspect-auto' : k === WORK.length - 1 ? 'aspect-[3/2] lg:absolute lg:inset-0 lg:aspect-auto' : 'aspect-[3/4]'}`} />
              <span className="absolute inset-x-0 bottom-0 bg-ink/85 px-4 py-3 text-sm font-semibold text-white">{t}</span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <div role="dialog" aria-modal aria-label={WORK[open][0]} className="modal-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/95 p-4" onClick={() => setOpen(null)}>
          <img src={`img/arbeiten/${open + 1}.webp`} alt={WORK[open][0]} className="max-h-[82svh] max-w-full object-contain" />
          <div className="flex items-center gap-6 text-white" onClick={(e) => e.stopPropagation()}>
            <button className="cut !px-5 !py-2" onClick={() => setOpen((open + WORK.length - 1) % WORK.length)} aria-label="Vorheriges Bild">‹</button>
            <span className="font-semibold">{WORK[open][0]} · {open + 1}/{WORK.length}</span>
            <button className="cut !px-5 !py-2" onClick={() => setOpen((open + 1) % WORK.length)} aria-label="Nächstes Bild">›</button>
            <button className="link" onClick={() => setOpen(null)}>Schließen</button>
          </div>
        </div>
      )}
    </section>
  )
}

const STEPS: [string, string, string][] = [
  ['Kurz melden', 'Anruf, WhatsApp oder E-Mail. Am besten mit ein paar Fotos vom Schaden oder vom Raum, dann können wir schon vorab einschätzen, was nötig ist.', 'clips/balkon.webp'],
  ['Termin vor Ort', 'Wir schauen uns alles an, messen nach und besprechen mit Ihnen, was wirklich gemacht werden muss.', 'clips/leck.webp'],
  ['Angebot', 'Sie wissen vorher, was gemacht wird und was es kostet. Erst wenn Sie zusagen, geht es los.', 'clips/wohnung.webp'],
  ['Ausführung', 'Wir arbeiten sauber, halten Sie auf dem Laufenden und übergeben aufgeräumt.', 'clips/bad.webp'],
]

/** Ablauf als Reihe von Flächen, dunkel nach hell; eine ist offen. */
function Steps() {
  const [open, setOpen] = useState(0)
  return (
    <section id="ablauf" className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-40">
      <div className="grid gap-6 lg:grid-cols-12" data-in>
        <h2 className="t2 lg:col-span-5">So läuft ein Auftrag</h2>
        <p className="t4 max-w-[36rem] lg:col-span-5 lg:col-start-7">Keine Überraschungen: Sie wissen vor dem ersten Handgriff, was gemacht wird und was es kostet. Vier Schritte, alle mit derselben Person.</p>
      </div>
      <ol className="mt-12 flex flex-col lg:mt-16 lg:h-[520px] lg:flex-row" data-in>
        {STEPS.map(([t, d, img], k) => {
          const on = open === k, light = k === 3
          return (
            <li key={t} className={`flex transition-[flex-basis] duration-[450ms] ease-[var(--ease-in-out)] ${on ? 'lg:basis-[58%]' : 'lg:basis-[14%]'} ${['bg-step-1', 'bg-step-2', 'bg-step-3', 'bg-step-4'][k]} ${light ? 'text-ink' : 'text-white'} lg:min-w-0`}>
              {on ? (
                <div className="panel-in flex w-full flex-col gap-6 p-6 md:p-10 lg:flex-row">
                  <div className="flex flex-1 flex-col justify-between gap-6">
                    <h3 className="t3">{t}</h3>
                    <p className="t4 max-w-[36ch]">{d}</p>
                  </div>
                  <div className="slant aspect-[4/3] w-full self-end [--s:18%] lg:w-[48%]"><div><div data-drift><img src={img} alt="" width={480} height={360} loading="lazy" className="h-full w-full object-cover" /></div></div></div>
                </div>
              ) : (
                <button onClick={() => setOpen(k)} aria-expanded={false} className="flex h-16 w-full items-center px-6 text-left font-bold transition-opacity hover:opacity-85 lg:h-full lg:items-end lg:p-6">
                  <span className="t4 font-bold lg:[writing-mode:vertical-rl] lg:rotate-180">{t}</span>
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Einsatzgebiet: dunkles Band mit der blauen Schräge; hier prüft man seinen Ort. */
function Area() {
  const [q, setQ] = useState('')
  const r = useMemo(() => checkArea(q), [q])
  const cities = useMemo(() => Object.entries(CITY_LOOKUP)
    .map(([name, pos]) => ({ name: name.replace(/(^|-)\p{L}/gu, (c) => c.toUpperCase()), km: Math.round(distKm([HOME.lat, HOME.lon], pos)) }))
    .filter((c) => c.km > 2 && c.km <= 100).sort((a, b) => a.km - b.km), [])
  return (
    <section id="einsatzgebiet" className="relative overflow-hidden bg-ink px-4 py-24 text-white md:px-8 md:py-36">
      <div className="absolute inset-y-0 left-[54%] hidden w-[14px] skew-x-[11deg] bg-water lg:block" aria-hidden />
      <div className="relative mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6" data-in>
          <h2 className="t2">Kommen wir zu Ihnen?</h2>
          <p className="t4 mt-6 max-w-[34rem] text-white/85">Wir fahren bis zu 100 km rund um Gärtringen, vom Kreis Böblingen bis Karlsruhe. Geben Sie Ihre PLZ oder Ihren Ort ein:</p>
          <label className="mt-8 block max-w-[30rem]">
            <span className="sr-only">PLZ oder Ort</span>
            <span className="relative block">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-water" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. 72070 oder Tübingen"
                className="h-16 w-full bg-white pl-12 pr-4 text-[18px] text-ink outline-none placeholder:text-muted" />
            </span>
          </label>
          <p className="t4 mt-4 min-h-8 font-semibold" aria-live="polite">
            {q.trim().length > 2 && (r.known
              ? r.inside ? <>Ja, das liegt im Einsatzgebiet{r.km ? `, ca. ${r.km} km von Gärtringen` : ''}.</> : <>Ca. {r.km} km, etwas weiter weg. Rufen Sie an, oft geht es trotzdem.</>
              : <span className="font-normal text-white/80">Bitte eine 5-stellige PLZ oder einen größeren Ort eingeben.</span>)}
          </p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8" data-in>
          <div className="slant aspect-[16/9] [--s:12%]"><div><div data-drift><Clip name="rundgang" /></div></div></div>
          <h3 className="t4 mt-8 font-bold">Entfernung ab Gärtringen</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5">
            {cities.map((c) => <li key={c.name} className="flex justify-between gap-3"><span>{c.name}</span><span className="tabular-nums text-white/75">{c.km} km</span></li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

/** Schluss: der Name aus Blöcken gebaut, darunter Links und Kontakt. */
function Footer({ onLegal, go }: { onLegal: (k: LegalKind) => void; go: (id: string) => void }) {
  const blocks: [string, number, string][] = [['S', 100, 'bg-ink'], ['E', 74, 'bg-ink'], ['L', 88, 'bg-water'], ['L', 64, 'bg-ink'], ['I', 94, 'bg-ink'], ['T', 70, 'bg-signal'], ['A', 84, 'bg-ink']]
  return (
    <footer className="bg-tile px-4 pb-28 pt-20 md:px-8 md:pb-10 md:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex h-[22svh] items-end gap-1 md:h-[34svh]" aria-label="SELLITA" role="img" data-grow>
          {blocks.map(([ch, h, bg], k) => (
            <div key={k} className={`${bg} relative flex flex-1 items-end justify-center overflow-hidden`} style={{ height: `${h}%`, transitionDelay: `${k * 70}ms` }}>
              <span aria-hidden className="translate-y-[12%] text-[clamp(56px,15vw,230px)] font-black leading-[0.8] text-tile [font-variation-settings:'wdth'_125]">{ch}</span>
            </div>
          ))}
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-12">
          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3">
            <div>
              <h2 className="t5 font-bold">Leistungen</h2>
              <ul className="mt-3 space-y-1.5">{SERVICES.slice(0, 5).map((s) => <li key={s.id}><a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); go(s.id) }} className="link">{s.label}</a></li>)}</ul>
            </div>
            <div>
              <h2 className="t5 font-bold">Seite</h2>
              <ul className="mt-3 space-y-1.5">
                {[['leistungen', 'Leistungen'], ['arbeiten', 'Arbeiten'], ['ablauf', 'Ablauf'], ['einsatzgebiet', 'Einsatzgebiet'], ['kontakt', 'Anfrage']].map(([id, l]) => <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="link">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <h2 className="t5 font-bold">Rechtliches</h2>
              <ul className="mt-3 space-y-1.5">
                <li><button onClick={() => onLegal('impressum')} className="link">Impressum</button></li>
                <li><button onClick={() => onLegal('datenschutz')} className="link">Datenschutz</button></li>
              </ul>
            </div>
          </div>
          <address className="not-italic md:col-span-4">
            <p className="font-bold">SELLITA Heizung &amp; Sanitär</p>
            <p className="mt-3">{FIRMA.street}<br />{FIRMA.city}</p>
            <p className="mt-3"><a href={FIRMA.tel} className="link">{FIRMA.phone}</a><br /><a href={`mailto:${FIRMA.mail}`} className="link">{FIRMA.mail}</a></p>
          </address>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 text-muted">
          <p>© {new Date().getFullYear()} SELLITA.</p>
          <button onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} className="cut !px-6 !py-2.5">Nach oben</button>
        </div>
      </div>
    </footer>
  )
}
