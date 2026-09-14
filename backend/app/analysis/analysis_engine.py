from __future__ import annotations

import json
import unicodedata
from datetime import datetime, timezone

import geopandas as gpd
import numpy as np
import pandas as pd

from app import config
from app.analysis import coverage_model, recommendations_gen

CANONICAL_BY_KEY = {
    "agoe nyive": "Agoè-Nyivé",
    "akebou": "Akébou",
    "anie": "Anié",
    "ave": "Avé",
    "cinkasse": "Cinkassé",
    "keran": "Kéran",
    "kpele": "Kpélé",
    "tandjoare": "Tandjoaré",
    "tone": "Tône",
    "naki ouest": "Kpendjal-Ouest",
    "naki-ouest": "Kpendjal-Ouest",
    "plaine du mo": "Mô",
    "plaine-du-mo": "Mô",
    "lome commune": "Golfe",
    "lome-commune": "Golfe",
    "agoè-nyivé": "Agoè-Nyivé",
    "akébou": "Akébou",
    "anié": "Anié",
    "cinkassé": "Cinkassé",
    "kénake": "Kéran",
    "kéran": "Kéran",
    "kpélé": "Kpélé",
    "tandjoaré": "Tandjoaré",
    "tône": "Tône",
    "kpendjal-ouest": "Kpendjal-Ouest",
    "mô": "Mô",
}


def accent_key(value):
    if value is None:
        return ""
    text = str(value).lower().strip()
    text = text.replace("-", " ").replace("_", " ")
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return " ".join(text.split())


def canonical_prefecture_name(raw_name):
    key = accent_key(raw_name)
    return CANONICAL_BY_KEY.get(key, raw_name.strip())


def _safe_ratio(numerator, denominator):
    if denominator is None or denominator == 0:
        return None
    if numerator is None or numerator == 0:
        return 0.0
    return round(numerator / denominator, 2)


def _pct(numerator, denominator):
    if denominator is None or denominator == 0:
        return 0.0
    return round(numerator * 100.0 / denominator, 2)


def prepare_geographies():
    gdf = gpd.read_file(config.REFERENCE_DIR / "togo_admin2_boundaries.geojson")
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    else:
        gdf = gdf.to_crs("EPSG:4326")

    population = pd.read_csv(config.REFERENCE_DIR / "prefectures_population_rgph5_2022.csv")
    population["population_key"] = population["prefecture"].map(accent_key)

    gdf["prefecture_raw"] = gdf["adm2_name"]
    gdf["prefecture"] = gdf["adm2_name"].map(canonical_prefecture_name)
    gdf["region"] = gdf["adm1_name"].str.strip()
    gdf["prefecture_key"] = gdf["prefecture"].map(accent_key)

    population_map = population.set_index("population_key")["population_total"].to_dict()
    male_map = population.set_index("population_key")["population_male"].to_dict()
    female_map = population.set_index("population_key")["population_female"].to_dict()
    gdf["population_total"] = gdf["prefecture_key"].map(population_map)
    gdf["population_male"] = gdf["prefecture_key"].map(male_map)
    gdf["population_female"] = gdf["prefecture_key"].map(female_map)

    if gdf["population_total"].isna().any():
        missing = gdf.loc[gdf["population_total"].isna(), "prefecture"].tolist()
        raise ValueError(f"Prefectures sans population: {missing}")

    keep = [
        "prefecture", "region", "population_total", "population_male",
        "population_female", "geometry",
    ]
    gdf = gdf[keep]
    gdf = gdf.dissolve(by="prefecture", aggfunc="first").reset_index()
    gdf["region"] = gdf.groupby("prefecture")["region"].transform("first")

    projected = gdf.to_crs(config.COUNTRY_EPSG)
    gdf["area_km2"] = round(projected.geometry.area / 1_000_000.0, 2)
    gdf["pop_density"] = round(
        gdf["population_total"] / gdf["area_km2"].replace(0, np.nan), 1
    )

    regions = gdf.dissolve(by="region", aggfunc="sum").reset_index()
    regions = regions[["region", "population_total", "area_km2", "geometry"]].copy()
    regions["pop_density"] = round(
        regions["population_total"] / regions["area_km2"].replace(0, np.nan), 1
    )

    gdf_out = gdf[["prefecture", "region", "population_total", "population_male",
                   "population_female", "area_km2", "pop_density", "geometry"]]
    gdf_out.to_file(config.PROCESSED_PREFECTURES_GEOJSON, driver="GeoJSON", encoding="utf-8")

    pop_out = gdf[["region", "prefecture", "population_male", "population_female",
                   "population_total", "area_km2", "pop_density"]].copy()
    pop_out = pop_out.sort_values(["region", "prefecture"]).reset_index(drop=True)
    pop_out.to_parquet(config.PROCESSED_POPULATION_PARQUET, index=False)

    regions.to_file(config.PROCESSED_REGIONS_GEOJSON, driver="GeoJSON", encoding="utf-8")

    return gdf, regions, population


