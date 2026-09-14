/** Anneau de progression façon J Kyorov : cercle + % central. */
export function AnneauProgres({ valeur = 0, max = 100, taille = 64, epaisseur = 7, couleur = '#0c7a3e', children }) {
  const ratio = Math.max(0, Math.min(1, Number(valeur) / (max || 1) || 0))
  const rayon = (taille - epaisseur) / 2
  const circonference = 2 * Math.PI * rayon
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90">
        <circle cx={taille / 2} cy={taille / 2} r={rayon} fill="none" stroke="#e7e5e4" strokeWidth={epaisseur} />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={`${ratio * circonference} ${circonference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
