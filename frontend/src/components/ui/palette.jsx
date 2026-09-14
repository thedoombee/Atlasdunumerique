import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { LayoutDashboard, Lightbulb, Map, MapPin, RadioTower, WifiOff } from 'lucide-react'
import { getIndicateursParPrefecture, getIndicateursParRegion } from '../../services/api'

const ICONES = {
  ensemble: LayoutDashboard,
  regions: Map,
  prefectures: MapPin,
  infrastructures: RadioTower,
  'zones-blanches': WifiOff,
  recommandations: Lightbulb,
  carte: Map,
  operateurs: RadioTower,
  methodologie: Lightbulb,
}

/** Palette de commande globale façon ⌘K : pages, régions, préfectures. */
export function PaletteCommande({ ouvert, onFermer, pages = [], onNaviguer }) {
  const [regions, setRegions] = useState([])
  const [prefectures, setPrefectures] = useState([])

  useEffect(() => {
    if (!ouvert || regions.length > 0) return
    let annule = false
    Promise.all([getIndicateursParRegion().catch(() => []), getIndicateursParPrefecture().catch(() => [])])
      .then(([regs, prefs]) => {
        if (annule) return
        setRegions(regs || [])
        setPrefectures(prefs || [])
      })
    return () => {
      annule = true
    }
  }, [ouvert, regions.length])

  const aller = (id) => {
    onNaviguer?.(id)
    onFermer?.()
  }

  const allerPrefecture = (nom) => {
    try {
      sessionStorage.setItem('atlas:recherche-prefecture', nom)
    } catch {
      /* stockage indisponible : navigation simple */
    }
    aller('prefectures')
  }

  return (
    <Command.Dialog
      open={ouvert}
      onOpenChange={(v) => { if (!v) onFermer?.() }}
      label="Recherche globale"
      className="fixed top-[18%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl outline-none"
      overlayClassName="fixed inset-0 z-50 bg-stone-950/25"
    >
      <Command.Input
        placeholder="Rechercher une page, une région, une préfecture…"
        className="w-full border-b border-stone-100 px-5 py-4 text-sm outline-none placeholder:text-stone-400"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-4 py-6 text-center text-sm text-stone-400">
          Aucun résultat.
        </Command.Empty>
        <Command.Group heading="Pages" className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          {pages.map((page) => {
            const Icone = ICONES[page.id] || LayoutDashboard
            return (
              <Command.Item
                key={page.id}
                value={`page ${page.label}`}
                onSelect={() => aller(page.id)}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 data-[selected=true]:bg-stone-100"
              >
                <Icone className="size-4 text-stone-400" />
                {page.label}
              </Command.Item>
            )
          })}
        </Command.Group>
        <Command.Group heading="Régions" className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          {regions.map((r) => (
            <Command.Item
              key={r.region}
              value={`région ${r.region}`}
              onSelect={() => aller('regions')}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 data-[selected=true]:bg-stone-100"
            >
              <Map className="size-4 text-stone-400" />
              {r.region}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Préfectures" className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          {prefectures.map((p) => (
            <Command.Item
              key={p.prefecture}
              value={`préfecture ${p.prefecture} ${p.region || ''}`}
              onSelect={() => allerPrefecture(p.prefecture)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 data-[selected=true]:bg-stone-100"
            >
              <MapPin className="size-4 text-stone-400" />
              {p.prefecture}
              <span className="ml-auto text-xs text-stone-400">{p.region}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
