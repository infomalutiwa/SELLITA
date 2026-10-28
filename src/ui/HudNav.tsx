import { SCENES } from '../data'
import { SCENE_JUMP } from '../state'

export function HudNav({ active, onJump }: { active: number; onJump: (p: number) => void }) {
  return (
    <nav aria-label="Szenen" className="pointer-events-auto fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
      {SCENES.map((s, i) => (
        <button key={s.id} onClick={() => onJump(SCENE_JUMP[i])} className="group flex items-center gap-3" aria-current={active === i} aria-label={s.hud}>
          <span className={`glass rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-all ${active === i ? 'opacity-100' : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>{s.hud}</span>
          <span className="relative block h-3 w-3 rounded-full border border-white/50 transition-all" style={active === i ? { background: s.color, boxShadow: `0 0 14px ${s.color}`, transform: 'scale(1.35)', borderColor: s.color } : undefined} />
        </button>
      ))}
    </nav>
  )
}
