import {
  LayoutDashboard,
  Lightbulb,
  Map,
  MapPin,
  RadioTower,
  WifiOff,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const ICONES = {
  ensemble: LayoutDashboard,
  regions: Map,
  prefectures: MapPin,
  infrastructures: RadioTower,
  'zones-blanches': WifiOff,
  recommandations: Lightbulb,
}

const GROUPES = [
  { titre: 'Principal', ids: ['ensemble', 'regions', 'prefectures'] },
  { titre: 'Données', ids: ['infrastructures', 'zones-blanches'] },
  { titre: 'Pilotage', ids: ['recommandations'] },
]

const PAGES_DEFAUT = [
  { id: 'ensemble', label: "Vue d'ensemble" },
  { id: 'regions', label: 'Régions' },
  { id: 'prefectures', label: 'Préfectures' },
  { id: 'infrastructures', label: 'Infrastructures' },
  { id: 'zones-blanches', label: 'Zones blanches' },
  { id: 'recommandations', label: 'Recommandations' },
]

export default function Sidebar({ pages = PAGES_DEFAUT, pageActive, onNaviguer }) {
  const parId = Object.fromEntries(pages.map((p) => [p.id, p]))
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-stone-900 text-sm font-bold text-white">
          TG
        </span>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-stone-900">
            Atlas du numérique
          </h1>
          <p className="text-xs text-stone-500">Togo · Observatoire</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {GROUPES.map((groupe) => (
          <div key={groupe.titre}>
            <p className="etiquette-section px-3 pb-1.5">{groupe.titre}</p>
            <div className="flex flex-col gap-0.5">
              {groupe.ids.map((id) => {
                const page = parId[id]
                if (!page) return null
                const Icone = ICONES[id] || LayoutDashboard
                const actif = id === pageActive
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onNaviguer(id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      actif
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                    )}
                  >
                    <Icone className={cn('size-4', actif ? 'text-white' : 'text-stone-400')} />
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-100 p-4">
        <p className="text-[11px] text-stone-400">Édition 2026 · Données ouvertes</p>
      </div>
    </aside>
  )
}
