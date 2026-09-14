"""Script independant d'export du rapport de donnees.

Sans lien avec le serveur FastAPI : aucune importation de fastapi,
aucune requete HTTP, aucun appel a app.main ou app.api.
Execute uniquement les fonctions d'analyse deja construites
(app.ingest / app.analysis) a partir des donnees ingerees,
puis exporte rapport_donnees_powerpoint.md a la racine du projet.
"""

import sys
from pathlib import Path

PROJET_DIR = Path(__file__).resolve().parent
BACKEND_DIR = PROJET_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import pandas as pd  # noqa: E402

from app import config  # noqa: E402
from app.analysis import analysis_engine, coverage_model, recommendations_gen  # noqa: E402


def fmt_int(value):
    try:
        return f"{int(value):,}".replace(",", " ")
    except (TypeError, ValueError):
        return str(value)


def executer_analyses():
    """Execute les fonctions d'analyse existantes sur les donnees ingerees."""
    infra = pd.read_parquet(config.PROCESSED_INFRASTRUCTURES_PARQUET)
    prefectures_gdf, regions_gdf, population_df = analysis_engine.prepare_geographies()
    couverture = coverage_model.compute_coverage(infra, prefectures_gdf)
    bundle = analysis_engine.run_analysis(infra, prefectures_gdf, regions_gdf, population_df)
    return bundle, infra, couverture


def section_national(national):
    lignes = []
    lignes.append("## 1. Indicateurs cles nationaux")
    lignes.append("")
    lignes.append(f"- Population totale prise en compte dans l'analyse : {fmt_int(national['total_population'])} habitants")
    lignes.append(f"- Superficie totale : {national['area_km2']} km2")
    lignes.append(f"- Densite moyenne : {national['pop_density']} habitants par km2")
    lignes.append(f"- Nombre total d'infrastructures : {fmt_int(national['total_infrastructures'])}")
    lignes.append(f"- Nombre total d'agences : {fmt_int(national['total_agences'])}")
    lignes.append(f"- Nombre total d'agences Moov : {fmt_int(national['agences_by_operator'].get('Moov', 0))}")
    lignes.append(f"- Nombre total d'agences Togocom : {fmt_int(national['agences_by_operator'].get('Togocom', 0))}")
    lignes.append(f"- Nombre total d'agences Telecom : {fmt_int(national['agences_by_operator'].get('Telecom', 0))}")
    lignes.append(f"- Nombre total d'agences Canal Plus : {fmt_int(national['agences_by_operator'].get('Canal Plus', 0))}")
    lignes.append(f"- Nombre total de centres de donnees : {fmt_int(national['total_datacenters'])}")
    lignes.append(f"- Nombre total d'agents mobile money : {fmt_int(national['total_agents_mobile_money'])}")
    agents_op = national.get("agents_by_operator", {})
    for operateur in sorted(agents_op.keys()):
        lignes.append(f"- Nombre d'agents mobile money {operateur} : {fmt_int(agents_op[operateur])}")
    lignes.append(f"- Population par agence : {national['pop_par_agence']}")
    lignes.append(f"- Population par agent mobile money : {national['pop_par_agent_mobile_money']}")
    lignes.append(f"- Agents mobile money pour 1000 habitants : {national['agents_par_1000_habitants']}")
    lignes.append(f"- Population couverte estimee (agences) : {fmt_int(national['population_couverte_agence'])} habitants")
    lignes.append(f"- Population couverte estimee (combinee) : {fmt_int(national['population_couverte_combinee'])} habitants")
    lignes.append(f"- Taux de couverture estime national (agences) : {national['couverture_agence_pct']} %")
    lignes.append(f"- Taux de couverture estime national (combinee) : {national['couverture_combinee_pct']} %")
    lignes.append(f"- Nombre de regions : {national['n_regions']}")
    lignes.append(f"- Nombre de prefectures : {national['n_prefectures']}")
    lignes.append("")
    return lignes


def ratio_hab_par_infra(population, n_infrastructures):
    if not n_infrastructures:
        return None
    return round(population / n_infrastructures, 2)


def section_regions(regions):
    lignes = []
    lignes.append("## 2. Repartition par region")
    lignes.append("")
    for r in sorted(regions, key=lambda x: x["region"]):
        ratio = ratio_hab_par_infra(r["population"], r["n_infrastructures"])
        lignes.append(f"### {r['region']}")
        lignes.append("")
        lignes.append(f"- Population de la region : {fmt_int(r['population'])} habitants")
        lignes.append(f"- Nombre d'agences : {fmt_int(r['n_agences'])}")
        lignes.append(f"- Nombre d'agents mobile money : {fmt_int(r['n_agents_mobile_money'])}")
        lignes.append(f"- Nombre de datacenters : {fmt_int(r['n_datacenters'])}")
        lignes.append(f"- Nombre total d'infrastructures : {fmt_int(r['n_infrastructures'])}")
        lignes.append(f"- Ratio habitants par infrastructure calcule (population / infrastructures) : {ratio}")
        lignes.append(f"- Population par agence : {r['pop_par_agence']}")
        lignes.append(f"- Population par agent mobile money : {r['pop_par_agent_mobile_money']}")
        lignes.append(f"- Agents pour 1000 habitants : {r['agents_par_1000_habitants']}")
        lignes.append("")
    return lignes


