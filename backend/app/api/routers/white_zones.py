from fastapi import APIRouter

from app.api import schemas

router = APIRouter(tags=["zones-blanches"])


@router.get("/zones-blanches", response_model=schemas.WhiteZonesResponse)
def white_zones() -> schemas.WhiteZonesResponse:
    bundle = schemas.load_analysis()
    methodology = schemas.CoverageMethodology(
        radius_km=bundle["meta"]["coverage_radius_km"],
        text=bundle["meta"]["methodology"],
    )
    items = []
    for item in bundle["zones_blanches"]:
        items.append(schemas.WhiteZone(
            prefecture=item["prefecture"],
            region=item["region"],
            population=item["population"],
            population_non_couverte=item["population_non_couverte"],
            score_priorite=item["score_priorite"],
            niveau_priorite=item["niveau_priorite"],
            couverture_agence_pct=item["couverture_agence_pct"],
            n_agences=item["n_agences"],
            n_agents_mobile_money=item["n_agents_mobile_money"],
        ))
    return schemas.WhiteZonesResponse(methodology=methodology, items=items)


@router.get("/zones-blanches/summary")
def zones_blanches_summary() -> dict:
    bundle = schemas.load_analysis()
    zones = bundle["zones_blanches"]
    counts = {}
    for item in zones:
        level = item["niveau_priorite"]
        counts[level] = counts.get(level, 0) + 1
    return {
        "total_prefectures": len(zones),
        "repartition_priorite": counts,
        "score_max": zones[0]["score_priorite"] if zones else 0,
        "score_moyen": round(sum(item["score_priorite"] for item in zones) / len(zones), 1) if zones else 0,
    }