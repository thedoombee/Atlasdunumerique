import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { getIndicateursParPrefecture } from '../services/api'
import { formaterKm2, formaterNombre, formaterPourcent, formaterPriorite } from '../utils/format'
import { Button } from '../components/ui/button'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { CarteScore } from '../components/ui/cartescore'
import { Input, Label, Select } from '../components/ui/input'
import { exporterCsv } from '../lib/csv'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'
import { cn } from '../lib/utils'

function couleurNiveau(niveau) {
  const texte = String(niveau || '').toLowerCase()
  if (texte.includes('haute') || texte.includes('urgente') || texte.includes('élev')) return '#b91c1c'
  if (texte.includes('moyenne')) return '#f59e0b'
  return '#0c7a3e'
}

export default function Prefectures() {
  const [prefectures, setPrefectures] = useState([])
  const [recherche, setRecherche] = useState('')
  const [region, setRegion] = useState('')
  const [choixA, setChoixA] = useState('')
  const [choixB, setChoixB] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getIndicateursParPrefecture()
      .then((donnees) => {
        if (!annule) setPrefectures(donnees || [])
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de charger les indicateurs par préfecture.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const regions = useMemo(
    () => [...new Set(prefectures.map((p) => p.region).filter(Boolean))].sort(),
    [prefectures],
  )

  const totaux = useMemo(() => {
    const popNonCouverte = prefectures.reduce((s, p) => s + (Number(p.population_non_couverte) || 0), 0)
    const scoreMax = Math.max(0, ...prefectures.map((p) => Number(p.score_priorite) || 0))
    const haute = prefectures.filter((p) => String(p.niveau_priorite).toLowerCase().includes('haute')).length
    const maxPop = Math.max(1, ...prefectures.map((p) => Number(p.population) || 0))
    const maxCouv = Math.max(1, ...prefectures.map((p) => Number(p.couverture_combinee_pct) || 0))
    const maxAgents = Math.max(1, ...prefectures.map((p) => Number(p.n_agents_mobile_money) || 0))
    return { popNonCouverte, scoreMax, haute, maxPop, maxCouv, maxAgents }
  }, [prefectures])

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    return prefectures
      .filter((p) => {
        if (region && p.region !== region) return false
        if (!terme) return true
        return String(p.prefecture || '').toLowerCase().includes(terme)
      })
      .sort((a, b) => (b.score_priorite || 0) - (a.score_priorite || 0))
  }, [prefectures, recherche, region])

  const prefectureA = prefectures.find((p) => p.prefecture === choixA) || filtrees[0] || null
  const prefectureB = prefectures.find((p) => p.prefecture === choixB) || filtrees[1] || filtrees[0] || null

  const lignesComparaison = prefectureA && prefectureB ? [
    { label: 'Population', a: Number(prefectureA.population) || 0, b: Number(prefectureB.population) || 0, format: (v) => formaterNombre(v) },
    { label: 'Pop. non couverte', a: Number(prefectureA.population_non_couverte) || 0, b: Number(prefectureB.population_non_couverte) || 0, format: (v) => formaterNombre(v) },
    { label: 'Couverture combinée', a: Number(prefectureA.couverture_combinee_pct) || 0, b: Number(prefectureB.couverture_combinee_pct) || 0, format: (v) => formaterPourcent(v) },
    { label: 'Agents Mobile Money', a: Number(prefectureA.n_agents_mobile_money) || 0, b: Number(prefectureB.n_agents_mobile_money) || 0, format: (v) => formaterNombre(v) },
    { label: 'Score de priorité', a: Number(prefectureA.score_priorite) || 0, b: Number(prefectureB.score_priorite) || 0, format: (v) => formaterNombre(v) },
  ] : []
  const maxComparaison = Math.max(1, ...lignesComparaison.flatMap((l) => [l.a, l.b]))

  if (chargement) return <ChargementCartes nombre={6} />
  if (erreur) return <ErreurCarte message={erreur} />

  return (
    <section className="space-y-4">
      <Card>
        <CardEntete>
          <CardTitre>Comparateur de préfectures</CardTitre>
          <CardDescription>Deux préfectures face à face, cinq métriques.</CardDescription>
        </CardEntete>
        <CardContenu>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Préfecture A (vert)</Label>
              <Select value={choixA} onChange={(e) => setChoixA(e.target.value)}>
                <option value="">Auto (1re du classement)</option>
                {prefectures.map((p) => (
                  <option key={p.prefecture} value={p.prefecture}>{p.prefecture} · {p.region}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Préfecture B (gris)</Label>
              <Select value={choixB} onChange={(e) => setChoixB(e.target.value)}>
                <option value="">Auto (2e du classement)</option>
                {prefectures.map((p) => (
                  <option key={p.prefecture} value={p.prefecture}>{p.prefecture} · {p.region}</option>
                ))}
              </Select>
            </div>
          </div>
          {prefectureA && prefectureB ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary-600" />{prefectureA.prefecture}</span>
                <span className="text-stone-300">vs</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-stone-300" />{prefectureB.prefecture}</span>
              </div>
              {lignesComparaison.map((ligne) => (
                <div key={ligne.label}>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="font-medium text-stone-500">{ligne.label}</span>
                    <span className="tabular-nums">
                      <strong className="text-primary-700">{ligne.format(ligne.a)}</strong>
                      <span className="text-stone-300"> · </span>
                      <span className="text-stone-500">{ligne.format(ligne.b)}</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-primary-600" style={{ width: `${(ligne.a / maxComparaison) * 100}%` }} />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-stone-300" style={{ width: `${(ligne.b / maxComparaison) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContenu>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContenu className="pt-4">
            <p className="text-[11px] text-stone-400">Préfectures suivies</p>
            <p className="text-5xl font-semibold tracking-tight tabular-nums">{prefectures.length}</p>
            <p className="mt-1 text-[11px] text-stone-400">dont <strong className="text-red-600">{totaux.haute}</strong> en priorité haute</p>
          </CardContenu>
        </Card>
        <Card>
          <CardContenu className="pt-4">
            <p className="text-[11px] text-stone-400">Population non couverte</p>
            <p className="text-5xl font-semibold tracking-tight tabular-nums">{formaterNombre(totaux.popNonCouverte)}</p>
            <p className="mt-1 text-[11px] text-stone-400">habitants hors couverture estimée</p>
          </CardContenu>
        </Card>
        <Card>
          <CardContenu className="pt-4">
            <p className="text-[11px] text-stone-400">Score maximal</p>
            <p className="text-5xl font-semibold tracking-tight tabular-nums">{formaterNombre(totaux.scoreMax)}</p>
            <p className="mt-1 text-[11px] text-stone-400">urgence la plus élevée relevée</p>
          </CardContenu>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRegion('')}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors',
            region === '' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-100',
          )}
        >
          Toutes
        </button>
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(region === r ? '' : r)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors',
              region === r ? 'bg-primary-600 text-white' : 'bg-white text-stone-500 hover:bg-stone-100',
            )}
          >
            {r}
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
            exporterCsv('prefectures-selection.csv', filtrees, [
              { label: 'Préfecture', cle: 'prefecture' },
              { label: 'Région', cle: 'region' },
              { label: 'Population', cle: 'population' },
              { label: 'Superficie km2', cle: 'area_km2' },
              { label: 'Densité', cle: 'pop_density' },
              { label: 'Agences', cle: 'n_agences' },
              { label: 'Agents Mobile Money', cle: 'n_agents_mobile_money' },
              { label: 'Couverture %', cle: 'couverture_combinee_pct' },
              { label: 'Pop. non couverte', cle: 'population_non_couverte' },
              { label: 'Score', cle: 'score_priorite' },
              { label: 'Niveau', cle: 'niveau_priorite' },
            ])
          }
        >
          <Download />
          CSV ({filtrees.length})
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtrees.map((p, index) => (
          <CarteScore
            key={p.prefecture}
            rang={index + 1}
            titre={p.prefecture}
            extra={p.region}
            geant={formaterNombre(p.score_priorite)}
            unite={`score de priorité · ${formaterKm2(p.area_km2)}`}
            niveau={{ texte: formaterPriorite(p.niveau_priorite), couleur: couleurNiveau(p.niveau_priorite) }}
            stats={[
              { label: 'Population', valeur: formaterNombre(p.population), ratio: (Number(p.population) || 0) / totaux.maxPop, couleur: '#0c7a3e' },
              { label: 'Couverture', valeur: formaterPourcent(p.couverture_combinee_pct), ratio: (Number(p.couverture_combinee_pct) || 0) / totaux.maxCouv, couleur: '#38bdf8' },
              { label: 'Agents Mob', valeur: formaterNombre(p.n_agents_mobile_money), ratio: (Number(p.n_agents_mobile_money) || 0) / totaux.maxAgents, couleur: '#8b5cf6' },
            ]}
          />
        ))}
      </div>
      {filtrees.length === 0 ? (
        <Card>
          <CardContenu className="pt-5 text-center text-sm text-stone-400">
            Aucune préfecture ne correspond à ces filtres.
          </CardContenu>
        </Card>
      ) : null}
    </section>
  )
}
