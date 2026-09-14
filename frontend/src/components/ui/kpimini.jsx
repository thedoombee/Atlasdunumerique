import { Card, CardContenu } from './card'
import { cn } from '../../lib/utils'

const TEINTES = {
  vert: 'bg-emerald-100 text-emerald-700',
  bleu: 'bg-sky-100 text-sky-700',
  jaune: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
  rose: 'bg-pink-100 text-pink-700',
  turquoise: 'bg-teal-100 text-teal-700',
}

/** Mini-carte KPI façon Panacea : icône pastel, label, gros chiffre, sous-texte. */
export function KpiMini({ icone: Icone, label, sousLabel, valeur, sousTexte, teinte = 'vert', className }) {
  return (
    <Card className={cn('', className)}>
      <CardContenu className="space-y-2 pt-4">
        <div className="flex items-center gap-2.5">
          {Icone ? (
            <span className={cn('flex size-9 items-center justify-center rounded-xl', TEINTES[teinte] || TEINTES.vert)}>
              <Icone className="size-4" />
            </span>
          ) : null}
          <div>
            <p className="text-sm font-semibold text-stone-900">{label}</p>
            {sousLabel ? <p className="text-[11px] text-stone-400">{sousLabel}</p> : null}
          </div>
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{valeur}</p>
        {sousTexte ? <p className="text-[11px] text-stone-500">{sousTexte}</p> : null}
      </CardContenu>
    </Card>
  )
}
