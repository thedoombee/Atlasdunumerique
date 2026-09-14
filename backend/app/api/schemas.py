from functools import lru_cache
from typing import Literal

import pandas as pd
from pydantic import BaseModel, Field

from app import config


def load_infrastructures() -> pd.DataFrame:
    frame = pd.read_parquet(config.PROCESSED_INFRASTRUCTURES_PARQUET)
    return frame


def load_analysis() -> dict:
    with open(config.PROCESSED_ANALYSIS_JSON, encoding="utf-8") as handle:
        import json

        return json.load(handle)


def load_prefectures_geojson() -> dict:
    return load_geojson(config.PROCESSED_PREFECTURES_GEOJSON)


def load_regions_geojson() -> dict:
    return load_geojson(config.PROCESSED_REGIONS_GEOJSON)


def load_geojson(path) -> dict:
    import json

    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def write_analysis(bundle: dict) -> None:
    import json

    config.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(config.PROCESSED_ANALYSIS_JSON, "w", encoding="utf-8") as handle:
        json.dump(bundle, handle, ensure_ascii=False, indent=2)


class OperatorOption(BaseModel):
    value: str
    label: str
    total_count: int
    agence_count: int
    agent_count: int


class FilterOption(BaseModel):
    value: str
    label: str
    count: int


class PrefectureOption(BaseModel):
    value: str
    region: str
    count: int


class SourceOption(BaseModel):
    value: str
    label: str
    count: int


class FilterOptions(BaseModel):
    operators: list[OperatorOption]
    types: list[FilterOption]
    regions: list[FilterOption]
    prefectures: list[PrefectureOption]
    sources: list[SourceOption]


class InfrastructureItem(BaseModel):
    id: str
    nom: str
    type: Literal["agence", "datacenter", "agent_mobile_money"]
    operateur: str | None
    operateurs: list[str]
    latitude: float
    longitude: float
    region: str | None = None
    prefecture: str | None = None
    commune: str | None = None
    canton: str | None = None
    localite: str = ""
    adresse: str = ""
    categorie: str = ""


class PaginatedInfrastructures(BaseModel):
    items: list[InfrastructureItem]
    total: int
    page: int
    per_page: int
    pages: int


class Concentration(BaseModel):
    dissimilarite_agents_regions: float
    dissimilarite_agences_regions: float
    dissimilarite_agents_prefectures: float
    dissimilarite_agences_prefectures: float
    part_population_grand_lome_pct: float
    part_agents_grand_lome_pct: float
    part_agents_top3_prefectures_pct: float
    part_population_top3_prefectures_pct: float


class NationalSummary(BaseModel):
    total_population: int
    area_km2: float
    pop_density: float
    total_infrastructures: int
    total_agences: int
    total_agents_mobile_money: int
    total_datacenters: int
    agences_by_operator: dict[str, int]
    agents_by_operator: dict[str, int]
    pop_par_agence: float | None
    pop_par_agent_mobile_money: float | None
    agents_par_1000_habitants: float
    population_couverte_agence: int
    population_couverte_combinee: int
    couverture_agence_pct: float
    couverture_combinee_pct: float
    n_regions: int
    n_prefectures: int


class RegionIndicators(BaseModel):
    region: str
    population: int
    area_km2: float
    pop_density: float
    n_agences: int
    n_agents_mobile_money: int
    n_datacenters: int
    n_infrastructures: int
    agences_by_operator: dict[str, int]
    pop_par_agence: float | None
    pop_par_agent_mobile_money: float | None
    agents_par_1000_habitants: float
    couverture_agence_pct: float
    ratio_adequation_agents: float | None


class PrefectureIndicators(BaseModel):
    prefecture: str
    region: str
    population: int
    area_km2: float
    pop_density: float
    n_agences: int
    n_agents_mobile_money: int
    n_datacenters: int
    n_infrastructures: int
    agences_by_operator: dict[str, int]
    pop_par_agence: float | None
    pop_par_agent_mobile_money: float | None
    agents_par_1000_habitants: float
    couverture_agence_pct: float
    couverture_agent_pct: float
    couverture_combinee_pct: float
    population_couverte_agence: int
    population_non_couverte: int
    densite_non_couverte: float
    ecart_service_mobile: float
    score_priorite: float
    niveau_priorite: str


