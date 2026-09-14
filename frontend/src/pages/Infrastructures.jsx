import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { getInfrastructures, getOptionsFiltres } from '../services/api'
import { formaterNombre, formaterOperateur, formaterPourcent, formaterType } from '../utils/format'
import { Button } from '../components/ui/button'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/input'
import { couleurPalette } from '../components/ui/barlist'
import { exporterCsv } from '../lib/csv'
import Pagination from '../components/layout/Pagination'
import { Tabs, TabsListe, TabsDeclencheur } from '../components/ui/tabs'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'

const TAILLE_PAGE = 12

export default function Infrastructures() {
  const [donnees, setDonnees] = useState(null)
  const [options, setOptions] = useState({ operators: [], types: [], regions: [] })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [page, setPage] = useState(1)
  const [operateur, setOperateur] = useState('')
  const [type, setType] = useState('')
  const [recherche, setRecherche] = useState('')

  const charger = useCallback(
    async (pageCourante = 1, filtres = {}) => {
      setChargement(true)
      setErreur('')
      try {
        const resultat = await getInfrastructures({
          page: pageCourante,
          per_page: TAILLE_PAGE,
          operateur: filtres.operateur ?? operateur ?? undefined,
          type: filtres.type ?? type ?? undefined,
          recherche: filtres.recherche ?? recherche ?? undefined,
        })
        setDonnees(resultat)
        setPage(pageCourante)
      } catch (e) {
        setErreur('Impossible de charger la liste des infrastructures.')
      } finally {
        setChargement(false)
      }
    },
    [operateur, type, recherche],
  )

  useEffect(() => {
    getOptionsFiltres()
      .then((opts) => {
        if (opts) setOptions({ operators: opts.operators || [], types: opts.types || [], regions: opts.regions || [] })
      })
      .catch(() => {})
    charger(1, { operateur: '', type: '', recherche: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = donnees?.total || 0
  const lignes = donnees?.items || []

  const marqueurs = useMemo(
    () =>
      lignes.filter(
        (infra) => Number.isFinite(Number(infra.latitude)) && Number.isFinite(Number(infra.longitude)),
      ),
    [lignes],
  )

  const repartitionOperateurs = useMemo(() => {
    const entrees = [...(options.operators || [])]
      .map((op) => ({ nom: op.label || op.value, valeur: Number(op.total_count) || 0 }))
      .filter((e) => e.valeur > 0)
      .sort((a, b) => b.valeur - a.valeur)
    const totalOp = entrees.reduce((s, e) => s + e.valeur, 0) || 1
    const couleurs = { Togocom: '#f59e0b', Moov: '#0c7a3e', Telecom: '#38bdf8', 'Canal Plus': '#8b5cf6' }
    return entrees.map((e) => ({
      ...e,
      part: (e.valeur / totalOp) * 100,
      couleur: couleurs[e.nom] || '#94a3b8',
    }))
  }, [options])

  const reinitialiser = () => {
    setOperateur('')
    setType('')
    setRecherche('')
    charger(1, { operateur: '', type: '', recherche: '' })
  }

  if (chargement && !donnees) return <ChargementCartes nombre={4} />
  if (erreur && !donnees) return <ErreurCarte message={erreur} onReessayer={() => charger(page)} />

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardEntete>
            <CardTitre>Carte des infrastructures</CardTitre>
            <CardDescription>{formaterNombre(total)} équipements · page {page} affichée.</CardDescription>
          </CardEntete>
          <CardContenu>
              <div className="h-[380px] overflow-hidden rounded-xl border border-stone-200/80">
              <MapContainer center={[8.65, 1.0]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {marqueurs.map((infra) => (
                  <CircleMarker
                    key={infra.id}
                    center={[Number(infra.latitude), Number(infra.longitude)]}
                    radius={6}
                    pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#65a30d', fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <strong>{infra.nom}</strong>
                      <br />{formaterType(infra.type)} · {formaterOperateur(infra.operateur)}
                      <br />{infra.localite || ''} ({infra.prefecture})
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </CardContenu>
        </Card>

        <Card className="lg:col-span-2">
          <CardEntete>
            <p className="etiquette-section">Prévision de structure</p>
            <CardTitre className="mt-1 text-base">Équipements par opérateur</CardTitre>
          </CardEntete>
          <CardContenu>
            <div className="flex h-10 gap-1 overflow-hidden rounded-lg">
              {repartitionOperateurs.map((op) => (
                <div key={op.nom} style={{ width: `${op.part}%`, backgroundColor: op.couleur }} title={`${op.nom} : ${formaterPourcent(op.part)}`} />
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {repartitionOperateurs.map((op) => (
                <li key={op.nom} className="flex items-center gap-2 text-xs text-stone-600">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: op.couleur }} />
                  <span className="flex-1 font-medium">{op.nom}</span>
                  <strong className="tabular-nums">{formaterPourcent(op.part, 0)}</strong>
                  <span className="text-stone-400 tabular-nums">({formaterNombre(op.valeur)})</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-stone-100 pt-2 text-[11px] text-stone-400">
              Volumes nationaux recensés, toutes sources confondues.
            </p>
          </CardContenu>
        </Card>
      </div>

      <Card>
        <CardEntete>
          <CardTitre>Registre des équipements</CardTitre>
          <CardDescription>Recherche et filtres sur l’ensemble du registre.</CardDescription>
        </CardEntete>
        <CardContenu>
          <Tabs
            value={type || 'tous'}
            onValueChange={(v) => {
              const nouveau = v === 'tous' ? '' : v
              setType(nouveau)
              charger(1, { type: nouveau })
            }}
          >
            <TabsListe className="mb-3">
              <TabsDeclencheur value="tous">Tous</TabsDeclencheur>
              <TabsDeclencheur value="agence">Agences</TabsDeclencheur>
              <TabsDeclencheur value="datacenter">Datacenters</TabsDeclencheur>
              <TabsDeclencheur value="agent_mobile_money">Agents Mob</TabsDeclencheur>
            </TabsListe>
          </Tabs>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  className="w-52 pl-9"
                  placeholder="Nom, localité…"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') charger(1)
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Opérateur</Label>
              <Select value={operateur} onChange={(e) => setOperateur(e.target.value)}>
                <option value="">Tous</option>
                {options.operators.map((op) => (
                  <option key={op.value} value={op.value}>{op.label || op.value}</option>
                ))}
              </Select>
            </div>
            <Button taille="petit" onClick={() => charger(1)}>Filtrer</Button>
            <Button variante="fantome" taille="petit" onClick={reinitialiser}>Réinitialiser</Button>
            <Button
              variante="contour"
              taille="petit"
              className="ml-auto"
              onClick={() =>
                exporterCsv(`infrastructures-page${page}.csv`, lignes, [
                  { label: 'Nom', cle: 'nom' },
                  { label: 'Type', cle: 'type' },
                  { label: 'Opérateur', cle: 'operateur' },
                  { label: 'Région', cle: 'region' },
                  { label: 'Préfecture', cle: 'prefecture' },
                  { label: 'Localité', cle: 'localite' },
                  { label: 'Latitude', cle: 'latitude' },
                  { label: 'Longitude', cle: 'longitude' },
                ])
              }
            >
              <Download />
              CSV
            </Button>
            <span className="text-xs text-stone-500">{formaterNombre(total)} résultat(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-medium text-stone-500">
                  <th className="py-2 pr-3 font-medium">Équipement</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Type</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Opérateur</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Localisation</th>
                  <th className="py-2 pl-3 text-right font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((infra, i) => (
                  <tr key={infra.id} className="border-b border-stone-50 transition-colors last:border-0 hover:bg-stone-50/70">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: couleurPalette(i) }}>
                          {String(infra.nom || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-medium text-stone-900">{infra.nom}</span>
                      </span>
                    </td>
                    <td className="hidden px-3 py-2.5 text-stone-500 sm:table-cell">{formaterType(infra.type)}</td>
                    <td className="hidden px-3 py-2.5 text-stone-500 md:table-cell">{formaterOperateur(infra.operateur)}</td>
                    <td className="hidden px-3 py-2.5 text-stone-500 lg:table-cell">{infra.localite || '—'} · {infra.prefecture}</td>
                    <td className="py-2.5 pl-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Recensé
                      </span>
                    </td>
                  </tr>
                ))}
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-stone-400">Aucun équipement ne correspond à ces filtres.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {donnees ? (
            <Pagination
              page={page}
              pages={donnees.pages}
              total={total}
              perPage={donnees.per_page || TAILLE_PAGE}
              onPage={(p) => charger(p)}
            />
          ) : null}
        </CardContenu>
      </Card>
    </section>
  )
}
