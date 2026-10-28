export function HouseIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M15.2 3 2 15h4.2v13h9z" fill="#EF4444" />
      <path d="M16.8 3 30 15h-4.2v13h-9z" fill="#0EA5E9" />
    </svg>
  )
}

export function Logo({ big = false }: { big?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <HouseIcon size={big ? 56 : 30} />
      <div className="leading-none">
        <div className={`font-black tracking-[0.14em] ${big ? 'text-5xl md:text-7xl' : 'text-lg'}`}>SELLITA</div>
        <div className={`font-semibold tracking-[0.28em] uppercase ${big ? 'mt-2 text-sm md:text-base' : 'text-[9px] mt-1'}`}>
          <span className="text-[#ef4444]">Heizung</span> <span className="text-white/60">&amp;</span> <span className="text-[#38bdf8]">Sanitär</span>
        </div>
      </div>
    </div>
  )
}
