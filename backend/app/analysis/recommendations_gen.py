from __future__ import annotations

import math


def _population_format(value):
    return f"{int(value):,}".replace(",", " ")


def _operator_balance_note(n_agences, agences_by_operator):
    present = [operator for operator, count in agences_by_operator.items() if count and count > 0]
    absent = [operator for operator in ("Moov", "Togocom") if operator not in present]
    if n_agences == 0:
        return "aucune agence d operateur n est presente"
    if not absent:
        return None
    return "presence exclusive de " + " et ".join(present) + ", absence de " + " et ".join(absent)


def generate(national, regions_output, zones_blanches, merged, infra):
    recommendations = []
    national_pop = national["total_population"]
    national_pop_par_agence = national["pop_par_agence"] or national_pop
    national_pop_par_agent = national["pop_par_agent_mobile_money"] or national_pop

    for item in zones_blanches:
        prefecture = item["prefecture"]
        region = item["region"]
        score = item["score_priorite"]
        if score <= 0:
            continue
        population = item["population"]
        uncovered = item["population_non_couverte"]
        if uncovered <= 0:
            continue
        n_agents = item["n_agents_mobile_money"]
        n_agences = item["n_agences"]

        target_agents = math.ceil(population / national_pop_par_agent)
        missing_agents = max(0, target_agents - n_agents)
        target_agences = max(1, math.ceil(population / national_pop_par_agence))
        missing_agences = max(0, target_agences - n_agences)

        agent_justification = (
            f"{prefecture} compte {_population_format(population)} habitants pour {n_agents} points mobile money, "
            f"soit un ratio de {item['pop_par_agent_mobile_money'] or 'infini'} habitants par point contre {national_pop_par_agent}"
            f" en moyenne nationale, et une population non couverte estimee de {_population_format(uncovered)} habitants."
        )
        if missing_agents > 0:
            recommendations.append({
                "id": f"agent-{prefecture.lower().replace(' ','-')}",
                "priorite": score,
                "niveau_priorite": item["niveau_priorite"],
                "region": region,
                "prefecture": prefecture,
                "categorie": "Densification points mobile money",
                "titre": f"Renforcer le reseau mobile money a {prefecture}",
                "justification": agent_justification,
                "impact_estime_habitants": uncovered,
                "quantite": missing_agents,
                "unite": "points mobile money",
                "recommandations": [
                    f"Implanter au moins {missing_agents} nouveaux points mobile money dans la prefecture de {prefecture}.",
                    "Prioriser les cantons a plus forte densite rurale pour maximiser le nombre de beneficiaries.",
                ],
            })

        agence_justification = (
            f"{prefecture} compte {n_agences} agences pour {_population_format(population)} habitants, soit "
            f"{item['pop_par_agence'] or 'aucune'} habitants par agence contre {national_pop_par_agence} en moyenne nationale."
        )
        if missing_agences > 0:
            recommendations.append({
                "id": f"agence-{prefecture.lower().replace(' ','-')}",
                "priorite": score,
                "niveau_priorite": item["niveau_priorite"],
                "region": region,
                "prefecture": prefecture,
                "categorie": "Extension agences operateurs",
                "titre": f"Creer des points d acces physiques a {prefecture}",
                "justification": agence_justification,
                "impact_estime_habitants": uncovered,
                "quantite": missing_agences,
                "unite": "agences",
                "recommandations": [
                    f"Ouvrir au moins {missing_agences} agences ou comptoirs operateurs dans la prefecture de {prefecture}.",
                    "Co-implanter les agences avec les structures publiques existantes pour reduire les couts.",
                ],
            })

        balance = _operator_balance_note(item["n_agences"], item["agences_by_operator"])
        if balance and uncovered > 0 and score >= 25:
            recommendations.append({
                "id": f"parite-{prefecture.lower().replace(' ','-')}",
                "priorite": round(score * 1.0, 1),
                "niveau_priorite": item["niveau_priorite"],
                "region": region,
                "prefecture": prefecture,
                "categorie": "Parite operateurs",
                "titre": f"Equilibrer l offre operateurs a {prefecture}",
                "justification": f"Dans {prefecture}, {balance}. Cette situation limite le choix des usagers pour "
                                 f"une population de {_population_format(population)} habitants.",
                "impact_estime_habitants": uncovered,
                "quantite": 1,
                "unite": "operateur",
                "recommandations": [
                    f"Encourager l entree ou l extension du ou des operateurs absents a {prefecture}.",
                    "Subordonner les autorisations d extension a un engagement de couverture dans la prefecture.",
                ],
            })

    datacenter_regions = set()
    for region_item in regions_output:
        if region_item["n_datacenters"] and region_item["n_datacenters"] > 0:
            datacenter_regions.add(region_item["region"])
    missing_dc_regions = [item for item in regions_output if item["region"] not in datacenter_regions]
    missing_dc_regions.sort(key=lambda item: item["population"], reverse=True)
    hub_popularity = {
        "Savanes": "Dapaong",
        "Kara": "Kara",
        "Centrale": "Sokode",
        "Plateaux": "Atakpame",
        "Maritime": "Tsovie",
    }
    for index, region_item in enumerate(missing_dc_regions):
        hub = hub_popularity.get(region_item["region"], region_item["region"])
        recommendations.append({
            "id": f"datacenter-{region_item['region'].lower().replace(' ','-')}",
            "priorite": round(100.0 - index * 3.0, 1),
            "niveau_priorite": "Moyenne",
            "region": region_item["region"],
            "prefecture": None,
            "categorie": "Backbone numerique",
            "titre": f"Installer un noeud de proximite dans la region {region_item['region']}",
            "justification": f"Aucun datacenter recense dans la region {region_item['region']} qui concentre "
                             f"{_population_format(region_item['population'])} habitants, contre des infrastructures "
                             f"uniquement situees dans le Grand Lome.",
            "impact_estime_habitants": region_item["population"],
            "quantite": 1,
            "unite": "datacenter regional",
            "recommandations": [
                f"Installer un datacenter regional ou un noeud de colocation a {hub}.",
                "Relier ce noeud au backbone national pour reduire la latence des services numériques du nord.",
            ],
        })

    canal_present = national["agences_by_operator"].get("Canal Plus", 0)
    if canal_present == 0:
        recommendations.append({
            "id": "canal-plus-reseau",
            "priorite": 55.0,
            "niveau_priorite": "Moyenne",
            "region": None,
            "prefecture": None,
            "categorie": "Reseau commercial Canal Plus",
            "titre": "Deployer un reseau d agences Canal Plus hors du Grand Lome",
            "justification": "Le jeu de donnees Canal Plus est vide (aucune agence recensee). Cette absence "
                             "d infrastructure recensee limite l acces a la television payante et aux services "
                             "numeriques de divertissement dans les regions.",
            "impact_estime_habitants": national_pop,
            "quantite": 10,
            "unite": "agences Canal Plus",
            "recommandations": [
                "Recenser et cartographier les revendeurs Canal Plus existants a l echelle nationale.",
                "Etendre le reseau physique dans les chefs-lieux de prefectures non couverts.",
            ],
        })

    recommendations.sort(key=lambda item: item["priorite"], reverse=True)
    for index, item in enumerate(recommendations):
        item["id"] = f"rec-{index + 1:02d}"
    return recommendations