from fastapi import APIRouter

from app.api.routers import (
    coverage,
    filters,
    indicators,
    infrastructures,
    meta,
    population,
    recommendations,
    white_zones,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(meta.router)
api_router.include_router(filters.router)
api_router.include_router(infrastructures.router)
api_router.include_router(indicators.router)
api_router.include_router(population.router)
api_router.include_router(coverage.router)
api_router.include_router(white_zones.router)
api_router.include_router(recommendations.router)


@api_router.get("/health")
def health() -> dict:
    return {"status": "ok"}