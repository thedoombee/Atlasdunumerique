from fastapi import APIRouter

from app.api import schemas

router = APIRouter(tags=["meta"])


@router.get("/meta", response_model=schemas.MetaResponse)
def meta() -> schemas.MetaResponse:
    bundle = schemas.load_analysis()
    return schemas.MetaResponse(**bundle["meta"])