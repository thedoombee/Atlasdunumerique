from fastapi import APIRouter

from app.api.schemas import (
    Concentration,
    NationalSummary,
    PrefectureIndicators,
    RegionIndicators,
    load_analysis,
)

router = APIRouter(prefix="/indicators", tags=["indicators"])


@router.get("/summary", response_model=NationalSummary)
def national_summary() -> NationalSummary:
    bundle = load_analysis()
    return NationalSummary(**bundle["national"])


@router.get("/by-region", response_model=list[RegionIndicators])
def indicators_by_region() -> list[RegionIndicators]:
    bundle = load_analysis()
    return [RegionIndicators(**item) for item in bundle["regions"]]


@router.get("/by-prefecture", response_model=list[PrefectureIndicators])
def indicators_by_prefecture() -> list[PrefectureIndicators]:
    bundle = load_analysis()
    return [PrefectureIndicators(**item) for item in bundle["prefectures"]]


@router.get("/concentration", response_model=Concentration)
def concentration() -> Concentration:
    bundle = load_analysis()
    return Concentration(**bundle["concentration"])