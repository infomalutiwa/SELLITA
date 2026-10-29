/**
 * Zeichen der Visitenkarte, nachgezeichnet: Hausumriss mit Schornstein und Sprossenfenster, roter Heizkörper mit
 * drei Wärmewellen, rechts Wasserhahn über dem Waschbecken mit blauem Tropfen. Beim Laden zeichnet sich der Umriss,
 * danach steigen die Wellen und der Tropfen fällt in Schleife.
 */
export function HouseIcon({ size = 48, line = '#b9bdc3' }: { size?: number; line?: string }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 720 540" aria-hidden className="logo-icon">
      <g fill="none" stroke={line} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
        {/* Dach mit Überstand, Wände, Schornstein */}
        <path className="draw" pathLength={1} d="M58 206 L382 66 L664 250" />
        <path className="draw" pathLength={1} d="M104 192 V262" />
        <path className="draw" pathLength={1} d="M624 236 V446" />
        <path className="draw" pathLength={1} d="M238 132 V96" />
        {/* Wasserhahn: Auslauf und Griff */}
        <path className="draw" pathLength={1} d="M440 268 H566 Q586 268 586 290 V440 Q586 472 556 472 H452 Q424 472 404 446 L352 380" />
        <path className="draw" pathLength={1} d="M492 268 V242 M476 242 H508" />
        {/* Beckenrand */}
        <path className="draw" pathLength={1} d="M426 384 H560" />
      </g>
      {/* Fenster */}
      <g fill={line}>
        <rect x="340" y="134" width="36" height="32" rx="3" /><rect x="384" y="134" width="36" height="32" rx="3" />
        <rect x="340" y="174" width="36" height="32" rx="3" /><rect x="384" y="174" width="36" height="32" rx="3" />
      </g>
      {/* Heizkörper */}
      <g fill="#e1392d">
        {[66, 118, 170, 222, 274].map((x) => <rect key={x} x={x} y="282" width="44" height="200" rx="18" />)}
        <rect x="66" y="300" width="252" height="22" /><rect x="66" y="440" width="252" height="22" />
      </g>
      {/* Wärmewellen */}
      <g fill="none" stroke="#e1392d" strokeWidth="14" strokeLinecap="round" className="heat">
        {[164, 206, 248].map((x, k) => <path key={x} style={{ animationDelay: `${k * 0.35}s` }} d={`M${x} 262 c-14 -12 14 -22 0 -34 c-14 -12 14 -22 0 -34`} />)}
      </g>
      {/* Tropfen */}
      <path className="drop" fill="#2b93dd" d="M444 292 C456 312 466 326 466 340 a22 22 0 0 1 -44 0 C422 326 432 312 444 292 Z" />
    </svg>
  )
}

/** Wie auf der Karte: das Zeichen auf der anthrazit Fläche mit schräger blauer Kante, daneben Name und Zeile. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="badge block h-[52px] w-[86px] shrink-0">
        <span className="flex h-full items-center pl-2"><HouseIcon size={62} /></span>
      </span>
      <span className="block leading-none">
        <span className={`block text-[26px] font-black leading-[0.9] [font-variation-settings:'wdth'_125] ${light ? 'text-white' : 'text-ink'}`}>SELLITA</span>
        <span className="mt-1.5 block font-['Open_Sans',sans-serif] text-[13px] font-semibold tracking-[0.12em]">
          <span className="text-signal">HEIZUNG</span> <span className="text-[#8b8f96]">&amp;</span> <span className="text-water">SANITÄR</span>
        </span>
      </span>
    </span>
  )
}