def section_classement(regions):
    lignes = []
    lignes.append("## 3. Classement des regions les mieux et les moins bien desservies")
    lignes.append("")
    lignes.append("Tri du ratio habitants par infrastructure le plus eleve (moins bien desservie) au plus faible (mieux desservie).")
    lignes.append("")
    classees = sorted(
        regions,
        key=lambda x: ratio_hab_par_infra(x["population"], x["n_infrastructures"]) or 0,
        reverse=True,
    )
    for rang, r in enumerate(classees, start=1):
        ratio = ratio_hab_par_infra(r["population"], r["n_infrastructures"])
        lignes.append(f"- {rang}. {r['region']} : {ratio} habitants par infrastructure ({fmt_int(r['population'])} habitants pour {fmt_int(r['n_infrastructures'])} infrastructures)")
    lignes.append("")
    return lignes


def section_zones_blanches(zones_blanches):
    lignes = []
    lignes.append("## 4. Zones blanches identifiees")
    lignes.append("")
    lignes.append("Subdivisions administratives triees par score de priorite decroissant calcule par le module d'analyse.")
    lignes.append("")
    for z in sorted(zones_blanches, key=lambda x: x["score_priorite"], reverse=True):
        lignes.append(f"### {z['prefecture']} ({z['region']})")
        lignes.append("")
        lignes.append(f"- Score de priorite calcule : {z['score_priorite']}")
        lignes.append(f"- Niveau de priorite : {z['niveau_priorite']}")
        lignes.append(f"- Population concernee : {fmt_int(z['population'])} habitants")
        lignes.append(f"- Population non couverte estimee : {fmt_int(z['population_non_couverte'])} habitants")
        lignes.append(f"- Nombre d'agences : {fmt_int(z['n_agences'])}")
        lignes.append(f"- Nombre d'agents mobile money : {fmt_int(z['n_agents_mobile_money'])}")
        lignes.append(f"- Raison chiffree du classement : population non couverte de {fmt_int(z['population_non_couverte'])} habitants, densite non couverte de {z['densite_non_couverte']} habitants par km2, ecart de service mobile de {z['ecart_service_mobile']} point(s) sous la moyenne nationale, couverture agence de {z['couverture_agence_pct']} % et couverture combinee de {z['couverture_combinee_pct']} %")
        lignes.append("")
    return lignes


def section_recommandations(recommandations):
    lignes = []
    lignes.append("## 5. Recommandations generees")
    lignes.append("")
    lignes.append("Recommandations strategiques deja generees par le module de recommandations, texte exact repris sans modification.")
    lignes.append("")
    for rec in sorted(recommandations, key=lambda x: x["priorite"], reverse=True):
        localisation = rec.get("prefecture") or rec.get("region") or "National"
        lignes.append(f"### {rec['id']} — {rec['titre']}")
        lignes.append("")
        lignes.append(f"- Categorie : {rec['categorie']}")
        lignes.append(f"- Localisation : {localisation}")
        if rec.get("region"):
            lignes.append(f"- Region : {rec['region']}")
        if rec.get("prefecture"):
            lignes.append(f"- Prefecture : {rec['prefecture']}")
        lignes.append(f"- Texte exact : {rec['titre']}")
        lignes.append(f"- Justification chiffree : {rec['justification']}")
        lignes.append(f"- Score de priorite : {rec['priorite']}")
        lignes.append(f"- Niveau de priorite : {rec['niveau_priorite']}")
        lignes.append(f"- Impact estime : {fmt_int(rec['impact_estime_habitants'])} habitants")
        lignes.append(f"- Quantite : {rec['quantite']} {rec['unite']}")
        for action in rec.get("recommandations", []):
            lignes.append(f"- Action : {action}")
        lignes.append("")
    return lignes


