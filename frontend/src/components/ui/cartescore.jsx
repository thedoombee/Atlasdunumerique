import { Card, CardContenu } from './card'

/** Carte-score façon waxyweb : rang, titre, chiffre géant, mini-stats à micro-barres. */
export function CarteScore({ rang, titre, extra, geant, unite, stats = [], niveau }) {
  return (
    <Card className="overflow-hidden">
      <CardContenu className="space-y-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            {rang != null ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-[10px] font-bold text-white">
                {String(rang).padStart(2, '0')}
              </span>
            ) : null}
            <span className="truncate">{titre}</span>
          </p>
          {extra ? (
            <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
              {extra}
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{geant}</p>
          {unite ? <p className="mt-0.5 text-[11px] text-stone-400">{unite}</p> : null}
        </div>
        {niveau ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${niveau.couleur}1a`, color: niveau.couleur }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: niveau.couleur }} />
            {niveau.texte}
          </span>
        ) : null}
        {stats.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 border-t border-stone-100 pt-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-[11px] text-stone-400">{stat.label}</p>
                <p className="text-xs font-semibold tabular-nums">{stat.valeur}</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (stat.ratio || 0) * 100)}%`, backgroundColor: stat.couleur }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContenu>
    </Card>
  )
}
