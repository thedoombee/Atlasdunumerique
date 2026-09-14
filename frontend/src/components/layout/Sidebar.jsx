import {
  Antenna,
  BookOpen,
  Layers,
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
  carte: Layers,
  infrastructures: RadioTower,
  'zones-blanches': WifiOff,
  operateurs: Antenna,
  recommandations: Lightbulb,
  methodologie: BookOpen,
}

const GROUPES = [
  { titre: 'Principal', ids: ['ensemble', 'regions', 'prefectures'] },
  { titre: 'Données', ids: ['carte', 'infrastructures', 'zones-blanches'] },
  { titre: 'Pilotage', ids: ['operateurs', 'recommandations', 'methodologie'] },
]

const PAGES_DEFAUT = [
  { id: 'ensemble', label: "Vue d'ensemble" },
  { id: 'regions', label: 'Régions' },
  { id: 'prefectures', label: 'Préfectures' },
  { id: 'carte', label: 'Carte' },
  { id: 'infrastructures', label: 'Infrastructures' },
  { id: 'zones-blanches', label: 'Zones blanches' },
  { id: 'operateurs', label: 'Opérateurs' },
  { id: 'recommandations', label: 'Recommandations' },
  { id: 'methodologie', label: 'Méthodologie' },
]

export default function Sidebar({ pages = PAGES_DEFAUT, pageActive, onNaviguer }) {
  const parId = Object.fromEntries(pages.map((p) => [p.id, p]))
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200/70 bg-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <img src="/logo-togo-ai-lab.svg" alt="Togo AI Lab" className="h-10 w-auto shrink-0" />
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-stone-900">
            Togo AI Lab
          </h1>
          <p className="text-xs text-stone-500">Atlas du numérique · Togo</p>
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
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                actif
                  ? 'bg-primary-50 font-semibold text-primary-800'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
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
