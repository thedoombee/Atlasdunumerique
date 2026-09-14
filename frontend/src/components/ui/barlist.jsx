import { formaterNombre } from '../../utils/format'

const PALETTE = ['#0c7a3e', '#65a30d', '#4da26e', '#f59e0b', '#8b5cf6', '#ec4899', '#38bdf8', '#94a3b8']

export function couleurPalette(index) {
  return PALETTE[index % PALETTE.length]
}

/** Liste classée façon Tremor : label, barre proportionnelle, valeur. */
export function BarList({ donnees = [], couleur, formatValeur, maxLignes }) {
  const lignes = (maxLignes ? donnees.slice(0, maxLignes) : donnees) || []
  const max = Math.max(1, ...lignes.map((l) => Number(l.valeur) || 0))
  return (
    <ul className="space-y-2.5">
      {lignes.map((ligne, index) => {
        const teinte = ligne.couleur || couleur || couleurPalette(index)
        const ratio = (Math.max(0, Number(ligne.valeur) || 0) / max) * 100
        return (
          <li key={ligne.nom} className="flex items-center gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-stone-100 text-[10px] font-bold text-stone-500">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-stone-800">{ligne.nom}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatValeur ? formatValeur(ligne.valeur) : formaterNombre(ligne.valeur)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${ratio}%`, backgroundColor: teinte }}
                />
              </div>
            </div>
          </li>
        )
      })}
      {lignes.length === 0 ? (
        <li className="py-4 text-center text-sm text-stone-400">Aucune donnée.</li>
      ) : null}
    </ul>
  )
}
