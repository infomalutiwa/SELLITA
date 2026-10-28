import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { S, sceneOf } from '../state'

// Scroll-Fortschritt <-> Film-Zeit (Sekunden)
const MARK_P = [0, 0.39, 0.58, 0.73, 0.92, 1]
const MARK_T = [0, 15, 30, 45, 60, 65]
export const MARKS = [
  { t: '00:00', label: 'Das Haus & Wand-Scan', p: 0 },
  { t: '00:15', label: 'Bad & Sanitär', p: 0.39 },
  { t: '00:30', label: 'Wohnraum & Möbel', p: 0.58 },
  { t: '00:45', label: 'Balkon & Elektrik', p: 0.73 },
  { t: '01:00', label: '100 km Radius & Anfrage', p: 0.92 },
]

const pToT = (p: number) => {
  for (let i = 1; i < MARK_P.length; i++) if (p <= MARK_P[i]) return MARK_T[i - 1] + ((p - MARK_P[i - 1]) / (MARK_P[i] - MARK_P[i - 1])) * (MARK_T[i] - MARK_T[i - 1])
  return MARK_T[MARK_T.length - 1]
}
const fmt = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function Timeline({ playing, onPlay, onSeek }: { playing: boolean; onPlay: () => void; onSeek: (p: number, live: boolean) => void }) {
  const fill = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const time = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const p = S.p
      if (fill.current) fill.current.style.transform = `scaleX(${p})`
      if (head.current) head.current.style.left = `${p * 100}%`
      if (time.current) time.current.textContent = `${fmt(pToT(p))} / 01:05`
      // Szene 0+1 (Haus & Wand-Scan) teilen sich die erste Marke
      const a = Math.max(0, sceneOf(p) - 1)
      setActive((x) => (x === a ? x : a))
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  const seek = (e: React.PointerEvent, live: boolean) => {
    const r = bar.current!.getBoundingClientRect()
    onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), live)
  }

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 px-4 pb-8 pt-3 md:px-10 md:pb-9">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <button onClick={onPlay} aria-label={playing ? 'Pause' : 'Kino-Modus abspielen'} aria-pressed={playing}
          className="glass flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold">
          {playing ? <Pause size={14} /> : <Play size={14} />}<span className="hidden sm:inline">{playing ? 'Pause' : 'Kino-Modus'}</span>
        </button>
        <div className="min-w-0 flex-1">
          <div ref={bar} className="relative h-5 cursor-pointer touch-none"
            onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); seek(e, true) }}
            onPointerMove={(e) => { if (e.buttons) seek(e, true) }}
            onPointerUp={(e) => seek(e, false)}>
            <div className="absolute inset-x-0 top-2 h-[3px] rounded-full bg-white/15" />
            <div ref={fill} className="absolute inset-x-0 top-2 h-[3px] origin-left rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8]" style={{ transform: 'scaleX(0)' }} />
            {MARKS.map((m) => <span key={m.t} className="absolute top-[5px] h-[9px] w-px bg-white/50" style={{ left: `${m.p * 100}%` }} />)}
            <div ref={head} className="absolute top-[3px] h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_#38bdf8]" />
          </div>
          <div className="relative hidden h-4 md:block">
            {MARKS.map((m, i) => (
              <button key={m.t} onClick={() => onSeek(m.p, false)} className={`absolute top-0 whitespace-nowrap text-[10px] tracking-wide transition-colors ${active === i ? 'text-sky-300' : 'text-white/45 hover:text-white'}`}
                style={{ left: `${m.p * 100}%`, transform: i === 0 ? 'none' : i === MARKS.length - 1 ? 'translateX(-70%)' : 'translateX(-30%)' }}>
                <b className="font-mono">{m.t}</b>{active === i && <span className="ml-1">{m.label}</span>}
              </button>
            ))}
          </div>
        </div>
        <span ref={time} className="hidden w-24 shrink-0 text-right font-mono text-[11px] text-white/60 sm:block">00:00 / 01:05</span>
      </div>
    </div>
  )
}