def _per_prefecture_counts(infra, prefectures):
    rows = []
    agence_subset = infra.loc[infra["type"] == "agence"] if infra is not None else None
    agent_subset = infra.loc[infra["type"] == "agent_mobile_money"] if infra is not None else None
    datacenter_subset = infra.loc[infra["type"] == "datacenter"] if infra is not None else None

    agence_totals = agence_subset.groupby("prefecture").size() if agence_subset is not None else None
    agent_totals = agent_subset.groupby("prefecture").size() if agent_subset is not None else None
    datacenter_totals = datacenter_subset.groupby("prefecture").size() if datacenter_subset is not None else None

    if agence_subset is not None and not agence_subset.empty:
        pivot = agence_subset.pivot_table(
            index="prefecture", columns="operateur", values="id",
            aggfunc="count", fill_value=0,
        )
        pivot = pivot.reindex(columns=["Moov", "Togocom", "Telecom", "Canal Plus"], fill_value=0)
    else:
        pivot = None

    for prefecture in prefectures["prefecture"]:
        n_agences = int(agence_totals.get(prefecture, 0)) if agence_totals is not None else 0
        n_agents = int(agent_totals.get(prefecture, 0)) if agent_totals is not None else 0
        n_datacenters = int(datacenter_totals.get(prefecture, 0)) if datacenter_totals is not None else 0
        row = {
            "prefecture": prefecture,
            "n_agences": n_agences,
            "n_agents_mobile_money": n_agents,
            "n_datacenters": n_datacenters,
            "n_infrastructures": n_agences + n_agents + n_datacenters,
            "agences_moov": 0, "agences_togocom": 0, "agences_telecom": 0, "agences_canal": 0,
        }
        if pivot is not None and prefecture in pivot.index:
            cell = pivot.loc[prefecture]
            row["agences_moov"] = int(cell.get("Moov", 0) or 0)
            row["agences_togocom"] = int(cell.get("Togocom", 0) or 0)
            row["agences_telecom"] = int(cell.get("Telecom", 0) or 0)
            row["agences_canal"] = int(cell.get("Canal Plus", 0) or 0)
        rows.append(row)
    return pd.DataFrame(rows)


