import json
import math
import re
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import shape

from app import config

SOURCE_FILE_REGEX = re.compile(r"^agences_(?P<op>.+?)\.geojson$")


def _normalize_text(value):
    if value is None:
        return ""
    result = str(value).strip()
    result = result.replace("{", "").replace("}", "")
    return result


def _accent_key(value):
    text = _normalize_text(value).lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return text


def _read_source_file(path: Path, source_key: str):
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except UnicodeDecodeError:
        with open(path, encoding="latin-1") as handle:
            data = json.load(handle)
    features = data.get("features", [])
    if not isinstance(features, list):
        features = []
    records = []
    for index, feature in enumerate(features):
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        record = {"source": source_key, "index": index}
        record.update(props)
        record["_geometry"] = geometry
        records.append(record)
    return records


def _parse_operator(properties, source_key) -> str | None:
    category = _accent_key(properties.get("activite_categorie") or "")
    eligible = properties.get("operateur") or ""
    if not category and eligible:
        keys = [part.strip() for part in eligible.split(",")]
        names = {"moov": "Moov", "togocom": "Togocom"}
        mapped = [names.get(_accent_key(key), key.title()) for key in keys]
        filtered = [name for name in mapped if name in config.ALLOWED_OPERATORS]
        if not filtered:
            return None
        return ",".join(sorted(set(filtered)))
    if any(key in category for key in ("moov",)):
        return "Moov"
    if any(key in category for key in ("togocom",)):
        return "Togocom"
    return None


def _operator_list(operator_value):
    if not operator_value:
        return []
    parts = [part.strip() for part in str(operator_value).split(",")]
    return sorted({part for part in parts if part})


def _normalize_agences(records, source_key):
    normalized = []
    for record in records:
        props = {key: value for key, value in record.items() if not key.startswith("_")}
        geometry = record.get("_geometry")
        if not geometry and record.get("geometry"):
            geometry = record["geometry"]
        if not geometry:
            continue
        coordinates = geometry.get("coordinates")
        if not coordinates:
            continue
        props["text_region"] = props.get("region_nom_bdd")
        props["text_prefecture"] = props.get("prefecture_nom_bdd")
        props["text_commune"] = props.get("commune_nom_bdd")
        props["text_canton"] = props.get("canton_nom_bdd")
        props["canton_nom_bdd"] = props.get("canton_nom_bdd")
        props["nom_localite"] = props.get("nom_localite")
        props["canton_key"] = _accent_key(props.get("canton_nom_bdd") or "")
        operator = _parse_operator(props, source_key)
        base = {
            "id": f"{source_key}_{record.get('index'):05d}",
            "source": source_key,
            "index_record": record.get("index"),
            "nom": _normalize_text(props.get("etab_nom")),
            "type": "agence",
            "operateur": operator,
            "latitude": coordinates[1],
            "longitude": coordinates[0],
            "region": _normalize_text(props.get("region_nom_bdd")),
            "prefecture": _normalize_text(props.get("prefecture_nom_bdd")),
            "commune": _normalize_text(props.get("commune_nom_bdd")),
            "canton": _normalize_text(props.get("canton_nom_bdd")),
            "localite": _normalize_text(props.get("nom_localite")),
            "adresse": _normalize_text(props.get("etab_adresse")),
            "categorie": _normalize_text(props.get("activite_categorie")),
            "statut": _normalize_text(props.get("activite_statut")),
            "date_creation": _normalize_text(props.get("etab_creation_date")),
            "geometry": geometry,
        }
        base["operateurs"] = _operator_list(operator)
        base["nom_norm"] = _accent_key(base["nom"])
        base["prefecture_norm"] = _accent_key(base["prefecture"])
        base["region_norm"] = _accent_key(base["region"])
        normalized.append(base)
    return normalized


def _normalize_datacenters(records, source_key):
    normalized = []
    for record in records:
        props = {key: value for key, value in record.items() if not key.startswith("_")}
        geometry = record.get("_geometry")
        if not geometry:
            continue
        coordinates = geometry.get("coordinates")
        if not coordinates:
            continue
        base = {
            "id": f"{source_key}_{record.get('index'):05d}",
            "source": source_key,
            "index_record": record.get("index"),
            "nom": _normalize_text(props.get("etab_nom")),
            "type": "datacenter",
            "operateur": None,
            "latitude": coordinates[1],
            "longitude": coordinates[0],
            "region": _normalize_text(props.get("region_nom_bdd")),
            "prefecture": _normalize_text(props.get("prefecture_nom_bdd")),
            "commune": _normalize_text(props.get("commune_nom_bdd")),
            "canton": _normalize_text(props.get("canton_nom_bdd")),
            "localite": _normalize_text(props.get("nom_localite")),
            "adresse": _normalize_text(props.get("etab_adresse")),
            "categorie": "Datacenter",
            "statut": _normalize_text(props.get("activite_statut")),
            "date_creation": _normalize_text(props.get("etab_creation_date")),
            "geometry": geometry,
        }
        base["operateurs"] = []
        base["nom_norm"] = _accent_key(base["nom"])
        base["prefecture_norm"] = _accent_key(base["prefecture"])
        base["region_norm"] = _accent_key(base["region"])
        normalized.append(base)
    return normalized


