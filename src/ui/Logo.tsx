/** Haus mit Heizkörper (rot) und Wasserhahn/Tropfen (blau), nach dem Zeichen auf der Visitenkarte. */
export function HouseIcon({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const stroke = light ? '#c9ced6' : '#555a63'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden fill="none">
      <path d="M4 19 20 5l16 14" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16v19h24V16" stroke={stroke} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M27 7v5" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      {[11, 14, 17].map((x) => <rect key={x} x={x} y="21" width="2.2" height="11" rx="1.1" fill="#D7262E" />)}
      <path d="M24 21h5v3" stroke="#1E88D2" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 26.5c1.3 1.8 2 2.9 2 3.8a2 2 0 0 1-4 0c0-.9.7-2 2-3.8Z" fill="#1E88D2" />
    </svg>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <HouseIcon size={34} light={light} />
      <div className="leading-none">
        <div className="text-[24px] font-extrabold leading-none tracking-[0.01em] [font-variation-settings:'wdth'_125]">SELLITA</div>
        <div className="wide mt-1 text-[13px] font-bold tracking-[0.06em]"><span className="text-signal">HEIZUNG</span> <span className={light ? 'text-white/60' : 'text-muted'}>&amp;</span> <span className="text-water">SANITÄR</span></div>
      </div>
    </div>
  )
}
