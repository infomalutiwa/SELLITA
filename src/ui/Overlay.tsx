import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Droplets, ScanSearch, Bath, Hammer, Building2, PaintRoller, Zap, ChevronsDown, Phone, MapPin } from 'lucide-react'
import { FIRMA } from '../data'
import { Logo } from './Logo'
import { LeadConfigurator } from './LeadConfigurator'

const Badge = ({ icon, children, tone }: { icon: ReactNode; children: ReactNode; tone: 'red' | 'blue' | 'white' }) => (
  <span className="chip" style={{ borderColor: tone === 'red' ? '#ef444488' : tone === 'blue' ? '#0ea5e988' : '#ffffff55' }}>{icon}{children}</span>
)
const Kicker = ({ n, children, red = false }: { n: string; children: ReactNode; red?: boolean }) => (
  <div className={`mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.25em] ${red ? 'text-[#ef4444]' : 'text-[#38bdf8]'}`}>{n} · {children}</div>
)
const Steps = ({ items }: { items: string[] }) => (
  <ol className="mt-3 hidden grid-cols-2 gap-1.5 text-[13px] md:grid">
    {items.map((t, i) => <li key={t} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5"><span className="font-mono text-[11px] text-[#38bdf8]">{String(i + 1).padStart(2, '0')}</span>{t}</li>)}
  </ol>
)

function Card({ k, side = 'left', children }: { k: string; side?: 'left' | 'right'; children: ReactNode }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: side === 'left' ? -30 : 30, filter: 'blur(6px)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass pointer-events-auto absolute bottom-28 z-20 w-[min(92vw,380px)] rounded-2xl p-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${side === 'left' ? 'left-4 md:left-10' : 'right-4 md:right-20'}`}
    >
      {children}
    </motion.div>
  )
}

export function Overlay({ scene, ren, onRen }: { scene: number; ren: boolean; onRen?: (v: boolean) => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div key="hero" className="absolute inset-x-0 bottom-32 px-5 md:bottom-auto md:left-10 md:top-1/2 md:-translate-y-1/2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}>
            <Logo big />
            <p className="mt-5 max-w-md text-xl font-light md:text-2xl">Ein Haus. Eine Kamerafahrt. <span className="font-semibold text-[#38bdf8]">Alles saniert.</span></p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href={FIRMA.tel} className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-bold shadow-lg shadow-sky-900/40 transition hover:bg-[#38bdf8]"><Phone size={16} /> {FIRMA.phone}</a>
              <span className="chip"><MapPin size={12} /> Gärtringen · bis 100 km</span>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60"><ChevronsDown size={16} className="animate-bounce" /> Scrollen oder Kino-Modus starten</div>
          </motion.div>
        )}
        {scene === 1 && (
          <Card k="wand" side="left">
            <Kicker n="01" red>Leckortung · Wand-Scan</Kicker>
            <h2 className="text-3xl font-black leading-tight">Wir blicken <span className="text-[#ef4444]">in Ihre Wände.</span></h2>
            <p className="mt-2 text-lg font-semibold">Schnell • Präzise • Zerstörungsfrei</p>
            <p className="mt-1 text-sm text-white/65">Thermografie und Ortung machen Wasserleitungen und feuchte Stellen im Mauerwerk sichtbar – ohne die Wand aufzustemmen.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="red" icon={<ScanSearch size={12} />}>Wärmebild</Badge>
              <Badge tone="blue" icon={<Droplets size={12} />}>Rohrbruch &amp; Feuchtigkeit</Badge>
            </div>
          </Card>
        )}
        {scene === 2 && (
          <Card k="bad" side="right">
            <Kicker n="02">Sanitär &amp; Badsanierung</Kicker>
            <h2 className="text-3xl font-black leading-tight">Schicht für Schicht <span className="text-[#38bdf8]">zum neuen Bad.</span></h2>
            <p className="mt-2 text-sm text-white/65">Wir folgen der Steigleitung nach oben: Rückbau, neue Leitungen, Abdichtung, Großformat-Fliesen und Sanitärobjekte – alles aus einer Hand.</p>
            <Steps items={['Rohre', 'Abdichtung', 'Fliesen', 'Sanitärobjekte']} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="blue" icon={<Droplets size={12} />}>Sanitär</Badge>
              <Badge tone="blue" icon={<Bath size={12} />}>Badsanierung</Badge>
            </div>
          </Card>
        )}
        {scene === 3 && (
          <Card k="wohnen" side="left">
            <Kicker n="03">Wohnraum &amp; Möbel</Kicker>
            <h2 className="text-3xl font-black leading-tight">Abbauen. Aufbauen. <span className="text-[#38bdf8]">Wohnen.</span></h2>
            <p className="mt-2 text-sm text-white/65">Alte Möbel fachgerecht demontiert, neue montiert, Wände und Böden renoviert – und die Elektrik sauber in der Wand verlegt.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="white" icon={<Hammer size={12} />}>Möbel demontieren/montieren</Badge>
              <Badge tone="white" icon={<PaintRoller size={12} />}>Wohnungsrenovierung</Badge>
              <Badge tone="blue" icon={<Zap size={12} />}>Elektrik in der Wand</Badge>
            </div>
            {onRen && <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1 text-sm font-bold" role="group" aria-label="Vorher / Nachher">
              <button onClick={() => onRen(false)} className={`rounded-lg px-3 py-2 transition ${!ren ? 'bg-white/20' : 'text-white/60'}`}>Vorher · Altbau</button>
              <button onClick={() => onRen(true)} className={`rounded-lg px-3 py-2 transition ${ren ? 'bg-[#0ea5e9]' : 'text-white/60'}`}>Nachher · SELLITA</button>
            </div>}
          </Card>
        )}
        {scene === 4 && (
          <Card k="balkon" side="right">
            <Kicker n="04">Balkon &amp; Elektrik</Kicker>
            <h2 className="text-3xl font-black leading-tight">Dicht. Sicher. <span className="text-[#38bdf8]">Beleuchtet.</span></h2>
            <p className="mt-2 text-sm text-white/65">Balkonsanierung im kompletten Schichtaufbau – dazu Außenleuchten und Steckdosen fachgerecht montiert.</p>
            <Steps items={['Betonplatte', 'Abdichtung', 'Drainagematte', 'Belag']} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="blue" icon={<Building2 size={12} />}>Balkonsanierung</Badge>
              <Badge tone="white" icon={<Zap size={12} />}>Elektrik / Montage</Badge>
            </div>
          </Card>
        )}
        {scene === 5 && (
          <motion.div key="lead" className="absolute inset-x-0 bottom-24 flex flex-col gap-3 px-4 md:inset-x-auto md:bottom-auto md:left-10 md:top-1/2 md:w-[400px] md:-translate-y-1/2" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5 }}>
            <div className="hidden md:block">
              <Kicker n="05">100 km Radius &amp; Anfrage</Kicker>
              <h2 className="text-3xl font-black leading-tight">100 km um Gärtringen – <span className="grad-text">bis Karlsruhe.</span></h2>
            </div>
            <LeadConfigurator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
