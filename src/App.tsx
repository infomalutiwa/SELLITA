import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Component, type ReactNode } from 'react'
import { Orbit, Phone, ScanEye, X } from 'lucide-react'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { Experience } from './scene/Experience'
import { Overlay } from './ui/Overlay'
import { HudNav } from './ui/HudNav'
import { Timeline } from './ui/Timeline'
import { VideoScrub, loadVideoManifest, type VideoManifest } from './ui/VideoScrub'
import { LegalModal, type LegalKind } from './ui/LegalModal'
import { Logo } from './ui/Logo'
import { S, sceneOf } from './state'
import { FIRMA } from './data'

gsap.registerPlugin(ScrollTrigger)

class GLBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() {
    return this.state.err ? (
      <div className="fixed inset-0 flex items-center justify-center p-8 text-center text-white/80">
        <div><Logo big /><p className="mt-6">Ihr Browser unterstützt keine 3D-Grafik (WebGL). Rufen Sie uns an: <a className="underline" href={FIRMA.tel}>{FIRMA.phone}</a></p></div>
      </div>
    ) : this.props.children
  }
}

export default function App() {
  const [scene, setScene] = useState(0)
  const [ren, setRen] = useState(true)
  const [free, setFree] = useState(false)
  const [xray, setXray] = useState(false)
  const [legal, setLegal] = useState<LegalKind>(null)
  const [playing, setPlaying] = useState(false)
  const lenis = useRef<Lenis | null>(null)
  const autoRef = useRef<(() => void) | null>(null)
  // vorgerenderter Film vorhanden? (undefined = wird geprüft)
  const [video, setVideo] = useState<VideoManifest | null | undefined>(S.exp ? null : undefined)
  const [vidProg, setVidProg] = useState(0)
  useEffect(() => { if (video === undefined) loadVideoManifest().then(setVideo) }, [video])
  const onVidProgress = useCallback((l: number, n: number) => setVidProg(Math.min(100, (l / n) * 100)), [])

  useEffect(() => {
    const l = new Lenis({ duration: 1.25, smoothWheel: true })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const st = ScrollTrigger.create({
      trigger: '#scroll', start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { S.target = self.progress; setScene((s) => { const n = sceneOf(self.progress); return n === s ? s : n }) },
    })
    return () => { st.kill(); gsap.ticker.remove(tick); l.destroy() }
  }, [])

  useEffect(() => { S.renTarget = ren ? 1 : 0 }, [ren])
  useEffect(() => {
    S.free = free
    if (free) lenis.current?.stop(); else lenis.current?.start()
  }, [free])
  useEffect(() => { S.xrayForce = xray }, [xray])

  const jump = useCallback((p: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    lenis.current?.scrollTo(p * max, { duration: 2.2 })
  }, [])

  const stop = useCallback(() => {
    setPlaying(false)
    lenis.current?.scrollTo(window.scrollY, { immediate: true, force: true })
  }, [])
  const play = useCallback(() => {
    if (playing) return stop()
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (S.target > 0.985) lenis.current?.scrollTo(0, { immediate: true })
    setPlaying(true)
    lenis.current?.scrollTo(max, { duration: Math.max(2, (1 - Math.min(S.target, 0.985)) * 65), easing: (t) => t, onComplete: () => setPlaying(false) })
  }, [playing, stop])
  autoRef.current = play
  const seek = useCallback((p: number, live: boolean) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    setPlaying(false)
    if (live) lenis.current?.scrollTo(p * max, { immediate: true, force: true })
    else lenis.current?.scrollTo(p * max, { duration: 2, force: true })
  }, [])
  useEffect(() => {
    if (!playing) return
    const off = () => setPlaying(false)
    window.addEventListener('wheel', off, { passive: true }); window.addEventListener('touchstart', off, { passive: true }); window.addEventListener('keydown', off)
    return () => { window.removeEventListener('wheel', off); window.removeEventListener('touchstart', off); window.removeEventListener('keydown', off) }
  }, [playing])

  return (
    <>
      {video !== undefined && <GLBoundary><Experience video={!!video} active={!video || scene >= 5 || free} /></GLBoundary>}
      {video && <VideoScrub m={video} onProgress={onVidProgress} />}
      <Loader video={video === undefined ? 'pending' : video ? vidProg : null} onDone={() => setTimeout(() => { if (!S.exp && window.scrollY < 10 && !matchMedia('(prefers-reduced-motion: reduce)').matches) autoRef.current?.() }, 2500)} />
      {!free && <Letterbox />}
      <div id="scroll" style={{ height: '800vh' }} aria-hidden />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-4 md:px-8">
        <div className={`transition-opacity ${scene === 0 ? 'opacity-0' : 'opacity-100'}`}><Logo /></div>
        <div className="pointer-events-auto flex items-center gap-2">
          {free && (
            <button onClick={() => setXray(!xray)} className={`glass flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${xray ? 'text-sky-300' : ''}`}><ScanEye size={14} /> Röntgen</button>
          )}
          {!video && <button onClick={() => setFree(!free)} className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold" aria-pressed={free}>
            {free ? <X size={14} /> : <Orbit size={14} />}<span className="hidden sm:inline">{free ? 'Zurück zur Tour' : 'Haus frei drehen'}</span>
          </button>}
          <a href={FIRMA.tel} className="flex items-center gap-2 rounded-full bg-[#0ea5e9] px-3 py-2 text-xs font-bold shadow-lg shadow-sky-900/40"><Phone size={14} /><span className="hidden sm:inline">{FIRMA.phone}</span></a>
        </div>
      </header>

      {!free && <Overlay scene={scene} ren={ren} onRen={video ? undefined : setRen} />}
      {!free && <HudNav active={scene} onJump={jump} />}

      {/* progress bar */}
      <ProgressBar />

      {!free && <Timeline playing={playing} onPlay={play} onSeek={seek} />}

      <footer className="pointer-events-auto fixed bottom-1.5 left-4 z-30 flex gap-4 text-[11px] text-white/50 md:left-10">
        <button onClick={() => setLegal('impressum')} className="hover:text-white">Impressum</button>
        <button onClick={() => setLegal('datenschutz')} className="hover:text-white">Datenschutz</button>
        <span className="hidden sm:inline">{FIRMA.street}, {FIRMA.city}</span>
      </footer>
      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  )
}

