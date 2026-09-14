import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Antenna,
  Building2,
  Download,
  Lightbulb,
  MapPin,
  Search,
  Signal,
  Users,
  Wallet,
} from 'lucide-react'
import { getRecommandations } from '../services/api'
import { formaterNombre, formaterPriorite } from '../utils/format'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContenu, CardEntete, CardTitre } from '../components/ui/card'
import { Input, Select } from '../components/ui/input'
import { exporterCsv } from '../lib/csv'
import Pagination from '../components/layout/Pagination'
import { ChargementCartes, ErreurCarte } from '../components/ui/etat'
import { cn } from '../lib/utils'

const TAILLE_PAGE = 12

const CATEGORIES_STYLE = [
  { mots: ['backbone', 'noeud', 'datacenter', 'fibre'], icone: Building2, teinte: 'bg-violet-100 text-violet-700' },
  { mots: ['mobile money', 'financier', 'agent'], icone: Wallet, teinte: 'bg-emerald-100 text-emerald-700' },
  { mots: ['couverture', 'rural', 'antenne', 'tour', 'réseau'], icone: Signal, teinte: 'bg-sky-100 text-sky-700' },
  { mots: ['population', 'habitants', 'communaut'], icone: Users, teinte: 'bg-amber-100 text-amber-700' },
  { mots: ['agence', 'opérateur', 'operateur'], icone: Antenna, teinte: 'bg-pink-100 text-pink-700' },
]

function styleCategorie(rec) {
  const texte = `${rec.categorie || ''} ${rec.titre || ''}`.toLowerCase()
  return (
    CATEGORIES_STYLE.find((c) => c.mots.some((m) => texte.includes(m))) || {
      icone: Lightbulb,
      teinte: 'bg-stone-100 text-stone-600',
    }
  )
}

function variantePriorite(niveau) {
  const texte = String(niveau || '').toLowerCase()
  if (texte.includes('haute') || texte.includes('urgente')) return 'danger'
  if (texte.includes('moyenne')) return 'alerte'
  return 'succes'
}