def _regional_aggregates(infra, prefectures):
    summary = prefectures.groupby("region")[
        ["population_total", "area_km2"]
    ].sum().reset_index()
    summary["pop_density"] = round(summary["population_total"] / summary["area_km2"], 1)

    agence_totals = infra.loc[infra["type"] == "agence"].groupby("region").size().rename("n_agences")
    agent_totals = infra.loc[infra["type"] == "agent_mobile_money"].groupby("region").size().rename("n_agents_mobile_money")
    datacenter_totals = infra.loc[infra["type"] == "datacenter"].groupby("region").size().rename("n_datacenters")
    infra_totals = infra.groupby("region").size().rename("n_infrastructures")

    summary = summary.merge(agence_totals, on="region", how="left")
    summary = summary.merge(agent_totals, on="region", how="left")
    summary = summary.merge(datacenter_totals, on="region", how="left")
    summary = summary.merge(infra_totals, on="region", how="left")
    for column in ["n_agences", "n_agents_mobile_money", "n_datacenters", "n_infrastructures"]:
        summary[column] = summary[column].fillna(0).astype(int)

    if not infra.loc[infra["type"] == "agence"].empty:
        pivot = infra.loc[infra["type"] == "agence"].pivot_table(
            index="region", columns="operateur", values="id", aggfunc="count", fill_value=0,
        )
        pivot = pivot.reindex(columns=["Moov", "Togocom", "Telecom", "Canal Plus"], fill_value=0)
        for column in ["Moov", "Togocom", "Telecom", "Canal Plus"]:
            summary[f"agences_{column.lower().replace(' ', '_')}"] = pivot[column].astype(int).values
    else:
        for column in ["Moov", "Togocom", "Telecom", "Canal Plus"]:
            summary[f"agences_{column.lower().replace(' ', '_')}"] = 0
    return summary


def _safe_int(value):
    try:
        if pd.isna(value):
            return 0
        return int(value)
    except (TypeError, ValueError):
        return 0


