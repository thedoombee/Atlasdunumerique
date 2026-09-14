import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download, Map as MapIcone } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getConcentration,
  getIndicateursNationaux,
  getIndicateursParRegion,
} from '../services/api'
import { formaterNombre, formaterPourcent } from '../utils/format'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { JaugeSegments } from '../components/ui/jauge'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'
import { SparklineBarres } from '../components/ui/sparkline'

function CarteFlux({ label, valeur, sousTexte, donneesSpark, couleurSpark = '#0c7a3e' }) {
  return (
    <Card>
      <CardContenu className="space-y-1 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className="mt-0.5 text-[1.65rem] leading-none font-semibold tracking-tight tabular-nums">
              {valeur}
            </p>
            <p className="mt-1 text-[11px] text-stone-400">{sousTexte}</p>
          </div>
          <SparklineBarres donnees={donneesSpark} couleur={couleurSpark} couleurMax={couleurSpark} className="h-12 w-24 shrink-0" />
        </div>
      </CardContenu>
    </Card>
  )
}

export default function VueEnsemble({ onNaviguer }) {
  const [nationaux, setNationaux] = useState(null)
  const [concentration, setConcentration] = useState(null)
  const [regions, setRegions] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(() => {
    setChargement(true)
    setErreur('')
    let annule = false
    Promise.all([getIndicateursNationaux(), getConcentration(), getIndicateursParRegion()])
      .then(([nat, conc, regs]) => {
        if (annule) return
        setNationaux(nat)
        setConcentration(conc)
        setRegions(regs || [])
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de charger les indicateurs nationaux.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  useEffect(() => charger(), [charger])

  const serie = useMemo(
    () => ({
      population: regions.map((r) => r.population),
      agents: regions.map((r) => r.n_agents_mobile_money),
      infra: regions.map((r) => r.n_infrastructures),
      ecarts: [
        (concentration?.dissimilarite_agents_regions || 0) * 100,
        (concentration?.dissimilarite_agences_regions || 0) * 100,
        (concentration?.dissimilarite_agents_prefectures || 0) * 100,
        (concentration?.dissimilarite_agences_prefectures || 0) * 100,
      ],
    }),
    [regions, concentration],
  )

  const barresAgents = useMemo(
    () =>
      [...regions]
        .sort((a, b) => (b.n_agents_mobile_money || 0) - (a.n_agents_mobile_money || 0))
        .map((r) => ({ nom: r.region, agents: Number(r.n_agents_mobile_money) || 0 })),
    [regions],
  )

  const repartitionOperateurs = useMemo(() => {
    const ParOp = nationaux?.agents_by_operator || {}
    const entrees = Object.entries(ParOp)
      .map(([nom, valeur]) => ({ nom, valeur: Number(valeur) || 0 }))
      .filter((e) => e.valeur > 0)
      .sort((a, b) => b.valeur - a.valeur)
    const total = entrees.reduce((s, e) => s + e.valeur, 0) || 1
    const couleurs = { Togocom: '#f59e0b', Moov: '#0c7a3e' }
    return entrees.map((e, i) => ({
      ...e,
      part: (e.valeur / total) * 100,
      couleur: couleurs[e.nom] || ['#8b5cf6', '#38bdf8'][i] || '#94a3b8',
    }))
  }, [nationaux])

  const medianeDensite = useMemo(() => {
    const valeurs = regions.map((r) => Number(r.agents_par_1000_habitants) || 0).sort((a, b) => a - b)
    return valeurs.length ? valeurs[Math.floor(valeurs.length / 2)] : 0
  }, [regions])

  const topRegionsService = useMemo(
    () =>
      [...regions]
        .sort((a, b) => (b.agents_par_1000_habitants || 0) - (a.agents_par_1000_habitants || 0))
        .slice(0, 4),
    [regions],
  )

  if (chargement) return <ChargementCartes nombre={4} />
  if (erreur) return <ErreurCarte message={erreur} onReessayer={charger} />

  const donnees = nationaux || {}
  const couverture = Number(donnees.couverture_combinee_pct || 0)

  const exporter = () => {
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = 'atlas-numerique-togo-indicateurs.json'
    lien.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Atlas du numérique — Togo</h2>
          <p className="mt-1 text-sm text-stone-500">
            Observatoire national : couverture, équipements et fracture numérique en un coup d’œil.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exporter} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50">
            <Download className="size-3.5" /> Exporter
          </button>
          <button type="button" onClick={() => onNaviguer?.('zones-blanches')} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50">
            Zones blanches <ArrowRight className="size-3.5" />
          </button>
          <button type="button" onClick={() => onNaviguer?.('infrastructures')} className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-stone-800">
            <MapIcone className="size-3.5" /> Explorer la carte
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteFlux label="Population" valeur={formaterNombre(donnees.total_population)} sousTexte={`${donnees.n_regions || 5} régions · ${donnees.n_prefectures || 39} préfectures`} donneesSpark={serie.population} />
        <CarteFlux label="Agents mobile money" valeur={formaterNombre(donnees.total_agents_mobile_money)} sousTexte={`${formaterNombre(donnees.agents_par_1000_habitants)} pour 1000 hab.`} donneesSpark={serie.agents} />
        <CarteFlux label="Infrastructures" valeur={formaterNombre(donnees.total_infrastructures)} sousTexte={`${formaterNombre(donnees.total_agences)} agences · ${formaterNombre(donnees.total_datacenters)} datacenters`} donneesSpark={serie.infra} couleurSpark="#65a30d" />
        <CarteFlux label="Écart de concentration" valeur={formaterPourcent((concentration?.dissimilarite_agences_prefectures || 0) * 100)} sousTexte="agences entre préfectures (4 indices)" donneesSpark={serie.ecarts} couleurSpark="#f59e0b" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardEntete className="flex-row items-start justify-between">
            <div>
              <p className="etiquette-section">Découverte</p>
              <CardTitre className="mt-1 text-base">Agents par région</CardTitre>
            </div>
            <span className="rounded-full bg-primary-600 px-3 py-1 text-[11px] font-semibold text-white">
              {formaterNombre(donnees.total_agents_mobile_money)} au total
            </span>
          </CardEntete>
          <CardContenu>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barresAgents} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <pattern id="hachure" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="7" height="7" fill="#ffffff" />
                      <line x1="0" y1="0" x2="0" y2="7" stroke="#d6d3d1" strokeWidth="2.4" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="nom" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e7e5e4' }} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(v) => [formaterNombre(v), 'Agents']} />
                  <Bar dataKey="agents" fill="url(#hachure)" stroke="#a8a29e" strokeWidth={1} radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-stone-100 pt-3">
              <div>
                <p className="text-[11px] text-stone-400">Superficie</p>
                <p className="text-sm font-semibold tabular-nums">{formaterNombre(donnees.area_km2)} km²</p>
              </div>
              <div>
                <p className="text-[11px] text-stone-400">Densité</p>
                <p className="text-sm font-semibold tabular-nums">{formaterNombre(donnees.pop_density)} hab/km²</p>
              </div>
              <div>
                <p className="text-[11px] text-stone-400">Pop. par agent</p>
                <p className="text-sm font-semibold tabular-nums">{formaterNombre(donnees.pop_par_agent_mobile_money)} hab.</p>
              </div>
            </div>
          </CardContenu>
        </Card>

        <Card className="lg:col-span-2">
          <CardEntete>
            <p className="etiquette-section">Couverture combinée</p>
            <CardTitre className="mt-1 text-base">Estimation nationale</CardTitre>
          </CardEntete>
          <CardContenu className="flex flex-col items-center">
            <JaugeSegments
              taille={168}
              segments={[
                { valeur: couverture, couleur: '#0c7a3e' },
                { valeur: Math.max(0, 100 - couverture), couleur: '#f59e0b' },
              ]}
            />
            <p className="-mt-9 text-3xl font-semibold tracking-tight tabular-nums">{formaterPourcent(couverture)}</p>
            <p className="mt-1 text-xs text-stone-400">vert : couverte · ambre : non couverte</p>
            <ul className="mt-4 w-full space-y-2 border-t border-stone-100 pt-3">
              {topRegionsService.map((r) => {
                const desservie = (Number(r.agents_par_1000_habitants) || 0) >= medianeDensite
                return (
                  <li key={r.region} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 font-medium text-stone-700">{r.region}</span>
                    <span className="text-stone-400 tabular-nums">{formaterNombre(r.agents_par_1000_habitants)}/1000</span>
                    <span className={desservie ? 'rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700' : 'rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700'}>
                      {desservie ? 'Desservie' : 'À renforcer'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContenu>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardEntete>
            <p className="etiquette-section">Prévision de structure</p>
            <CardTitre className="mt-1 text-base">Agents par opérateur</CardTitre>
          </CardEntete>
          <CardContenu>
            <div className="flex h-9 gap-1 overflow-hidden rounded-lg">
              {repartitionOperateurs.map((op) => (
                <div key={op.nom} style={{ width: `${op.part}%`, backgroundColor: op.couleur }} title={`${op.nom} : ${formaterPourcent(op.part)}`} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {repartitionOperateurs.map((op) => (
                <span key={op.nom} className="flex items-center gap-1.5 text-xs text-stone-600">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: op.couleur }} />
                  {op.nom} · <strong className="tabular-nums">{formaterPourcent(op.part)}</strong>
                  <span className="text-stone-400 tabular-nums">({formaterNombre(op.valeur)})</span>
                </span>
              ))}
            </div>
          </CardContenu>
        </Card>
        <Card className="lg:col-span-2">
          <CardEntete>
            <CardTitre>Lecture des écarts</CardTitre>
            <CardDescription>Quatre indices de dissimilarité, en points.</CardDescription>
          </CardEntete>
          <CardContenu>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li><span className="font-semibold text-stone-900">#Agences/régions {formaterPourcent((concentration?.dissimilarite_agences_regions || 0) * 100)}</span> — la capitale concentre {formaterPourcent(concentration?.part_agents_grand_lome_pct)} des agents pour {formaterPourcent(concentration?.part_population_grand_lome_pct)} de la population.</li>
              <li><span className="font-semibold text-stone-900">#Agences/préfectures {formaterPourcent((concentration?.dissimilarite_agences_prefectures || 0) * 100)}</span> — le trio de tête capte {formaterPourcent(concentration?.part_agents_top3_prefectures_pct)} des agents.</li>
              <li><span className="font-semibold text-stone-900">#Agents/préfectures {formaterPourcent((concentration?.dissimilarite_agents_prefectures || 0) * 100)}</span> — voir les zones blanches en priorité.</li>
            </ul>
            <button type="button" onClick={() => onNaviguer?.('zones-blanches')} className="mt-3 text-sm font-medium text-primary-700 hover:underline">
              Voir les zones blanches →
            </button>
          </CardContenu>
        </Card>
      </div>
    </section>
  )
}
