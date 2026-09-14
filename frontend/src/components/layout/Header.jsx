import { useEffect, useState } from 'react'
import { Command as CommandeIcone, Download, Search } from 'lucide-react'
import { getIndicateursNationaux } from '../../services/api'
import { Button } from '../ui/button'
import { PaletteCommande } from '../ui/palette'

export default function Header({ titrePage = "Vue d'ensemble", pages = [], onNaviguer }) {
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)

  useEffect(() => {
    const auClavier = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOuverte((v) => !v)
      }
    }
    window.addEventListener('keydown', auClavier)
    return () => window.removeEventListener('keydown', auClavier)
  }, [])

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
    <header className="flex flex-wrap items-center gap-3 border-b border-stone-200/70 bg-white/80 px-6 py-3 backdrop-blur">
      <p className="text-sm text-stone-400">
        Dashboard <span className="mx-1">›</span>{' '}
        <span className="font-medium text-stone-900">{titrePage}</span>
      </p>

      <button
        type="button"
        onClick={() => setPaletteOuverte(true)}
        className="ml-auto flex w-64 items-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-200/70"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
          <CommandeIcone className="size-3" />K
        </kbd>
      </button>

      <Button taille="petit" onClick={exporter} disabled={exportEnCours}>
        <Download />
        {exportEnCours ? 'Export…' : 'Export'}
      </Button>
      <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
        AT
      </span>
      <span className="hidden text-xs text-stone-400 xl:inline">Données RGPH-5 · 2022</span>

      <PaletteCommande
        ouvert={paletteOuverte}
        onFermer={() => setPaletteOuverte(false)}
        pages={pages}
        onNaviguer={onNaviguer}
      />
    </header>
  )
}