def run_analysis(infra: pd.DataFrame, prefectures: gpd.GeoDataFrame, regions: gpd.GeoDataFrame, population: pd.DataFrame):
    coverage = coverage_model.compute_coverage(infra, prefectures)
    merged = prefectures.merge(coverage, on=["prefecture", "region"], how="left")
    counts = _per_prefecture_counts(infra, prefectures)
    merged = merged.merge(counts, on="prefecture", how="left")

    national_population = int(merged["population_total"].sum())
    national_area = float(merged["area_km2"].sum())
    n_agences = int(merged["n_agences"].sum())
    n_agents = int(merged["n_agents_mobile_money"].sum())
    n_datacenters = int(merged["n_datacenters"].sum())
    n_infra = n_agences + n_agents + n_datacenters

    agence_counts = merged[["agences_moov", "agences_togocom", "agences_telecom", "agences_canal"]].sum()
    by_operator = {
        "Moov": int(agence_counts["agences_moov"]),
        "Togocom": int(agence_counts["agences_togocom"]),
        "Telecom": int(agence_counts["agences_telecom"]),
        "Canal Plus": int(agence_counts["agences_canal"]),
    }

    agent_operator_counts = infra.loc[infra["type"] == "agent_mobile_money", "operateur"].str.split(",").explode().value_counts().to_dict() if not infra[infra["type"] == "agent_mobile_money"].empty else {}
    agent_operator_counts = {op: int(value) for op, value in agent_operator_counts.items()}

    population_couverte_agence = float((merged["couverture_agence_pct"] / 100.0 * merged["population_total"]).sum())
    population_couverte_combinee = float((merged["couverture_combinee_pct"] / 100.0 * merged["population_total"]).sum())

    national = {
        "total_population": national_population,
        "area_km2": round(national_area, 1),
        "pop_density": round(national_population / national_area, 1),
        "total_infrastructures": n_infra,
        "total_agences": n_agences,
        "total_agents_mobile_money": n_agents,
        "total_datacenters": n_datacenters,
        "agences_by_operator": by_operator,
        "agents_by_operator": agent_operator_counts,
        "pop_par_agence": _safe_ratio(national_population, n_agences),
        "pop_par_agent_mobile_money": _safe_ratio(national_population, n_agents),
        "agents_par_1000_habitants": round(n_agents * 1000.0 / national_population, 2),
        "population_couverte_agence": int(population_couverte_agence),
        "population_couverte_combinee": int(population_couverte_combinee),
        "couverture_agence_pct": round(population_couverte_agence / national_population * 100.0, 2),
        "couverture_combinee_pct": round(population_couverte_combinee / national_population * 100.0, 2),
        "n_regions": int(prefectures["region"].nunique()),
        "n_prefectures": int(prefectures["prefecture"].nunique()),
    }

    base_agent_ratio = national["agents_par_1000_habitants"]

    region_summary = _regional_aggregates(infra, prefectures)
    region_pop_map = region_summary.set_index("region")["population_total"].to_dict()
    region_rows = []
    for _, row in region_summary.iterrows():
        population_value = int(row["population_total"])
        cov_pct = round(region_summary_coverage(merged, row["region"], national_population), 2)
        region_rows.append({
            "region": row["region"],
            "population": population_value,
            "area_km2": round(float(row["area_km2"]), 1),
            "pop_density": round(float(row["pop_density"]), 1),
            "n_agences": int(row["n_agences"]),
            "n_agents_mobile_money": int(row["n_agents_mobile_money"]),
            "n_datacenters": int(row["n_datacenters"]),
            "n_infrastructures": int(row["n_infrastructures"]),
            "agences_by_operator": {
                "Moov": int(row["agences_moov"]),
                "Togocom": int(row["agences_togocom"]),
                "Telecom": int(row["agences_telecom"]),
                "Canal Plus": int(row.get("agences_canal", 0)),
            },
            "pop_par_agence": _safe_ratio(population_value, int(row.get("n_agences", 0))),
            "pop_par_agent_mobile_money": _safe_ratio(population_value, int(row.get("n_agents_mobile_money", 0))),
            "agents_par_1000_habitants": round(int(row.get("n_agents_mobile_money", 0)) * 1000.0 / population_value, 2),
            "couverture_agence_pct": cov_pct,
            "ratio_adequation_agents": _safe_ratio(_safe_ratio(population_value, int(row["n_agents_mobile_money"])), base_agent_ratio),
        })
    regions_output = sorted(region_rows, key=lambda item: item["region"])

    max_uncovered_pop = 0.0
    max_uncovered_density = 0.0
    max_service_gap = 0.0
    prefecture_rows = []
    for _, row in merged.iterrows():
        prefecture = row["prefecture"]
        region = row["region"]
        population_value = int(row["population_total"])
        area_km2 = float(row["area_km2"])
        density = float(row["pop_density"])
        cov_agence = float(row["couverture_agence_pct"]) / 100.0
        cov_agent = float(row["couverture_agent_pct"]) / 100.0
        cov_combine = float(row["couverture_combinee_pct"]) / 100.0
        uncovered_pop = population_value * (1.0 - cov_agence)
        uncovered_density = uncovered_pop / area_km2 if area_km2 else 0.0
        agents_1000 = (row["n_agents_mobile_money"] * 1000.0 / population_value) if population_value else 0.0
        service_gap = max(0.0, base_agent_ratio - agents_1000)
        prefecture_rows.append({
            "prefecture": prefecture,
            "region": region,
            "population": population_value,
            "area_km2": round(area_km2, 1),
            "pop_density": round(density, 1),
            "n_agences": int(row["n_agences"]),
            "n_agents_mobile_money": int(row["n_agents_mobile_money"]),
            "n_datacenters": int(row["n_datacenters"]),
            "n_infrastructures": int(row["n_infrastructures"]),
            "agences_by_operator": {
                "Moov": int(row["agences_moov"]),
                "Togocom": int(row["agences_togocom"]),
                "Telecom": int(row["agences_telecom"]),
                "Canal Plus": int(row["agences_canal"]),
            },
            "pop_par_agence": _safe_ratio(population_value, int(row["n_agences"])),
            "pop_par_agent_mobile_money": _safe_ratio(population_value, int(row["n_agents_mobile_money"])),
            "agents_par_1000_habitants": round(agents_1000, 2),
            "couverture_agence_pct": round(cov_agence * 100.0, 2),
            "couverture_agent_pct": round(cov_agent * 100.0, 2),
            "couverture_combinee_pct": round(cov_combine * 100.0, 2),
            "population_couverte_agence": int(population_value * cov_agence),
            "population_non_couverte": int(uncovered_pop),
            "densite_non_couverte": round(uncovered_density, 2),
            "ecart_service_mobile": round(service_gap, 2),
        })
        max_uncovered_pop = max(max_uncovered_pop, uncovered_pop)
        max_uncovered_density = max(max_uncovered_density, uncovered_density)
        max_service_gap = max(max_service_gap, service_gap)

    for item in prefecture_rows:
        norm_pop = item["population_non_couverte"] / max_uncovered_pop if max_uncovered_pop else 0.0
        norm_density = item["densite_non_couverte"] / max_uncovered_density if max_uncovered_density else 0.0
        norm_service = item["ecart_service_mobile"] / max_service_gap if max_service_gap else 0.0
        score = 100.0 * (0.5 * norm_pop + 0.35 * norm_density + 0.15 * norm_service)
        item["score_priorite"] = round(score, 1)
        if score >= 60:
            niveau = "Haute"
        elif score >= 30:
            niveau = "Moyenne"
        else:
            niveau = "Faible"
        item["niveau_priorite"] = niveau

    zones_blanches = sorted(prefecture_rows, key=lambda item: item["score_priorite"], reverse=True)
    prefectures_output = sorted(prefecture_rows, key=lambda item: (item["region"], item["prefecture"]))

    recommendations = recommendations_gen.generate(national, regions_output, zones_blanches, merged, infra)

    concentration = compute_concentration(prefectures_output, regions_output, national)

    bundle = {
        "meta": build_meta(),
        "national": national,
        "regions": regions_output,
        "prefectures": prefectures_output,
        "zones_blanches": zones_blanches,
        "recommandations": recommendations,
        "concentration": concentration,
    }

    enriched_gdf = merged.copy()
    for item in prefectures_output:
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "score_priorite"] = item["score_priorite"]
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "niveau_priorite"] = item["niveau_priorite"]
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "couverture_agence_pct"] = item["couverture_agence_pct"]
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "couverture_combinee_pct"] = item["couverture_combinee_pct"]
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "n_infrastructures"] = item["n_infrastructures"]
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "agents_par_1000_habitants"] = item["agents_par_1000_habitants"]
        enriched_gdf.loc[enriched_gdf["prefecture"] == item["prefecture"], "pop_par_agent_mobile_money"] = item["pop_par_agent_mobile_money"]
    for _, row in enriched_gdf.iterrows():
        if not row["geometry"].is_valid:
            enriched_gdf.loc[enriched_gdf["prefecture"] == row["prefecture"], "geometry"] = row["geometry"].buffer(0)

    config.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    from app.api.schemas import write_analysis

    write_analysis(bundle)
    enriched_gdf.to_file(config.PROCESSED_PREFECTURES_GEOJSON, driver="GeoJSON", encoding="utf-8")
    return bundle