export default function Recommandations() {
  const [recommandations, setRecommandations] = useState([])
  const [page, setPage] = useState(1)
  const [recherche, setRecherche] = useState('')
  const [niveau, setNiveau] = useState('')
  const [categorie, setCategorie] = useState('')
  const [tri, setTri] = useState('impact')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')
    try {
      const donnees = await getRecommandations()
      setRecommandations(donnees.items || donnees || [])
      setPage(1)
    } catch (e) {
      setErreur('Impossible de charger les recommandations.')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const niveaux = useMemo(
    () => [...new Set(recommandations.map((r) => r.niveau_priorite).filter(Boolean))],
    [recommandations],
  )

  const categories = useMemo(
    () => [...new Set(recommandations.map((r) => r.categorie).filter(Boolean))].sort(),
    [recommandations],
  )

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    const selectionnees = recommandations.filter((r) => {
      if (niveau && r.niveau_priorite !== niveau) return false
      if (categorie && r.categorie !== categorie) return false
      if (!terme) return true
      return `${r.titre || ''} ${r.justification || ''} ${r.categorie || ''}`.toLowerCase().includes(terme)
    })
    const cle = tri === 'score' ? (r) => Number(r.priorite) || 0 : (r) => Number(r.impact_estime_habitants) || 0
    return [...selectionnees].sort((a, b) => cle(b) - cle(a))
  }, [recommandations, recherche, niveau, categorie, tri])

  if (chargement) return <ChargementCartes nombre={6} />
  if (erreur) return <ErreurCarte message={erreur} onReessayer={charger} />

  const pages = Math.max(1, Math.ceil(filtrees.length / TAILLE_PAGE))
  const pageCourante = Math.min(page, pages)
  const lignes = filtrees.slice((pageCourante - 1) * TAILLE_PAGE, pageCourante * TAILLE_PAGE)

  return (
    <section className="space-y-4">
      <Card>
        <CardContenu className="flex flex-wrap items-center gap-2 pt-4">
          <div className="relative mr-1 w-60">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              className="bg-stone-100 pl-9"
              placeholder="Rechercher…"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => { setNiveau(''); setPage(1) }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              niveau === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
            )}
          >
            Tous
          </button>
          {niveaux.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { setNiveau(niveau === n ? '' : n); setPage(1) }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                niveau === n ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  backgroundColor:
                    variantePriorite(n) === 'danger' ? '#ef4444' : variantePriorite(n) === 'alerte' ? '#f59e0b' : '#10b981',
                }}
              />
              {formaterPriorite(n)}
            </button>
          ))}
          <Button
            variante="contour"
            taille="petit"
            className="ml-auto"
            onClick={() =>
              exporterCsv('recommandations-selection.csv', filtrees, [
                { label: 'Titre', cle: 'titre' },
                { label: 'Catégorie', cle: 'categorie' },
                { label: 'Niveau', cle: 'niveau_priorite' },
                { label: 'Score', cle: 'priorite' },
                { label: 'Région', cle: 'region' },
                { label: 'Préfecture', cle: 'prefecture' },
                { label: 'Impact habitants', cle: 'impact_estime_habitants' },
                { label: 'Justification', cle: 'justification' },
              ])
            }
          >
            <Download />
            CSV
          </Button>
          <span className="text-xs text-stone-500">{filtrees.length} recommandation(s)</span>
        </CardContenu>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setCategorie(''); setPage(1) }}
          className={cn(
            'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
            categorie === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
          )}
        >
          Toutes catégories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setCategorie(categorie === c ? '' : c); setPage(1) }}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              categorie === c ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
            )}
          >
            {c}
          </button>
        ))}
        <Select
          aria-label="Trier par"
          className="ml-auto w-48"
          value={tri}
          onChange={(e) => { setTri(e.target.value); setPage(1) }}
        >
          <option value="impact">Tri : impact habitants</option>
          <option value="score">Tri : score de priorité</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lignes.map((rec, index) => {
          const style = styleCategorie(rec)
          const Icone = style.icone
          return (
            <Card key={rec.id || `${rec.titre}-${index}`} className="flex flex-col">
              <CardEntete className="flex-row items-start gap-3">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', style.teinte)}>
                  <Icone className="size-5" />
                </span>
                <div className="min-w-0">
                  <CardTitre className="text-[15px] leading-snug">{rec.titre}</CardTitre>
                  {rec.categorie ? (
                    <p className="mt-0.5 text-xs text-stone-400">{rec.categorie}</p>
                  ) : null}
                </div>
              </CardEntete>
              <CardContenu className="flex flex-1 flex-col gap-3">
                {rec.impact_estime_habitants ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-semibold tracking-tight tabular-nums">
                      {formaterNombre(rec.impact_estime_habitants)}
                    </p>
                    <p className="text-[11px] text-stone-400">habitants<br />concernés</p>
                  </div>
                ) : null}
                <p className="line-clamp-3 text-sm text-stone-600">{rec.justification}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <Badge variante={variantePriorite(rec.niveau_priorite)}>
                    {formaterPriorite(rec.niveau_priorite)}
                  </Badge>
                  {rec.region ? (
                    <span className="flex items-center gap-1 text-xs text-stone-500">
                      <MapPin className="size-3" />
                      {rec.region}{rec.prefecture ? ` · ${rec.prefecture}` : ''}
                    </span>
                  ) : null}

                </div>
              </CardContenu>
            </Card>
          )
        })}
      </div>
      {lignes.length === 0 ? (
        <Card>
          <CardContenu className="pt-5 text-sm text-stone-500">
            Aucune recommandation ne correspond à ces filtres.
          </CardContenu>
        </Card>
      ) : null}
      <Pagination page={pageCourante} pages={pages} total={filtrees.length} perPage={TAILLE_PAGE} onPage={setPage} />
    </section>
  )
}
