import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer } from 'react-leaflet'
import {
  getGeojsonInfrastructures,
  getGeojsonPrefectures,
  getGeojsonRegions,
  getIndicateursParPrefecture,
  getIndicateursParRegion,
  getZonesBlanches,
} from '../services/api'
import { formaterKm2, formaterNombre, formaterPourcent, formaterPriorite } from '../utils/format'
import { Badge } from '../components/ui/badge'
import { Card, CardContenu, CardDescription, CardEntete, CardTitre } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Sheet } from '../components/ui/sheet'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'
import { cn } from '../lib/utils'

const ECHELLES_VERT = ['#eef7f1', '#b0d9bf', '#7fbf97', '#24854f', '#05491f']
const MAX_POINTS = 800

function norm(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function nomGeo(props) {
  return props.region || props.nom || props.name || props.prefecture || props.PREFECTURE || ''
}

function couleurEchelle(valeur, max) {
  if (!Number.isFinite(valeur) || max <= 0) return '#f5f5f4'
  const ratio = Math.max(0, Math.min(1, valeur / max))
  return ECHELLES_VERT[Math.min(ECHELLES_VERT.length - 1, Math.floor(ratio * ECHELLES_VERT.length))]
}

const METRIQUES_REGIONS = [
  { id: 'population', label: 'Population', cle: (r) => Number(r.population) || 0, format: (v) => formaterNombre(v) },
  { id: 'agents', label: 'Agents', cle: (r) => Number(r.n_agents_mobile_money) || 0, format: (v) => formaterNombre(v) },
  { id: 'infra', label: 'Équipements', cle: (r) => Number(r.n_infrastructures) || 0, format: (v) => formaterNombre(v) },
]

const METRIQUES_PREFECTURES = [
  { id: 'score', label: 'Score', cle: (z) => Number(z.score_priorite) || 0, format: (v) => formaterNombre(v) },
  { id: 'pop', label: 'Non couverts', cle: (z) => Number(z.population_non_couverte) || 0, format: (v) => formaterNombre(v) },
  { id: 'agents', label: 'Agents', cle: (z) => Number(z.n_agents_mobile_money) || 0, format: (v) => formaterNombre(v) },
]

export default function Carte() {
  const [geoRegions, setGeoRegions] = useState(null)
  const [geoPrefectures, setGeoPrefectures] = useState(null)
  const [indicateursRegions, setIndicateursRegions] = useState([])
  const [zones, setZones] = useState([])
  const [points, setPoints] = useState([])
  const [niveau, setNiveau] = useState('regions')
  const [metriqueId, setMetriqueId] = useState('population')
  const [voirPoints, setVoirPoints] = useState(true)
  const [selection, setSelection] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    Promise.all([
      getGeojsonRegions().catch(() => null),
      getGeojsonPrefectures().catch(() => null),
      getIndicateursParRegion().catch(() => []),
      getIndicateursParPrefecture().catch(() => []),
      getZonesBlanches().then((z) => z.items || []).catch(() => []),
      getGeojsonInfrastructures().then((g) => (g.features || []).slice(0, MAX_POINTS)).catch(() => []),
    ])
      .then(([gr, gp, regs, prefs, zb, pts]) => {
        if (annule) return
        setGeoRegions(gr)
        setGeoPrefectures(gp)
        setIndicateursRegions(regs || [])
        setZones(zb || [])
        setPoints(pts || [])
        const parNom = {}
        ;(prefs || []).forEach((p) => {
          parNom[norm(p.prefecture)] = p
        })
        const zbParNom = {}
        ;(zb || []).forEach((z) => {
          zbParNom[norm(z.prefecture)] = z
        })
        setTablesJointure({ prefs: parNom, zb: zbParNom })
      })
      .catch(() => {
        if (!annule) setErreur('Impossible de charger les couches cartographiques.')
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const [tablesJointure, setTablesJointure] = useState({ prefs: {}, zb: {} })

  const regionsParNom = useMemo(() => {
    const table = {}
    indicateursRegions.forEach((r) => {
      table[norm(r.region)] = r
    })
    return table
  }, [indicateursRegions])

  const metriques = niveau === 'regions' ? METRIQUES_REGIONS : METRIQUES_PREFECTURES
  const metrique = metriques.find((m) => m.id === metriqueId) || metriques[0]

  const valeursCouche = useMemo(() => {
    if (niveau === 'regions') {
      return indicateursRegions.map((r) => metrique.cle(r))
    }
    return zones.map((z) => metrique.cle({ ...tablesJointure.prefs[norm(z.prefecture)], ...z }))
  }, [niveau, indicateursRegions, zones, tablesJointure, metrique])
  const maxCouche = Math.max(1, ...valeursCouche)

  const styleEntite = (feature) => {
    const nom = norm(nomGeo(feature?.properties || {}))
    let valeur = 0
    if (niveau === 'regions') {
      valeur = metrique.cle(regionsParNom[nom] || {})
    } else {
      const fusion = { ...tablesJointure.prefs[nom], ...tablesJointure.zb[nom] }
      valeur = metrique.cle(fusion)
    }
    return {
      fillColor: couleurEchelle(valeur, maxCouche),
      weight: 1.5,
      color: '#ffffff',
      fillOpacity: 0.85,
    }
  }

  const surChaqueEntite = (feature, couche) => {
    couche.on('click', () => {
      const props = feature?.properties || {}
      const nom = nomGeo(props)
      const cle = norm(nom)
      if (niveau === 'regions') {
        const donnees = regionsParNom[cle]
        if (donnees) setSelection({ type: 'region', nom, donnees })
      } else {
        const donnees = { ...tablesJointure.prefs[cle], ...tablesJointure.zb[cle] }
        if (Object.keys(donnees).length > 0) setSelection({ type: 'prefecture', nom, donnees })
      }
    })
  }

  if (chargement) return <ChargementCartes nombre={2} />
  if (erreur) return <ErreurCarte message={erreur} />

  const couche = niveau === 'regions' ? geoRegions : geoPrefectures

  return (
    <section className="space-y-4">
      <Card>
        <CardContenu className="flex flex-wrap items-center gap-2 pt-4">
          <span className="mr-1 text-xs font-medium text-stone-500">Couche :</span>
          {[
            { id: 'regions', label: 'Régions (5)' },
            { id: 'prefectures', label: 'Préfectures (39)' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setNiveau(c.id); setMetriqueId(c.id === 'regions' ? 'population' : 'score'); setSelection(null) }}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                niveau === c.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              {c.label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-stone-200 sm:inline-block" />
          <span className="mr-1 text-xs font-medium text-stone-500">Métrique :</span>
          {metriques.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetriqueId(m.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                metriqueId === m.id ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              {m.label}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-600">
            <Checkbox checked={voirPoints} onCheckedChange={(v) => setVoirPoints(v === true)} />
            Points ({points.length} affichés)
          </label>
        </CardContenu>
      </Card>

      <Card>
        <CardContenu className="pt-4">
          <div className="h-[520px] overflow-hidden rounded-xl border border-stone-200/80">
            <MapContainer center={[8.65, 1.0]} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {couche?.features ? (
                <GeoJSON
                  key={`${niveau}-${metriqueId}`}
                  data={couche}
                  style={styleEntite}
                  onEachFeature={surChaqueEntite}
                />
              ) : null}
              {voirPoints
                ? points.map((pt, i) => {
                    const coords = pt.geometry?.coordinates
                    if (!coords) return null
                    return (
                      <CircleMarker
                        key={i}
                        center={[coords[1], coords[0]]}
                        radius={3}
                        pathOptions={{ color: '#ffffff', weight: 1, fillColor: '#65a30d', fillOpacity: 0.85 }}
                      >
                        <Popup>
                          <strong>{pt.properties?.nom}</strong>
                          <br />{pt.properties?.prefecture} ({pt.properties?.region})
                        </Popup>
                      </CircleMarker>
                    )
                  })
                : null}
            </MapContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-stone-500">{metrique.label} · max {metrique.format(maxCouche)}</span>
            <span className="flex items-center gap-1">
              {ECHELLES_VERT.map((couleur) => (
                <span key={couleur} className="h-2.5 w-8 first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: couleur }} />
              ))}
            </span>
            <span className="ml-auto text-[11px] text-stone-400">Cliquez une zone pour le détail · points : échantillon de {MAX_POINTS}</span>
          </div>
        </CardContenu>
      </Card>

      <Sheet
        ouvert={selection !== null}
        onFermer={() => setSelection(null)}
        titre={selection?.nom || ''}
        description={selection?.type === 'region' ? 'Région' : 'Préfecture'}
      >
        {selection?.type === 'region' && selection.donnees ? (
          <dl className="space-y-2.5 text-sm">
            {[
              ['Population', formaterNombre(selection.donnees.population)],
              ['Superficie', formaterKm2(selection.donnees.area_km2)],
              ['Agences', formaterNombre(selection.donnees.n_agences)],
              ['Agents mobile money', formaterNombre(selection.donnees.n_agents_mobile_money)],
              ['Infrastructures', formaterNombre(selection.donnees.n_infrastructures)],
              ['Couverture agences', formaterPourcent(selection.donnees.couverture_agence_pct)],
            ].map(([label, valeur]) => (
              <div key={label} className="flex items-center justify-between border-b border-stone-100 pb-2">
                <dt className="text-stone-500">{label}</dt>
                <dd className="font-semibold tabular-nums">{valeur}</dd>
              </div>
            ))}
          </dl>
        ) : selection?.donnees ? (
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <dt className="text-stone-500">Niveau de priorité</dt>
              <dd><Badge variante={String(selection.donnees.niveau_priorite).toLowerCase().includes('haute') ? 'danger' : 'succes'}>{formaterPriorite(selection.donnees.niveau_priorite)}</Badge></dd>
            </div>
            {[
              ['Région', selection.donnees.region],
              ['Population', formaterNombre(selection.donnees.population)],
              ['Pop. non couverte', formaterNombre(selection.donnees.population_non_couverte)],
              ['Score de priorité', formaterNombre(selection.donnees.score_priorite)],
              ['Agences', formaterNombre(selection.donnees.n_agences)],
              ['Agents mobile money', formaterNombre(selection.donnees.n_agents_mobile_money)],
            ].map(([label, valeur]) => (
              <div key={label} className="flex items-center justify-between border-b border-stone-100 pb-2">
                <dt className="text-stone-500">{label}</dt>
                <dd className="font-semibold tabular-nums">{valeur}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Sheet>
    </section>
  )
}
