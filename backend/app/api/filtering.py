from __future__ import annotations

import pandas as pd


def apply_filters(
    frame: pd.DataFrame,
    operator: str | None = None,
    infrastructure_type: str | None = None,
    region: str | None = None,
    prefecture: str | None = None,
    search: str | None = None,
) -> pd.DataFrame:
    result = frame.copy()

    if operator:
        selected = [part.strip() for part in operator.split(",") if part.strip()]
        if selected:
            mask = result["operateurs"].apply(
                lambda cell: any(op in selected for op in str(cell).split(","))
            )
            result = result.loc[mask]

    if infrastructure_type:
        result = result.loc[result["type"] == infrastructure_type]

    if region:
        result = result.loc[result["region"] == region]

    if prefecture:
        result = result.loc[result["prefecture"] == prefecture]

    if search and search.strip():
        query = str(search).strip().lower()
        target = (result["nom"].fillna("") + " " + result["localite"].fillna("") + " " +
                  result["prefecture"].fillna("") + " " + result["commune"].fillna("") + " " +
                  result["canton"].fillna("")).str.lower()
        result = result.loc[target.str.contains(query, regex=False)]

    return result


def to_feature_collection(frame: pd.DataFrame) -> dict:
    features = []
    for _, row in frame.iterrows():
        properties = {
            "id": row["id"],
            "nom": row["nom"],
            "type": row["type"],
            "operateur": row.get("operateur") or None,
            "operateurs": row.get("operateurs") or "",
            "region": row.get("region") or None,
            "prefecture": row.get("prefecture") or None,
            "commune": row.get("commune") or None,
            "canton": row.get("canton") or None,
            "localite": row.get("localite") or "",
            "source": row.get("source") or "",
        }
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(row["longitude"]), float(row["latitude"])],
            },
            "properties": properties,
        })
    return {"type": "FeatureCollection", "features": features}