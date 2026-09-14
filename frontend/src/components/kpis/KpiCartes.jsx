import { formaterNombre } from '../utils/format'

export default function KpiCartes({ libelles, valeurs }) {
  return (
    <div className="grille-kpi">
      {libelles.map((libelle, index) => (
        <div className="carte-kpi" key={libelle}>
          <div className="libelle">{libelle}</div>
          <div className="valeur">{formaterNombre(valeurs[index])}</div>
        </div>
      ))}
    </div>
  )
}
