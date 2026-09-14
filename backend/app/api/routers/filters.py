from fastapi import APIRouter

from app.api.schemas import FilterOptions, build_filter_options, load_infrastructures

router = APIRouter(prefix="/filters", tags=["filters"])


@router.get("/options", response_model=FilterOptions)
def get_filter_options() -> FilterOptions:
    frame = load_infrastructures()
    return build_filter_options(frame)