import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Gauge, MapPin, Search, Users, WifiOff } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getZonesBlanches, getZonesBlanchesResume } from '../services/api'
import { formaterNombre, formaterPourcent, formaterPriorite } from '../utils/format'
import { Button } from '../components/ui/button'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { CarteScore } from '../components/ui/cartescore'
import { Input } from '../components/ui/input'
import { exporterCsv } from '../lib/csv'
import { JaugeSegments } from '../components/ui/jauge'
import { KpiMini } from '../components/ui/kpimini'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'
import { cn } from '../lib/utils'

function couleurNiveau(niveau) {
  const texte = String(niveau || '').toLowerCase()
  if (texte.includes('haute') || texte.includes('urgente') || texte.includes('élev')) return '#b91c1c'
  return '#0c7a3e'
}

export default function ZonesBlanches() {
  const [items, setItems] = useState([])
  const [resume, setResume] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [metriqueId, setMetriqueId] = useState('score')

  const METRIQUES = {
    score: { label: 'Score', unite: 'score de priorité zone blanche', cle: (z) => Number(z.score_priorite) || 0, format: (v) => formaterNombre(v) },
    pop: { label: 'Pop. non couverte', unite: 'habitants sans couverture', cle: (z) => Number(z.population_non_couverte) || 0, format: (v) => formaterNombre(v) },
    agences: { label: 'Agences', unite: 'agences dans la préfecture', cle: (z) => Number(z.n_agences) || 0, format: (v) => formaterNombre(v) },
  }
  const metrique = METRIQUES[metriqueId] || METRIQUES.score

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')
    try {
      const [donnees, resumeDonnees] = await Promise.all([
        getZonesBlanches(),
        getZonesBlanchesResume().catch(() => null),
      ])
      setItems(donnees.items || [])
      setResume(resumeDonnees)
    } catch (e) {
      setErreur('Impossible de charger les zones blanches.')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const niveaux = useMemo(
    () => [...new Set(items.map((z) => z.niveau_priorite).filter(Boolean))],
    [items],
  )

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    return [...items]
      .filter((z) => {
        if (filtre && z.niveau_priorite !== filtre) return false
        if (!terme) return true
        return `${z.prefecture || ''} ${z.region || ''}`.toLowerCase().includes(terme)
      })
      .sort((a, b) => metrique.cle(b) - metrique.cle(a))
  }, [items, filtre, recherche, metrique])

  const populationNonCouverte = useMemo(
    () => filtrees.reduce((s, z) => s + (Number(z.population_non_couverte) || 0), 0),
    [filtrees],
  )
  const maxPop = useMemo(
    () => Math.max(1, ...filtrees.map((z) => Number(z.population_non_couverte) || 0)),
    [filtrees],
  )
  const maxCouv = 100

  const donneesRadar = useMemo(() => {
    const top = [...items]
      .sort((a, b) => (b.score_priorite || 0) - (a.score_priorite || 0))
      .slice(0, 5)
    const maxPopTous = Math.max(1, ...top.map((z) => Number(z.population_non_couverte) || 0))
    return top.map((z) => ({
      sujet: z.prefecture,
      Score: Math.min(100, Number(z.score_priorite) || 0),
      'Pop. non couverte': Math.round(((Number(z.population_non_couverte) || 0) / maxPopTous) * 100),
      'Non-couverture': Math.min(100, Math.max(0, 100 - (Number(z.couverture_agence_pct) || 0))),
    }))
  }, [items])

  const scoreMoyen = Number(resume?.score_moyen || 0)

  if (chargement) return <ChargementCartes nombre={4} />
  if (erreur) return <ErreurCarte message={erreur} onReessayer={charger} />

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMini icone={MapPin} label="Préfectures" sousLabel="analysées" valeur={formaterNombre(resume?.total_prefectures ?? items.length)} sousTexte="couverture estimée par tampons" teinte="vert" />
        <KpiMini icone={WifiOff} label="Priorité haute" sousLabel="préfectures critiques" valeur={formaterNombre(resume?.repartition_priorite?.Haute ?? 0)} sousTexte="intervention urgente requise" teinte="rose" />
        <KpiMini icone={Users} label="Non couverts" sousLabel="sélection courante" valeur={formaterNombre(populationNonCouverte)} sousTexte="habitants sans couverture" teinte="jaune" />
        <KpiMini icone={Gauge} label="Score moyen" sousLabel="toutes préfectures" valeur={formaterNombre(resume?.score_moyen)} sousTexte={`max ${formaterNombre(resume?.score_max)}`} teinte="bleu" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardEntete>
            <CardTitre>Radar des 5 préfectures critiques</CardTitre>
            <CardDescription>Indices 0-100 : score, population non couverte relative, non-couverture.</CardDescription>
          </CardEntete>
          <CardContenu>
            <div className="mx-auto h-80 max-w-xl">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={donneesRadar} outerRadius="72%">
                  <PolarGrid stroke="#d6d3d1" strokeDasharray="2 4" />
                  <PolarAngleAxis dataKey="sujet" tick={{ fontSize: 11, fill: '#57534e' }} />
                  <Radar name="Score" dataKey="Score" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Pop. non couverte" dataKey="Pop. non couverte" stroke="#0c7a3e" fill="#0c7a3e" fillOpacity={0.18} strokeWidth={2} />
                  <Radar name="Non-couverture" dataKey="Non-couverture" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 border-t border-stone-100 pt-3">
              {[
                { nom: 'Score', couleur: '#b91c1c' },
                { nom: 'Pop. non couverte', couleur: '#0c7a3e' },
                { nom: 'Non-couverture', couleur: '#f59e0b' },
              ].map((leg) => (
                <span key={leg.nom} className="flex items-center gap-1.5 text-xs text-stone-600">
                  <span className="h-2 w-4 rounded-full opacity-70" style={{ backgroundColor: leg.couleur }} />
                  {leg.nom}
                </span>
              ))}
            </div>
          </CardContenu>
        </Card>

        <Card className="lg:col-span-2">
          <CardEntete>
            <p className="etiquette-section">Urgence moyenne</p>
            <CardTitre className="mt-1 text-base">Pression nationale</CardTitre>
          </CardEntete>
          <CardContenu className="flex flex-col items-center">
            <JaugeSegments
              taille={168}
              segments={[
                { valeur: scoreMoyen, couleur: '#b91c1c' },
                { valeur: Math.max(0, 100 - scoreMoyen), couleur: '#e7e5e4' },
              ]}
            />
            <p className="-mt-9 text-3xl font-semibold tracking-tight tabular-nums">{formaterNombre(scoreMoyen)}</p>
            <p className="mt-1 text-xs text-stone-400">score moyen national / 100</p>
            <ul className="mt-4 w-full space-y-2 border-t border-stone-100 pt-3">
              {(resume ? Object.entries(resume.repartition_priorite || {}) : []).map(([nom, valeur]) => (
                <li key={nom} className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full" style={{ backgroundColor: couleurNiveau(nom) }} />
                  <span className="flex-1 font-medium text-stone-700">Priorité {formaterPriorite(nom)}</span>
                  <span className="font-semibold tabular-nums">{valeur} préfecture(s)</span>
                </li>
              ))}
            </ul>
          </CardContenu>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-stone-500">Métrique :</span>
        {Object.entries(METRIQUES).map(([id, m]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMetriqueId(id)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors',
              metriqueId === id ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-100',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre('')}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors',
            filtre === '' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-100',
          )}
        >
          Tous
        </button>
        {niveaux.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setFiltre(filtre === n ? '' : n)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors',
              filtre === n ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-100',
            )}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: couleurNiveau(n) }} />
            {formaterPriorite(n)}
          </button>
        ))}
        <div className="relative ml-auto w-52">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            className="rounded-full bg-white pl-9"
            placeholder="Rechercher…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <Button
          variante="contour"
          taille="petit"
          onClick={() =>
            exporterCsv('zones-blanches-selection.csv', filtrees, [
              { label: 'Préfecture', cle: 'prefecture' },
              { label: 'Région', cle: 'region' },
              { label: 'Population', cle: 'population' },
              { label: 'Pop. non couverte', cle: 'population_non_couverte' },
              { label: 'Score', cle: 'score_priorite' },
              { label: 'Couverture agences %', cle: 'couverture_agence_pct' },
              { label: 'Agences', cle: 'n_agences' },
              { label: 'Agents Mobile Money', cle: 'n_agents_mobile_money' },
              { label: 'Niveau', cle: 'niveau_priorite' },
            ])
          }
        >
          <Download />
          CSV ({filtrees.length})
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtrees.map((z, index) => (
          <CarteScore
            key={z.prefecture}
            rang={index + 1}
            titre={z.prefecture}
            extra={z.region}
            geant={metrique.format(metrique.cle(z))}
            unite={metrique.unite}
            niveau={{ texte: formaterPriorite(z.niveau_priorite), couleur: couleurNiveau(z.niveau_priorite) }}
            stats={[
              { label: 'Non couverts', valeur: formaterNombre(z.population_non_couverte), ratio: (Number(z.population_non_couverte) || 0) / maxPop, couleur: '#b91c1c' },
              { label: 'Couverture', valeur: formaterPourcent(z.couverture_agence_pct), ratio: (Number(z.couverture_agence_pct) || 0) / maxCouv, couleur: '#38bdf8' },
              { label: 'Agences', valeur: formaterNombre(z.n_agences), ratio: (Number(z.n_agences) || 0) / Math.max(1, ...filtrees.map((f) => Number(f.n_agences) || 0)), couleur: '#0c7a3e' },
            ]}
          />
        ))}
      </div>
      {filtrees.length === 0 ? (
        <Card>
          <CardContenu className="pt-5 text-center text-sm text-stone-400">
            Aucune zone ne correspond à ces filtres.
          </CardContenu>
        </Card>
      ) : null}
    </section>
  )
}