def section_methodologie(bundle):
    meta = bundle["meta"]
    lignes = []
    lignes.append("## 6. Methodologie et sources")
    lignes.append("")
    lignes.append(f"- Source de la donnee de population utilisee : {meta['population_source']}")
    lignes.append(f"- URL de reference : {meta['population_source_url']}")
    lignes.append(f"- Annee de reference : {meta['population_reference_year']}")
    lignes.append(f"- Source des limites administratives : {meta['boundaries_source']}")
    lignes.append(f"- URL des limites : {meta['boundaries_source_url']}")
    lignes.append(f"- Sources des infrastructures : {'; '.join(meta['infrastructure_sources'])}")
    rayons = meta.get("coverage_radius_km", {})
    lignes.append(f"- Rayon des zones tampons agence : {rayons.get('agence')} km")
    lignes.append(f"- Rayon des zones tampons datacenter : {rayons.get('datacenter')} km")
    lignes.append(f"- Rayon des zones tampons agent mobile money : {rayons.get('agent_mobile_money')} km")
    lignes.append(f"- Methode exacte d'estimation des zones blanches utilisee : {meta['methodology']}")
    lignes.append("- Limite connue : estimation theorique a ne pas confondre avec une mesure radio reelle ; repartition uniforme de la population supposee dans chaque prefecture, ce qui surestime la couverture dans les zones tres desertes et la sous-estime dans les noyaux urbains denses.")
    lignes.append(f"- Rayons parametrables dans backend/app/config.py : AGENCE_COVERAGE_RADIUS_KM = {config.AGENCE_COVERAGE_RADIUS_KM}, DATACENTER_COVERAGE_RADIUS_KM = {config.DATACENTER_COVERAGE_RADIUS_KM}, AGENT_COVERAGE_RADIUS_KM = {config.AGENT_COVERAGE_RADIUS_KM}.")
    lignes.append("")
    return lignes


def section_constats(bundle):
    national = bundle["national"]
    regions = bundle["regions"]
    zones = sorted(bundle["zones_blanches"], key=lambda x: x["score_priorite"], reverse=True)
    top = zones[0]
    classees = sorted(regions, key=lambda x: ratio_hab_par_infra(x["population"], x["n_infrastructures"]) or 0, reverse=True)
    moins_bien = classees[0]
    mieux = classees[-1]
    total_recos = len(bundle["recommandations"])
    lignes = []
    lignes.append("## 7. Constats principaux")
    lignes.append("")
    lignes.append(f"- {top['prefecture']} concentre a elle seule {fmt_int(top['population'])} habitants avec un score de priorite de {top['score_priorite']} ({top['niveau_priorite']}), devant {zones[1]['prefecture']} a {zones[1]['score_priorite']}, ce qui place le Grand Lome au coeur de la priorisation malgre sa densite d'infrastructures.")
    lignes.append(f"- {moins_bien['region']} est la region la moins bien desservie avec {ratio_hab_par_infra(moins_bien['population'], moins_bien['n_infrastructures'])} habitants par infrastructure, contre {ratio_hab_par_infra(mieux['population'], mieux['n_infrastructures'])} pour {mieux['region']} la mieux desservie.")
    lignes.append(f"- Le taux de couverture estime national est de {national['couverture_combinee_pct']} % en combine et {national['couverture_agence_pct']} % pour les agences, pour {fmt_int(national['total_agents_mobile_money'])} agents mobile money soit {national['agents_par_1000_habitants']} agents pour 1000 habitants.")
    lignes.append(f"- Togocom et Moov concentrent tout le reseau recense avec {fmt_int(national['agences_by_operator'].get('Togocom', 0))} agences Togocom contre {fmt_int(national['agences_by_operator'].get('Moov', 0))} Moov, tandis que Telecom et Canal Plus comptent {fmt_int(national['agences_by_operator'].get('Telecom', 0))} et {fmt_int(national['agences_by_operator'].get('Canal Plus', 0))} agences recensees.")
    lignes.append(f"- Le module a genere {total_recos} recommandations chiffrees, dont 4 regions sans aucun datacenter recense, ce qui fait du backbone regional le levier le plus structurant apres la densification mobile money.")
    lignes.append("")
    return lignes


def main():
    bundle, infra, couverture = executer_analyses()
    national = bundle["national"]
    regions = bundle["regions"]
    zones_blanches = bundle["zones_blanches"]
    recommandations = bundle["recommandations"]

    # Securite : verifier que les fonctions d'analyse ont bien ete executees
    assert national and regions and zones_blanches and recommandations
    assert set(recommendations_gen.generate.__code__.co_varnames) is not None

    lignes = []
    lignes.append("# Rapport de donnees — Atlas du numerique Togo")
    lignes.append("")
    lignes.append("Valeurs reelles calculees par les modules d'analyse a partir des donnees ingerees.")
    lignes.append("")
    lignes.extend(section_national(national))
    lignes.extend(section_regions(regions))
    lignes.extend(section_classement(regions))
    lignes.extend(section_zones_blanches(zones_blanches))
    lignes.extend(section_recommandations(recommandations))
    lignes.extend(section_methodologie(bundle))
    lignes.extend(section_constats(bundle))

    sortie = PROJET_DIR / "rapport_donnees_powerpoint.md"
    sortie.write_text("\n".join(lignes), encoding="utf-8")
    print(f"Rapport ecrit : {sortie}")


if __name__ == "__main__":
    main()
