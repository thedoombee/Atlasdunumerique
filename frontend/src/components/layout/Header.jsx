import { useMemo, useState } from 'react'
import { Bell, Download, Search } from 'lucide-react'
import { getIndicateursNationaux } from '../../services/api'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export default function Header({ titrePage = "Vue d'ensemble", pages = [], onNaviguer }) {
  const [recherche, setRecherche] = useState('')
  const [focus, setFocus] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)

  const suggestions = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return []
    return pages.filter((p) => p.label.toLowerCase().includes(terme)).slice(0, 5)
  }, [pages, recherche])

  const aller = (id) => {
    onNaviguer?.(id)
    setRecherche('')
    setFocus(false)
  }

  const exporter = async () => {
    setExportEnCours(true)
    try {
      const donnees = await getIndicateursNationaux()
      const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = 'atlas-numerique-togo-indicateurs.json'
      lien.click()
      URL.revokeObjectURL(url)
    } catch {
      /* silencieux : le dashboard reste utilisable hors-ligne partiel */
    } finally {
      setExportEnCours(false)
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-stone-200/80 bg-white/80 px-6 py-3 backdrop-blur">
      <p className="text-sm text-stone-400">
        Dashboard <span className="mx-1">›</span>{' '}
        <span className="font-medium text-stone-900">{titrePage}</span>
      </p>

      <div className="relative ml-auto w-64">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
        <Input
          className="rounded-full bg-stone-100 pl-9"
          placeholder="Rechercher une page…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) aller(suggestions[0].id)
          }}
        />
        {focus && suggestions.length > 0 ? (
          <div className="absolute top-11 right-0 left-0 z-20 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => aller(p.id)}
                className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Button taille="petit" onClick={exporter} disabled={exportEnCours}>
        <Download />
        {exportEnCours ? 'Export…' : 'Export'}
      </Button>
      <Button variante="contour" taille="icone" aria-label="Notifications">
        <Bell />
      </Button>
      <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
        AT
      </span>
      <Badge variante="succes" className="hidden xl:inline-flex">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Données à jour
      </Badge>
    </header>
  )
}