class PopulationMeta(BaseModel):
    source: str
    source_url: str
    reference_year: int
    total_population: int


class PopulationRecord(BaseModel):
    region: str
    prefecture: str
    population_total: int
    population_male: int
    population_female: int
    area_km2: float
    pop_density: float


class PopulationResponse(BaseModel):
    meta: PopulationMeta
    records: list[PopulationRecord]


class CoverageMethodology(BaseModel):
    radius_km: dict[str, float]
    text: str


class CoveragePrefecture(BaseModel):
    prefecture: str
    region: str
    population: int
    n_agences: int
    n_agents_mobile_money: int
    couverture_agence_pct: float
    couverture_agent_pct: float
    couverture_combinee_pct: float
    population_non_couverte: int
    score_priorite: float
    niveau_priorite: str


class CoverageResponse(BaseModel):
    methodology: CoverageMethodology
    prefectures: list[CoveragePrefecture]


class WhiteZone(BaseModel):
    prefecture: str
    region: str
    population: int
    population_non_couverte: int
    score_priorite: float
    niveau_priorite: str
    couverture_agence_pct: float
    n_agences: int
    n_agents_mobile_money: int


class WhiteZonesResponse(BaseModel):
    methodology: CoverageMethodology
    items: list[WhiteZone]


class Recommendation(BaseModel):
    id: str
    priorite: float
    niveau_priorite: str
    region: str | None
    prefecture: str | None
    categorie: str
    titre: str
    justification: str
    impact_estime_habitants: int
    quantite: int
    unite: str
    recommandations: list[str]


class RecommendationsResponse(BaseModel):
    items: list[Recommendation]


class MetaResponse(BaseModel):
    generated_at: str
    population_source: str
    population_source_url: str
    population_reference_year: int
    boundaries_source: str
    boundaries_source_url: str
    infrastructure_sources: list[str]
    methodology: str


def filtered_frame(status: bool = True) -> pd.DataFrame:
    return load_infrastructures()


def build_filter_options(frame: pd.DataFrame) -> FilterOptions:
    operators_list = ["Moov", "Togocom", "Telecom", "Canal Plus"]
    operator_rows = []
    for operator in operators_list:
        engine_frame = frame.loc[frame["operateurs"].str.contains(operator, regex=False)]
        operator_rows.append(OperatorOption(
            value=operator,
            label=operator,
            total_count=int(len(engine_frame)),
            agence_count=int((engine_frame["type"] == "agence").sum()),
            agent_count=int((engine_frame["type"] == "agent_mobile_money").sum()),
        ))

    type_rows = []
    type_labels = {
        "agence": "Agence",
        "datacenter": "Datacenter",
        "agent_mobile_money": "Agent mobile money",
    }
    for inf_type, label in type_labels.items():
        subset = frame.loc[frame["type"] == inf_type]
        type_rows.append(FilterOption(value=inf_type, label=label, count=int(len(subset))))

    region_rows = []
    for region, subset in frame.groupby("region"):
        region_rows.append(FilterOption(value=region, label=region, count=int(len(subset))))

    prefecture_rows = []
    grouped = frame.groupby(["prefecture", "region"]).size().reset_index(name="count")
    for _, row in grouped.iterrows():
        prefecture_rows.append(PrefectureOption(
            value=row["prefecture"], region=row["region"], count=int(row["count"]),
        ))
    prefecture_rows.sort(key=lambda item: (item.region, item.value))

    source_rows = []
    for source, count in frame.groupby("source").size().items():
        source_rows.append(SourceOption(value=source, label=source, count=int(count)))

    return FilterOptions(
        operators=operator_rows,
        types=type_rows,
        regions=sorted(region_rows, key=lambda item: item.value),
        prefectures=prefecture_rows,
        sources=sorted(source_rows, key=lambda item: item.value),
    )