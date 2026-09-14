import { useEffect, useState } from 'react'
import { BookOpen, Database, Info, MapPinned } from 'lucide-react'
import { getZonesBlanches } from '../services/api'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { KpiMini } from '../components/ui/kpimini'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'

const SOURCES = [
  { nom: 'Agences Moov', detail: '28 points géolocalisés (GeoJSON brut)' },
  { nom: 'Agences Togocom', detail: '62 points géolocalisés (GeoJSON brut)' },
  { nom: 'Agences Telecom', detail: '90 points géolocalisés (GeoJSON brut)' },
  { nom: 'Agents mobile money', detail: '19 788 points géolocalisés (GeoJSON brut)' },
  { nom: 'Datacenters', detail: '3 établissements géolocalisés (GeoJSON brut)' },
  { nom: 'Population RGPH5 2022', detail: '39 préfectures, référence nationale' },
  { nom: 'Limites admin', detail: '5 régions (admin1), 40 préfectures (admin2)' },
]

export default function Methodologie() {
  const [methodologie, setMethodologie] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getZonesBlanches()
      .then((donnees) => {
        if (!annule) setMethodologie(donnees.methodology?.text || '')
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de charger la méthodologie depuis l’API.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  if (chargement) return <ChargementCartes nombre={3} />
  if (erreur) return <ErreurCarte message={erreur} />

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiMini icone={Database} label="Objets analysés" sousLabel="registre consolidé" valeur="19 881" sousTexte="infrastructures géolocalisées" teinte="vert" />
        <KpiMini icone={MapPinned} label="Mailles" sousLabel="découpage d’étude" valeur="5 + 39" sousTexte="régions et préfectures" teinte="bleu" />
        <KpiMini icone={BookOpen} label="Référence démo" sousLabel="recensement" valeur="RGPH5" sousTexte="population 2022 par préfecture" teinte="jaune" />
      </div>

      <Card>
        <CardEntete>
          <CardTitre>Comment la couverture est estimée</CardTitre>
          <CardDescription>Texte officiel servi par l’API, non une mesure radio réelle.</CardDescription>
        </CardEntete>
        <CardContenu>
          <p className="max-w-3xl text-sm leading-relaxed text-stone-600">{methodologie}</p>
        </CardContenu>
      </Card>

      <Card>
        <CardEntete>
          <CardTitre>Sources de données</CardTitre>
          <CardDescription>Fichiers bruts et de référence utilisés par le backend.</CardDescription>
        </CardEntete>
        <CardContenu>
          <ul className="divide-y divide-stone-100">
            {SOURCES.map((source) => (
              <li key={source.nom} className="flex items-center gap-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                  <Info className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">{source.nom}</p>
                  <p className="truncate text-xs text-stone-400">{source.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContenu>
      </Card>
    </section>
  )
}