def region_summary_coverage(merged, region, national_population):
    subset = merged.loc[merged["region"] == region]
    if subset.empty:
        return 0.0
    covered = float((subset["couverture_agence_pct"] / 100.0 * subset["population_total"]).sum())
    pop = float(subset["population_total"].sum())
    if pop <= 0:
        return 0.0
    return covered / pop * 100.0


def compute_concentration(prefectures_output, regions_output, national):
    total_pop = national["total_population"]

    def dissimilarity(items, attrib_pop, attrib_value):
        pop_share = {item["region"]: item[attrib_pop] / total_pop for item in items}
        value_total = sum(item[attrib_value] for item in items) or 1
        value_share = {item["region"]: item[attrib_value] / value_total for item in items}
        return round(0.5 * sum(abs(pop_share[key] - value_share.get(key, 0)) for key in pop_share), 3)

    agents_dissim_regions = dissimilarity(regions_output, "population", "n_agents_mobile_money")
    agences_dissim_regions = dissimilarity(regions_output, "population", "n_agences")

    total_pop_p = sum(item["population"] for item in prefectures_output)
    total_agents = sum(item["n_agents_mobile_money"] for item in prefectures_output) or 1
    total_agences = sum(item["n_agences"] for item in prefectures_output) or 1

    def prefecture_dissimilarity(items, attrib_value):
        value_total = sum(item[attrib_value] for item in items) or 1
        return round(0.5 * sum(abs(item["population"] / total_pop_p - item[attrib_value] / value_total) for item in items), 3)

    grand_lome_pop = sum(item["population"] for item in prefectures_output if item["prefecture"] in ("Golfe", "Agoè-Nyivé"))
    grand_lome_agents = sum(item["n_agents_mobile_money"] for item in prefectures_output if item["prefecture"] in ("Golfe", "Agoè-Nyivé"))

    agents_sorted = sorted(prefectures_output, key=lambda item: item["n_agents_mobile_money"], reverse=True)
    top3_agents = sum(item["n_agents_mobile_money"] for item in agents_sorted[:3]) / total_agents * 100.0
    top3_pop = sum(item["population"] for item in agents_sorted[:3]) / total_pop_p * 100.0

    return {
        "dissimilarite_agents_regions": agents_dissim_regions,
        "dissimilarite_agences_regions": agences_dissim_regions,
        "dissimilarite_agents_prefectures": prefecture_dissimilarity(prefectures_output, "n_agents_mobile_money"),
        "dissimilarite_agences_prefectures": prefecture_dissimilarity(prefectures_output, "n_agences"),
        "part_population_grand_lome_pct": round(grand_lome_pop / total_pop_p * 100.0, 2),
        "part_agents_grand_lome_pct": round(grand_lome_agents / total_agents * 100.0, 2),
        "part_agents_top3_prefectures_pct": round(top3_agents, 2),
        "part_population_top3_prefectures_pct": round(top3_pop, 2),
    }