def _normalize_agents(records, source_key):
    normalized = []
    for record in records:
        props = {key: value for key, value in record.items() if not key.startswith("_")}
        geometry = record.get("_geometry")
        if not geometry:
            continue
        coordinates = geometry.get("coordinates")
        if not coordinates:
            continue
        operator = _parse_operator(props, source_key)
        base = {
            "id": f"{source_key}_{record.get('index'):05d}",
            "source": source_key,
            "index_record": record.get("index"),
            "nom": f"Agent mobile money {record.get('index') + 1}",
            "type": "agent_mobile_money",
            "operateur": operator,
            "latitude": coordinates[1],
            "longitude": coordinates[0],
            "region": _normalize_text(props.get("region_nom_bdd")),
            "prefecture": _normalize_text(props.get("prefecture_nom_bdd")),
            "commune": _normalize_text(props.get("commune_nom_bdd")),
            "canton": _normalize_text(props.get("canton_nom_bdd")),
            "localite": "",
            "adresse": "",
            "categorie": "Agent mobile money",
            "statut": "Actif",
            "date_creation": "",
            "geometry": geometry,
        }
        base["operateurs"] = _operator_list(operator)
        base["nom_norm"] = _accent_key(base["canton"])
        base["prefecture_norm"] = _accent_key(base["prefecture"])
        base["region_norm"] = _accent_key(base["region"])
        normalized.append(base)
    return normalized


def _deduplicate_agences(agence_records):
    seen = {}
    unique = []
    for record in agence_records:
        longitude = round(record["longitude"], 4)
        latitude = round(record["latitude"], 4)
        key = (record["nom_norm"], longitude, latitude)
        if key in seen:
            continue
        seen[key] = True
        unique.append(record)
    return unique


def _write_processed_outputs(records):
    if not records:
        return None
    columns = [
        "id", "source", "index_record", "nom", "type", "operateur", "operateurs",
        "latitude", "longitude", "region", "prefecture", "commune", "canton",
        "localite", "adresse", "categorie", "statut", "date_creation", "geometry",
    ]
    frame_rows = [{key: record[key] for key in columns if key in record} for record in records]
    frame = pd.DataFrame(frame_rows)
    frame["operateurs"] = frame["operateurs"].apply(lambda items: ",".join(items))
    geometry = [shape(row["geometry"]) for row in records]
    frame.to_parquet(config.PROCESSED_INFRASTRUCTURES_PARQUET, index=False)
    gdf = gpd.GeoDataFrame(frame, geometry=geometry, crs="EPSG:4326")
    gdf.to_file(config.PROCESSED_INFRASTRUCTURES_GEOJSON, driver="GeoJSON", encoding="utf-8")
    return frame


def ingest_all():
    config.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    source_specs = [
        ("agences_moov", config.RAW_DATA_DIR / "agences_moov.geojson"),
        ("agences_togocom", config.RAW_DATA_DIR / "agences_togocom.geojson"),
        ("agences_telecom", config.RAW_DATA_DIR / "agences_telecom.geojson"),
        ("agences_canal_plus", config.RAW_DATA_DIR / "agences_canal_plus.geojson"),
        ("datacenters_etablissements", config.RAW_DATA_DIR / "datacenters_etablissements.geojson"),
        ("agents_mobile_money", config.RAW_DATA_DIR / "agents_mobile_money.geojson"),
    ]
    all_records = []
    for source_key, path in source_specs:
        if not path.exists():
            print(f"  ATTENTION: source manquante {path.name}, ignoree")
            continue
        records = _read_source_file(path, source_key)
        print(f"  {source_key}: {len(records)} enregistrements bruts")
        if source_key in ("agences_moov", "agences_togocom", "agences_telecom", "agences_canal_plus"):
            normalized = _normalize_agences(records, source_key)
            all_records.extend(normalized)
        elif source_key == "datacenters_etablissements":
            normalized = _normalize_datacenters(records, source_key)
            all_records.extend(normalized)
        elif source_key == "agents_mobile_money":
            normalized = _normalize_agents(records, source_key)
            all_records.extend(normalized)

    agences = [record for record in all_records if record["type"] == "agence"]
    others = [record for record in all_records if record["type"] != "agence"]
    print(f"  Agences brutes avant dedoublement: {len(agences)}")
    agences = _deduplicate_agences(agences)
    print(f"  Agences uniques apres dedoublement: {len(agences)}")
    final_records = agences + others
    frame = _write_processed_outputs(final_records)
    return frame


if __name__ == "__main__":
    frame = ingest_all()
    if frame is not None:
        print(frame.groupby(["type", "operateur"]).size())