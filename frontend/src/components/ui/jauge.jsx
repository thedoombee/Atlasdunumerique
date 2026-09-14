/** Jauge segmentée façon Flux : plusieurs arcs colorés + valeur centrale. */
export function JaugeSegments({ segments = [], taille = 150 }) {
  const total = Math.max(1, segments.reduce((s, g) => s + (Number(g.valeur) || 0), 0))
  const rayon = 52
  const circonference = Math.PI * rayon
  let curseur = 0
  const arcs = segments.map((segment) => {
    const longueur = (Math.max(0, Number(segment.valeur) || 0) / total) * circonference
    const debut = curseur
    curseur += longueur
    return { ...segment, debut, longueur }
  })
  return (
    <svg width={taille} height={taille * 0.62} viewBox="0 6 120 66" className="overflow-visible">
      <path d="M 8 58 A 52 52 0 0 1 112 58" fill="none" stroke="#e7e5e4" strokeWidth="11" strokeLinecap="round" />
      {arcs.map((arc, i) => (
        <path
          key={i}
          d="M 8 58 A 52 52 0 0 1 112 58"
          fill="none"
          stroke={arc.couleur}
          strokeWidth="11"
          strokeLinecap={i === arcs.length - 1 ? 'round' : 'butt'}
          strokeDasharray={`${Math.max(0, arc.longueur - 2)} ${circonference}`}
          strokeDashoffset={-arc.debut}
        />
      ))}
    </svg>
  )
}

/** Jauge en arc semi-circulaire façon Orvia : valeur 0-100, aiguille + chiffre. */
export function JaugeArc({ valeur = 0, taille = 120, couleur = '#0c7a3e', children }) {
  const borne = Math.max(0, Math.min(100, Number(valeur) || 0))
  const rayon = 52
  const circonference = Math.PI * rayon
  const angle = (borne / 100) * 180 - 90
  const rad = (angle * Math.PI) / 180
  const ax = 60 + 44 * Math.cos(rad)
  const ay = 58 + 44 * Math.sin(rad)
  return (
    <svg width={taille} height={taille * 0.62} viewBox="0 6 120 66" className="overflow-visible">
      <path d="M 8 58 A 52 52 0 0 1 112 58" fill="none" stroke="#e7e5e4" strokeWidth="9" strokeLinecap="round" />
      <path
        d="M 8 58 A 52 52 0 0 1 112 58"
        fill="none"
        stroke={couleur}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(borne / 100) * circonference} ${circonference}`}
      />
      <line x1="60" y1="58" x2={ax} y2={ay} stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="60" cy="58" r="4" fill="#1c1917" />
      {children}
    </svg>
  )
}
