import { useState, useEffect } from 'react'
import { getInfrastructures } from '../../services/api'
import Pagination from '../layout/Pagination'
import InfrastructureRow from './InfrastructureRow'

export const LIGNES_PAR_PAGE = 15

export default function InfrastructureList({ filters, filtersActive }) {
  const [state, setState] = useState({
    donnees: null,
    chargement: true,
    erreur: null,
    page: 1,
  })

  const charger = async (page = 1) => {
    setState((ancient) => ({ ...ancient, chargement: true, erreur: null }))
    try {
      const parametres = { ...filters, page, per_page: LIGNES_PAR_PAGE }
      if (!filtersActive) {
        delete parametres.operator
        delete parametres.type
        delete parametres.region
        delete parametres.prefecture
        delete parametres.search
      }
      const donnees = await getInfrastructures(parametres)
      setState({ donnees, chargement: false, erreur: null, page })
    } catch (erreur) {
      setState((ancient) => ({ ...ancient, chargement: false, erreur: erreur.message }))
    }
  }

  useEffect(() => {
    charger(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), filtersActive])

  const { donnees, chargement, erreur, page } = state

  return (
    <div className="card">
      <h3>Liste des infrastructures</h3>
      {erreur && <div className="error-box"><strong>Erreur :</strong> {erreur}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Opérateur</th>
            <th>Région</th>
            <th>Préfecture</th>
            <th>Localité</th>
            <th className="num">Latitude</th>
            <th className="num">Longitude</th>
          </tr>
        </thead>

        {chargement && (
          <tbody>
            <tr>
              <td colSpan="8" className="loading-row">
                👷 <i>Chargement…</i>
              </td>
            </tr>
          </tbody>
        )}

        {!chargement && !erreur && (
          <tbody>
            {donnees && donnees.items
              ? donnees.items.map((infra) => <InfrastructureRow key={infra.id} infra={infra} />)
              : (
                <tr>
                  <td colSpan="8" className="empty-row">
                    Aucune infrastructure ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              )}
          </tbody>
        )}
      </table>

      {donnees && (
        <Pagination
          page={page}
          total={donnees.total}
          pages={donnees.pages}
          onPage={(p) => charger(p)}
        />
      )}
    </div>
  )
}
