from fastapi import APIRouter, Query

from app.api import schemas

router = APIRouter(tags=["recommandations"])


@router.get("/recommandations", response_model=schemas.RecommendationsResponse)
def recommendations(
    sort: str = Query(default="priorite", pattern="^(priorite|impact)$"),
    limit: int | None = Query(default=None, ge=1, le=200),
) -> schemas.RecommendationsResponse:
    bundle = schemas.load_analysis()
    items = [schemas.Recommendation(**item) for item in bundle["recommandations"]]
    if sort == "impact":
        items.sort(key=lambda item: item.impact_estime_habitants, reverse=True)
    else:
        items.sort(key=lambda item: item.priorite, reverse=True)
    if limit:
        items = items[:limit]
    return schemas.RecommendationsResponse(items=items)