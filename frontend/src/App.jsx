import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import VueEnsemble from './pages/VueEnsemble'
import Regions from './pages/Regions'
import Prefectures from './pages/Prefectures'
import Carte from './pages/Carte'
import Infrastructures from './pages/Infrastructures'
import ZonesBlanches from './pages/ZonesBlanches'
import Operateurs from './pages/Operateurs'
import Recommandations from './pages/Recommandations'
import Methodologie from './pages/Methodologie'

const PAGES = [
  { id: 'ensemble', label: "Vue d'ensemble", composant: VueEnsemble, description: 'Synthèse des indicateurs nationaux de couverture numérique.' },
  { id: 'regions', label: 'Régions', composant: Regions, description: 'Explorateur de métriques dans les cinq régions du Togo.' },
  { id: 'prefectures', label: 'Préfectures', composant: Prefectures, description: 'Scores, comparateur et classement des 39 préfectures.' },
  { id: 'carte', label: 'Carte', composant: Carte, description: 'Explorateur cartographique : couches, métriques et détails au clic.' },
  { id: 'infrastructures', label: 'Infrastructures', composant: Infrastructures, description: 'Registre géolocalisé des infrastructures numériques.' },
  { id: 'zones-blanches', label: 'Zones blanches', composant: ZonesBlanches, description: 'Préfectures sans couverture et priorisation.' },
  { id: 'operateurs', label: 'Opérateurs', composant: Operateurs, description: 'Volumes et parts de marché par opérateur.' },
  { id: 'recommandations', label: 'Recommandations', composant: Recommandations, description: 'Actions prioritaires pour réduire la fracture numérique.' },
  { id: 'methodologie', label: 'Méthodologie', composant: Methodologie, description: 'Sources, méthode d’estimation et limites.' },
]

export default function App() {
  const [pageActive, setPageActive] = useState('ensemble')

  const page = PAGES.find((element) => element.id === pageActive) || PAGES[0]
  const ComposantPage = page.composant

  return (
    <div className="flex min-h-screen bg-[#f6f6f4] text-stone-900">
      <Sidebar pages={PAGES} pageActive={pageActive} onNaviguer={setPageActive} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header titrePage={page.label} pages={PAGES} onNaviguer={setPageActive} />
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 p-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{page.label}</h2>
            <p className="mt-0.5 max-w-2xl text-sm text-stone-500">{page.description}</p>
          </div>
          <ComposantPage onNaviguer={setPageActive} />
        </main>
      </div>
    </div>
  )
}
