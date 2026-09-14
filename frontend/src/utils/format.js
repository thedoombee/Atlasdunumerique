export const API_BASE = 'http://127.0.0.1:8000/api'

export default function formaterNombre(valeur) {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '\u2014'
  if (typeof valeur === 'number') {
    return valeur.toLocaleString('fr-FR', {
      maximumFractionDigits: valeur % 1 === 0 ? 0 : 1,
    })
  }
  return String(valeur)
}

export { formaterNombre }

export function formaterPourcent(valeur, decimales = 1) {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '\u2014'
  return `${valeur.toFixed(decimales)} %`
}

export function formaterKm2(valeur) {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '\u2014'
  return `${valeur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} km\u00b2`
}

export function formaterMilliers(valeur) {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '\u2014'
  return `${(valeur / 1000).toFixed(1).replace('.', ',')} k`
}

export function formaterOperateur(nom) {
  const correspondances = {
    moov: 'Moov',
    togocom: 'Togocom',
    telecom_togo: 'Togo Telecom',
    canal: 'Canal+',
  }
  return correspondances[String(nom).toLowerCase()] || String(nom)
}

export function formaterType(nom) {
  const correspondances = {
    tour: 'Tour de télécommunication',
    datacenter: 'Datacenter',
    agence_mobile_money: 'Agence mobile money',
    point_vente: 'Point de vente',
    datacenter_etablissement: 'Datacenter',
  }
  return correspondances[String(nom).toLowerCase()] || String(nom)
}

export function formaterPriorite(niveau) {
  const correspondances = {
    haute: 'Haute',
    tres_haute: 'Très haute',
    moyenne: 'Moyenne',
    basse: 'Basse',
    urgente: 'Urgente',
    importante: 'Importante',
    essentielle: 'Essentielle',
  }
  return correspondances[String(niveau).toLowerCase()] || String(niveau)
}

export function formaterPrefectures(valeur) {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return "—"
  if (Array.isArray(valeur)) return formaterNombre(valeur.length)
  return formaterNombre(valeur)
}