def build_meta():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "generated_at": now,
        "population_source": config.POPULATION_SOURCE_LABEL,
        "population_source_url": config.POPULATION_SOURCE_URL,
        "population_reference_year": config.POPULATION_REFERENCE_YEAR,
        "boundaries_source": config.BOUNDARIES_SOURCE_LABEL,
        "boundaries_source_url": config.BOUNDARIES_SOURCE_URL,
        "infrastructure_sources": [
            "geodata.gouv.tg: agences Moov, agences Togocom, agences Telecom, agences Canal Plus, datacenters etablissements, agents mobile money (fichiers locaux GeoJSON)",
        ],
        "coverage_radius_km": {
            "agence": config.AGENCE_COVERAGE_RADIUS_KM,
            "datacenter": config.DATACENTER_COVERAGE_RADIUS_KM,
            "agent_mobile_money": config.AGENT_COVERAGE_RADIUS_KM,
        },
        "methodology": (
            "La couverture n'est pas mesuree mais estimee. Un tampon circulaire de rayon parametrable est trace "
            "autour de chaque infrastructure (15 km autour d'une agence, 25 km autour d'un datacenter, 3 km autour "
            "d'un agent mobile money). Le ratio de couverture d'une prefecture est la part de sa superficie incluse "
            "dans l'union de ces tampons. La population couverte estimee est obtenue en supposant une repartition "
            "uniforme de la population dans la prefecture, ce qui surestime la couverture dans les zones tres "
            "desertes et la sous-estime dans les noyaux urbains denses. Le score de priorite d'une zone blanche "
            "combine la population non couverte (poids 0,5), la densite de population non couverte (poids 0,35) et "
            "l'ecart de service mobile money par rapport a la moyenne nationale (poids 0,15). Cette methodologie est "
            "une estimation theorique, a ne pas confondre avec une mesure radio reelle."
        ),
    }