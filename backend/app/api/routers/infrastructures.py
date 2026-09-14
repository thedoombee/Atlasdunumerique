import math

from fastapi import APIRouter, HTTPException, Query

from app.api.filtering import apply_filters, to_feature_collection
from app.api.schemas import (
    InfrastructureItem,
    PaginatedInfrastructures,
    load_infrastructures,
)

router = APIRouter(tags=["infrastructures"])


@router.get("/infrastructures", response_model=PaginatedInfrastructures)
def list_infrastructures(
    operator: str | None = Query(default=None),
    type: str | None = Query(default=None, alias="type"),
    region: str | None = Query(default=None),
    prefecture: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=500),
) -> PaginatedInfrastructures:
    frame = load_infrastructures()
    filtered = apply_filters(
        frame,
        operator=operator,
        infrastructure_type=type,
        region=region,
        prefecture=prefecture,
        search=search,
    )
    total = len(filtered)
    pages = max(1, math.ceil(total / per_page)) if total else 1
    page = min(page, pages)
    start = (page - 1) * per_page
    rows = filtered.iloc[start:start + per_page]
    items = [InfrastructureItem(**row_to_dict(row)) for _, row in rows.iterrows()]
    return PaginatedInfrastructures(
        items=items, total=total, page=page, per_page=per_page, pages=pages,
    )


@router.get("/infrastructures/{infrastructure_id}", response_model=InfrastructureItem)
def get_infrastructure(infrastructure_id: str) -> InfrastructureItem:
    frame = load_infrastructures()
    matches = frame.loc[frame["id"] == infrastructure_id]
    if matches.empty:
        raise HTTPException(status_code=404, detail="Infrastructure introuvable")
    row = matches.iloc[0]
    return InfrastructureItem(**row_to_dict(row))


@router.get("/maps/infrastructures")
def infrastructures_geojson(
    operator: str | None = Query(default=None),
    type: str | None = Query(default=None, alias="type"),
    region: str | None = Query(default=None),
    prefecture: str | None = Query(default=None),
    search: str | None = Query(default=None),
) -> dict:
    frame = load_infrastructures()
    filtered = apply_filters(
        frame,
        operator=operator,
        infrastructure_type=type,
        region=region,
        prefecture=prefecture,
        search=search,
    )
    return to_feature_collection(filtered)


def row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "nom": row["nom"],
        "type": row["type"],
        "operateur": row.get("operateur") or None,
        "operateurs": [part for part in str(row.get("operateurs") or "").split(",") if part],
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "region": row.get("region") or None,
        "prefecture": row.get("prefecture") or None,
        "commune": row.get("commune") or None,
        "canton": row.get("canton") or None,
        "localite": row.get("localite") or "",
        "adresse": row.get("adresse") or "",
        "categorie": row.get("categorie") or "",
    }