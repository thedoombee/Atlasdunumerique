import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Antenna, Banknote, Building2 } from 'lucide-react'
import { getIndicateursNationaux, getOptionsFiltres } from '../services/api'
import { formaterNombre, formaterPourcent } from '../utils/format'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { BarList, couleurPalette } from '../components/ui/barlist'
import { KpiMini } from '../components/ui/kpimini'
import { Compte } from '../components/ui/compte'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'

export default function Operateurs() {
  const [nationaux, setNationaux] = useState(null)
  const [options, setOptions] = useState({ operators: [] })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    Promise.all([getIndicateursNationaux(), getOptionsFiltres().catch(() => null)])
      .then(([nat, opts]) => {
        if (annule) return
        setNationaux(nat)
        if (opts) setOptions({ operators: opts.operators || [] })
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de charger les données opérateurs.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const donnees = useMemo(() => {
    const lignes = (options.operators || [])
      .map((op, i) => ({
        nom: op.label || op.value,
        agences: Number(op.agence_count) || 0,
        agents: Number(op.agent_count) || 0,
        total: Number(op.total_count) || 0,
        couleur: ['#f59e0b', '#0c7a3e', '#38bdf8', '#8b5cf6'][i] || '#94a3b8',
      }))
      .sort((a, b) => b.total - a.total)
    const totalAgents = lignes.reduce((s, l) => s + l.agents, 0) || 1
    return lignes.map((l) => ({ ...l, part: (l.agents / totalAgents) * 100 }))
  }, [options])

  const donut = useMemo(
    () => donnees.map((d) => ({ nom: d.nom, valeur: d.agents })),
    [donnees],
  )

  if (chargement) return <ChargementCartes nombre={4} />
  if (erreur) return <ErreurCarte message={erreur} />

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiMini icone={Building2} label="Agences" sousLabel="tous opérateurs" valeur={<Compte valeur={nationaux?.total_agences || 0} format={(v) => formaterNombre(v)} />} sousTexte="points de présence physiques" teinte="jaune" />
        <KpiMini icone={Banknote} label="Agents mobile money" sousLabel="tous opérateurs" valeur={<Compte valeur={nationaux?.total_agents_mobile_money || 0} format={(v) => formaterNombre(v)} />} sousTexte={`${formaterNombre(nationaux?.agents_par_1000_habitants)} pour 1000 hab.`} teinte="vert" />
        <KpiMini icone={Antenna} label="Datacenters" sousLabel="établissements" valeur={<Compte valeur={nationaux?.total_datacenters || 0} format={(v) => formaterNombre(v)} />} sousTexte="nœuds d’hébergement recensés" teinte="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardEntete>
            <CardTitre>Agents par opérateur</CardTitre>
            <CardDescription>Volumes et parts du réseau mobile money.</CardDescription>
          </CardEntete>
          <CardContenu>
            <div className="flex h-10 gap-1 overflow-hidden rounded-xl">
              {donnees.map((op) => (
                <div key={op.nom} style={{ width: `${op.part}%`, backgroundColor: op.couleur }} title={`${op.nom} : ${formaterPourcent(op.part)}`} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {donnees.map((op) => (
                <li key={op.nom} className="flex items-center gap-2.5 text-sm">
                  <span className="size-3 rounded-sm" style={{ backgroundColor: op.couleur }} />
                  <span className="flex-1 font-medium text-stone-800">{op.nom}</span>
                  <span className="text-xs text-stone-400 tabular-nums">{formaterNombre(op.agences)} agences</span>
                  <strong className="tabular-nums">{formaterPourcent(op.part, 0)}</strong>
                  <span className="w-20 text-right text-xs text-stone-400 tabular-nums">({formaterNombre(op.agents)})</span>
                </li>
              ))}
            </ul>
          </CardContenu>
        </Card>

        <Card className="lg:col-span-2">
          <CardEntete>
            <CardTitre>Répartition des agents</CardTitre>
            <CardDescription>Donut des parts par opérateur.</CardDescription>
          </CardEntete>
          <CardContenu>
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="valeur" nameKey="nom" innerRadius={60} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                    {donut.map((d, i) => (
                      <Cell key={d.nom} fill={donnees[i]?.couleur || couleurPalette(i)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, nom) => [formaterNombre(v), nom]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">{formaterNombre(nationaux?.total_agents_mobile_money)}</span>
                <span className="text-[11px] text-stone-500">agents</span>
              </div>
            </div>
            <div className="mt-2">
              <BarList donnees={donnees.map((d) => ({ nom: d.nom, valeur: d.agences, couleur: d.couleur }))} />
            </div>
          </CardContenu>
        </Card>
      </div>
    </section>
  )
}
