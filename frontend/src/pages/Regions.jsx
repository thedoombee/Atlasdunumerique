import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getIndicateursParRegion } from '../services/api'
import { formaterNombre } from '../utils/format'
import { Download } from 'lucide-react'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { CarteScore } from '../components/ui/cartescore'
import { PillDelta } from '../components/ui/delta'
import { AnneauProgres } from '../components/ui/anneau'
import { Button } from '../components/ui/button'
import { exporterCsv } from '../lib/csv'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'
import { cn } from '../lib/utils'

const METRIQUES = [
  { id: 'population', label: 'Population', unite: 'habitants', cle: (r) => Number(r.population) || 0, format: (v) => formaterNombre(v) },
  { id: 'agents', label: 'Agents Mob', unite: 'agents mobile money', cle: (r) => Number(r.n_agents_mobile_money) || 0, format: (v) => formaterNombre(v) },
  { id: 'agences', label: 'Agences', unite: 'agences', cle: (r) => Number(r.n_agences) || 0, format: (v) => formaterNombre(v) },
  { id: 'infra', label: 'Infrastructures', unite: 'infrastructures', cle: (r) => Number(r.n_infrastructures) || 0, format: (v) => formaterNombre(v) },
  { id: 'densite', label: 'Densité', unite: 'hab/km²', cle: (r) => Number(r.pop_density) || 0, format: (v) => formaterNombre(v) },
  { id: 'adequation', label: 'Adéquation', unite: 'agents / 1000 hab.', cle: (r) => Number(r.agents_par_1000_habitants) || 0, format: (v) => formaterNombre(v) },
]

export default function Regions() {
  const [regions, setRegions] = useState([])
  const [metriqueId, setMetriqueId] = useState('population')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getIndicateursParRegion()
      .then((donnees) => {
        if (!annule) setRegions(donnees || [])
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de charger les indicateurs par région.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const metrique = METRIQUES.find((m) => m.id === metriqueId) || METRIQUES[0]

  const moyenne = useMemo(() => {
    if (regions.length === 0) return 0
    return regions.reduce((s, r) => s + metrique.cle(r), 0) / regions.length
  }, [regions, metrique])

  const triees = useMemo(
    () => [...regions].sort((a, b) => metrique.cle(b) - metrique.cle(a)),
    [regions, metrique],
  )

  const barres = useMemo(
    () => triees.map((r) => ({ nom: r.region, valeur: metrique.cle(r) })),
    [triees, metrique],
  )
  const maxBarre = Math.max(1, ...barres.map((b) => b.valeur))

  const totalAgents = useMemo(
    () => regions.reduce((s, r) => s + (Number(r.n_agents_mobile_money) || 0), 0),
    [regions],
  )
  const maxAgents = Math.max(1, ...regions.map((r) => Number(r.n_agents_mobile_money) || 0))
  const maxAgences = Math.max(1, ...regions.map((r) => Number(r.n_agences) || 0))
  const maxInfra = Math.max(1, ...regions.map((r) => Number(r.n_infrastructures) || 0))

  if (chargement) return <ChargementCartes nombre={5} />
  if (erreur) return <ErreurCarte message={erreur} />

  return (
    <section className="space-y-4">
      <Card>
        <CardContenu className="flex flex-wrap items-center gap-2 pt-4">
          <span className="mr-1 text-xs font-medium text-stone-500">Métrique :</span>
          {METRIQUES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetriqueId(m.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                metriqueId === m.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              {m.label}
            </button>
          ))}
        </CardContenu>
      </Card>

      <Card>
        <CardEntete className="flex-row items-start justify-between">
          <div>
            <CardTitre>{metrique.label} par région</CardTitre>
            <CardDescription>
              Moyenne nationale : {metrique.format(moyenne)} {metrique.unite} · max en vert.
            </CardDescription>
          </div>
          <PillDelta valeur={maxBarre} reference={moyenne} />
        </CardEntete>
        <CardContenu>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barres} margin={{ top: 22, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="nom" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e7e5e4' }} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => metrique.format(v)} />
                <Tooltip formatter={(v) => [metrique.format(Number(v)), metrique.label]} />
                <Bar dataKey="valeur" radius={[8, 8, 4, 4]}>
                  {barres.map((b) => (
                    <Cell key={b.nom} fill={b.valeur === maxBarre ? '#0c7a3e' : '#d6d3d1'} />
                  ))}
                  <LabelList dataKey="valeur" position="top" formatter={(v) => metrique.format(Number(v))} style={{ fontSize: 11, fontWeight: 700, fill: '#57534e' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContenu>
      </Card>

      <Card>
        <CardEntete className="flex-row items-center justify-between">
          <div>
            <CardTitre>Parts du réseau national</CardTitre>
            <CardDescription>Anneaux = part des agents mobile money par région.</CardDescription>
          </div>
          <Button
            variante="contour"
            taille="petit"
            onClick={() =>
              exporterCsv('regions-indicateurs.csv', triees, [
                { label: 'Région', cle: 'region' },
                { label: 'Population', cle: 'population' },
                { label: 'Superficie km2', cle: 'area_km2' },
                { label: 'Densité', cle: 'pop_density' },
                { label: 'Agences', cle: 'n_agences' },
                { label: 'Agents Mobile Money', cle: 'n_agents_mobile_money' },
                { label: 'Infrastructures', cle: 'n_infrastructures' },
              ])
            }
          >
            <Download />
            CSV
          </Button>
        </CardEntete>
        <CardContenu>
          <div className="flex flex-wrap items-start justify-around gap-4">
            {triees.map((r) => {
              const part = totalAgents ? ((Number(r.n_agents_mobile_money) || 0) / totalAgents) * 100 : 0
              return (
                <div key={r.region} className="flex flex-col items-center gap-1">
                  <AnneauProgres valeur={part} taille={76} couleur="#0c7a3e">
                    <span className="text-sm font-bold tabular-nums">{part.toFixed(0)} %</span>
                  </AnneauProgres>
                  <span className="text-xs font-medium text-stone-700">{r.region}</span>
                  <span className="text-[11px] text-stone-400 tabular-nums">{formaterNombre(r.n_agents_mobile_money)} agents</span>
                </div>
              )
            })}
          </div>
        </CardContenu>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {triees.map((region, index) => {
          const valeur = metrique.cle(region)
          return (
            <div key={region.region} className="space-y-2">
              <CarteScore
                rang={index + 1}
                titre={region.region}
                extra={`${formaterNombre(region.pop_density)} hab/km²`}
                geant={metrique.format(valeur)}
                unite={metrique.unite}
                stats={[
                  { label: 'Agents', valeur: formaterNombre(region.n_agents_mobile_money), ratio: (Number(region.n_agents_mobile_money) || 0) / maxAgents, couleur: '#0c7a3e' },
                  { label: 'Agences', valeur: formaterNombre(region.n_agences), ratio: (Number(region.n_agences) || 0) / maxAgences, couleur: '#38bdf8' },
                  { label: 'Équipements', valeur: formaterNombre(region.n_infrastructures), ratio: (Number(region.n_infrastructures) || 0) / maxInfra, couleur: '#8b5cf6' },
                ]}
              />
              <PillDelta valeur={valeur} reference={moyenne} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
