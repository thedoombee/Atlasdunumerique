import formaterNombre from '../../utils/format'
import { formaterOperateur, formaterType } from '../../utils/format'

export default function InfrastructureRow({ infra }) {
  return (
    <tr>
      <td className="donnees-nom">{infra.nom}</td>
      <td>{formaterType(infra.type)}</td>
      <td>{formaterOperateur(infra.operateur)}</td>
      <td>{infra.region}</td>
      <td>{infra.prefecture}</td>
      <td>{infra.localite || '\u2014'}</td>
      <td className="num">{formaterNombre(infra.latitude)}</td>
      <td className="num">{formaterNombre(infra.longitude)}</td>
    </tr>
  )
}
