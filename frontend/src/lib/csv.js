/** Exporte des lignes en CSV compatible Excel FR (séparateur point-virgule + BOM). */
export function exporterCsv(nomFichier, lignes = [], colonnes = []) {
  const BOM = '﻿'
  const echapper = (valeur) => {
    const texte = valeur === null || valeur === undefined ? '' : String(valeur)
    return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
  }
  const entete = colonnes.map((c) => echapper(c.label)).join(';')
  const corps = lignes.map((ligne) =>
    colonnes
      .map((colonne) =>
        echapper(typeof colonne.valeur === 'function' ? colonne.valeur(ligne) : ligne[colonne.cle]),
      )
      .join(';'),
  )
  const contenu = BOM + [entete, ...corps].join('\r\n')
  const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier.endsWith('.csv') ? nomFichier : `${nomFichier}.csv`
  lien.click()
  URL.revokeObjectURL(url)
}
