import { API_BASE } from '../utils/format'

async function requete(chemin, options = {}) {
  const reponse = await fetch(`${API_BASE}${chemin}`, options)
  if (!reponse.ok) {
    throw new Error(`Erreur API ${reponse.status} : ${chemin}`)
  }
  return reponse.json()
}

export function getOptionsFiltres() {
  return requete('/filters/options')
}

export function getMeta() {
  return requete('/meta')
}

export function getPopulation() {
  return requete('/population')
}

export function getIndicateursNationaux() {
  return requete('/indicators/summary')
}

export function getIndicateursParRegion() {
  return requete('/indicators/by-region')
}

export function getIndicateursParPrefecture() {
  return requete('/indicators/by-prefecture')
}

export function getConcentration() {
  return requete('/indicators/concentration')
}

export function getInfrastructures(params = {}) {
  const { page = 1, type, region, prefecture, recherche } = params
  const operateur = params.operateur ?? params.operator
  const parPage = params.parPage ?? params.per_page ?? params.taille ?? 15
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('per_page', String(parPage))
  if (operateur) query.set('operator', operateur)
  if (type) query.set('type', type)
  if (region) query.set('region', region)
  if (prefecture) query.set('prefecture', prefecture)
  if (recherche) query.set('search', recherche)
  return requete(`/infrastructures?${query.toString()}`)
}

export function getGeojsonPrefectures() {
  return requete('/maps/prefectures')
}

export function getGeojsonRegions() {
  return requete('/maps/regions')
}

export function getGeojsonInfrastructures() {
  return requete('/maps/infrastructures')
}

export function getCouverturePrefectures() {
  return requete('/coverage/prefectures')
}

export function getZonesBlanches() {
  // Le backend retourne la liste complète (39 préfectures) : filtre et
  // pagination effectués côté client dans la page ZonesBlanches.
  return requete('/zones-blanches')
}

export function getZonesBlanchesResume() {
  return requete('/zones-blanches/summary')
}

export function getRecommandations() {
  return requete('/recommandations')
}
