from fastapi import APIRouter

from app.api import schemas

router = APIRouter(tags=["coverage"])


@router.get("/coverage/prefectures", response_model=schemas.CoverageResponse)
def coverage_prefectures() -> schemas.CoverageResponse:
    bundle = schemas.load_analysis()
    methodology = schemas.CoverageMethodology(
        radius_km=bundle["meta"]["coverage_radius_km"],
        text=bundle["meta"]["methodology"],
    )
    items = []
    for item in bundle["prefectures"]:
        items.append(schemas.CoveragePrefecture(
            prefecture=item["prefecture"],
            region=item["region"],
            population=item["population"],
            n_agences=item["n_agences"],
            n_agents_mobile_money=item["n_agents_mobile_money"],
            couverture_agence_pct=item["couverture_agence_pct"],
            couverture_agent_pct=item["couverture_agent_pct"],
            couverture_combinee_pct=item["couverture_combinee_pct"],
            population_non_couverte=item["population_non_couverte"],
            score_priorite=item["score_priorite"],
            niveau_priorite=item["niveau_priorite"],
        ))
    return schemas.CoverageResponse(methodology=methodology, prefectures=items)


@router.get("/maps/prefectures")
def prefectures_geojson() -> dict:
    return schemas.load_prefectures_geojson()


@router.get("/maps/regions")
def regions_geojson() -> dict:
    return schemas.load_regions_geojson()