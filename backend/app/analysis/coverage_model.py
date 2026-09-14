from __future__ import annotations

import pandas as pd
import geopandas as gpd
from shapely.ops import unary_union
from shapely.geometry import Point

from app import config


def _buffer_union(series, radius_km):
    if series is None or series.empty:
        return None
    projected = gpd.GeoSeries(series, crs="EPSG:4326").to_crs(config.COUNTRY_EPSG)
    radius_m = radius_km * 1000.0
    buffered = projected.buffer(radius_m)
    parts = [geom for geom in buffered if geom is not None and not geom.is_empty]
    if not parts:
        return None
    return unary_union(parts)


def _coverage_ratio(polygon, coverage_union):
    if coverage_union is None or polygon is None:
        return 0.0
    if polygon.is_empty or polygon.area <= 0:
        return 0.0
    if not polygon.intersects(coverage_union):
        return 0.0
    intersection_area = polygon.intersection(coverage_union).area
    return max(0.0, min(1.0, intersection_area / polygon.area))


def compute_coverage(infra: pd.DataFrame, prefectures: gpd.GeoDataFrame) -> pd.DataFrame:
    agences = None
    agents = None
    datacenters = None
    if infra is not None and not infra.empty:
        with_point = infra.assign(
            geometry=[Point(lon, lat) for lon, lat in zip(infra["longitude"], infra["latitude"])]
        )
        with_point = gpd.GeoDataFrame(with_point, geometry="geometry", crs="EPSG:4326")
        agences = with_point.loc[with_point["type"] == "agence", "geometry"]
        agents = with_point.loc[with_point["type"] == "agent_mobile_money", "geometry"]
        datacenters = with_point.loc[with_point["type"] == "datacenter", "geometry"]

    union_agence = _buffer_union(agences, config.AGENCE_COVERAGE_RADIUS_KM)
    union_agent = _buffer_union(agents, config.AGENT_COVERAGE_RADIUS_KM)
    union_datacenter = _buffer_union(datacenters, config.DATACENTER_COVERAGE_RADIUS_KM)

    combined_parts = [
        part for part in (union_agence, union_agent, union_datacenter) if part is not None
    ]
    union_combine = unary_union(combined_parts) if len(combined_parts) > 1 else (
        combined_parts[0] if combined_parts else None
    )

    rows = []
    for _, feature in prefectures.iterrows():
        polygon = feature.geometry
        ratio_agence = _coverage_ratio(polygon, union_agence)
        ratio_agent = _coverage_ratio(polygon, union_agent)
        ratio_datacenter = _coverage_ratio(polygon, union_datacenter)
        ratio_combine = _coverage_ratio(polygon, union_combine)
        rows.append({
            "prefecture": feature["prefecture"],
            "region": feature["region"],
            "couverture_agence_pct": round(ratio_agence * 100.0, 2),
            "couverture_agent_pct": round(ratio_agent * 100.0, 2),
            "couverture_datacenter_pct": round(ratio_datacenter * 100.0, 2),
            "couverture_combinee_pct": round(ratio_combine * 100.0, 2),
        })
    return pd.DataFrame(rows)
