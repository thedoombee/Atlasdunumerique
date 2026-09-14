import { Card, CardContenu } from './card'

export function KpiCarte({ icone: Icone, libelle, valeur, sousTexte, accent = false }) {
  return (
    <Card className={accent ? 'border-primary-200 bg-primary-50/50' : undefined}>
      <CardContenu className="flex items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="etiquette-section">{libelle}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-stone-900 tabular-nums">
            {valeur}
          </p>
          {sousTexte ? <p className="mt-1 text-xs text-stone-500">{sousTexte}</p> : null}
        </div>
        {Icone ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <Icone className="size-4" />
          </span>
        ) : null}
      </CardContenu>
    </Card>
  )
}

export function BarreProgression({ valeur, max = 100 }) {
  const ratio = Math.max(0, Math.min(100, (Number(valeur) / max) * 100 || 0))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${ratio}%` }} />
    </div>
  )
}
