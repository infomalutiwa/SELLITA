import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Droplets, ScanSearch, Bath, Hammer, Building2, PaintRoller, Zap, ChevronsDown, Phone, MapPin } from 'lucide-react'
import { FIRMA } from '../data'
import { Logo } from './Logo'
import { LeadConfigurator } from './LeadConfigurator'

const Badge = ({ icon, children, tone }: { icon: ReactNode; children: ReactNode; tone: 'red' | 'blue' | 'yellow' }) => (
  <span className="chip" style={{ borderColor: tone === 'red' ? '#ef444488' : tone === 'blue' ? '#38bdf888' : '#facc1588' }}>{icon}{children}</span>
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

export function Overlay({ scene, ren, onRen }: { scene: number; ren: boolean; onRen: (v: boolean) => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div key="hero" className="absolute inset-x-0 bottom-32 px-5 md:bottom-auto md:left-10 md:top-1/2 md:-translate-y-1/2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}>
            <Logo big />
            <p className="mt-5 max-w-md text-xl font-light md:text-2xl">Bad. Wände. <span className="grad-text font-semibold">Wohnraum.</span> Perfekt saniert.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href={FIRMA.tel} className="pointer-events-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff5722] to-[#ef4444] px-5 py-3 text-sm font-bold shadow-lg shadow-red-900/40"><Phone size={16} /> {FIRMA.phone}</a>
              <span className="chip"><MapPin size={12} /> Gärtringen · bis 100 km</span>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60"><ChevronsDown size={16} className="animate-bounce" /> Scrollen, um in das Haus einzutauchen</div>
          </motion.div>
        )}
        {scene === 1 && (
          <Card k="wand" side="left">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-red-400">01 · Blick in die Wand</div>
            <h2 className="text-3xl font-black leading-tight">Wir schauen <span className="text-[#ff5722]">hinein.</span></h2>
            <p className="mt-2 text-lg font-semibold">Öffnen • Prüfen • Dokumentieren</p>
            <p className="mt-1 text-sm text-white/65">Leitungen, Dämmung und Feuchtigkeit im Mauerwerk – sichtbar, bevor saniert wird.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="red" icon={<ScanSearch size={12} />}>Wandöffnung</Badge>
              <Badge tone="blue" icon={<Droplets size={12} />}>Wasserleitungen</Badge>
              <Badge tone="yellow" icon={<Zap size={12} />}>Elektrik</Badge>
            </div>
          </Card>
        )}
        {scene === 2 && (
          <Card k="bad" side="right">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-sky-300">02 · Sanitär &amp; Bad</div>
            <h2 className="text-3xl font-black leading-tight">Vom Rohr bis zur <span className="text-[#38bdf8]">Regendusche.</span></h2>
            <p className="mt-2 text-lg font-semibold">Neubau • Umbau • Reparatur</p>
            <ul className="mt-3 space-y-1 text-sm text-white/75">
              <li>✓ Badsanierung komplett aus einer Hand</li>
              <li>✓ Möbel montieren, demontieren &amp; fachgerechter Rückbau</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="blue" icon={<Bath size={12} />}>Badsanierung</Badge>
              <Badge tone="blue" icon={<Hammer size={12} />}>Möbelmontage</Badge>
              <Badge tone="blue" icon={<Droplets size={12} />}>Sanitär</Badge>
            </div>
          </Card>
        )}
        {scene === 3 && (
          <Card k="leck" side="left">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-sky-300">03 · Leckortung</div>
            <h2 className="text-3xl font-black leading-tight">Schaden finden – <span className="text-[#38bdf8]">ohne Abriss.</span></h2>
            <p className="mt-2 text-lg font-semibold">Schnell • Präzise • Zuverlässig</p>
            <p className="mt-1 text-sm text-white/65">Zerstörungsarme Ortung von Rohrbruch und Feuchtigkeitsschäden.</p>
            <div className="mt-4"><Badge tone="blue" icon={<ScanSearch size={12} />}>Rohrbruch &amp; Feuchtigkeit</Badge></div>
          </Card>
        )}
        {scene === 4 && (
          <Card k="reno" side="right">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-300">04 · Rundum-Sorglos</div>
            <h2 className="text-3xl font-black leading-tight">Alles <span className="text-yellow-300">saniert.</span></h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="yellow" icon={<PaintRoller size={12} />}>Wohnungsrenovierung</Badge>
              <Badge tone="yellow" icon={<Hammer size={12} />}>Möbel auf-/abbauen</Badge>
              <Badge tone="yellow" icon={<Building2 size={12} />}>Balkonsanierung</Badge>
              <Badge tone="yellow" icon={<Zap size={12} />}>Elektrik / Montage</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1 text-sm font-bold" role="group" aria-label="Vorher / Nachher">
              <button onClick={() => onRen(false)} className={`rounded-lg px-3 py-2 transition ${!ren ? 'bg-stone-500/70' : 'text-white/60'}`}>Vorher · Altbau</button>
              <button onClick={() => onRen(true)} className={`rounded-lg px-3 py-2 transition ${ren ? 'bg-gradient-to-r from-[#ff5722] to-[#0ea5e9]' : 'text-white/60'}`}>Nachher · SELLITA</button>
            </div>
          </Card>
        )}
        {scene === 5 && (
          <motion.div key="lead" className="absolute inset-x-0 bottom-24 flex flex-col gap-3 px-4 md:inset-x-auto md:bottom-auto md:left-10 md:top-1/2 md:w-[400px] md:-translate-y-1/2" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5 }}>
            <div className="hidden md:block">
              <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-400">05 · Einsatzgebiet</div>
              <h2 className="text-3xl font-black leading-tight">100 km um Gärtringen – <span className="grad-text">bis Karlsruhe.</span></h2>
            </div>
            <LeadConfigurator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