function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => { if (ref.current) ref.current.style.transform = `scaleX(${S.p})`; raf = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div className="fixed inset-x-0 top-0 z-40 h-[3px] bg-white/5"><div ref={ref} className="h-full origin-left bg-gradient-to-r from-[#0ea5e9] to-white" style={{ transform: 'scaleX(0)' }} /></div>
}

function Letterbox() {
  const bar = 'fixed inset-x-0 z-[15] bg-[#07090e] pointer-events-none transition-[height] duration-1000'
  const h = 'max(0px, calc((100vh - 100vw / 2.39) / 2))'
  return (<><div className={bar + ' top-0'} style={{ height: h }} /><div className={bar + ' bottom-0'} style={{ height: h }} /></>)
}

function Loader({ onDone, video }: { onDone: () => void; video: number | 'pending' | null }) {
  const gl = useProgress()
  // Film-Modus: Fortschritt der Bildsequenz; sonst: 3D-Assets
  const progress = video === 'pending' ? 0 : video === null ? gl.progress : video
  const active = video === 'pending' ? true : video === null ? gl.active : video < 100
  const [done, setDone] = useState(false)
  useEffect(() => { if (!active && progress >= 100) { const t = setTimeout(() => { setDone(true); onDone() }, 500); return () => clearTimeout(t) } }, [active, progress])
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#07090e]" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <Logo big />
          <div className="h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-[#0ea5e9] to-white transition-all" style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Haus wird aufgebaut · {Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
