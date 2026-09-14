from fastapi import APIRouter

from app.api import schemas

router = APIRouter(tags=["population"])


@router.get("/population", response_model=schemas.PopulationResponse)
def population() -> schemas.PopulationResponse:
    bundle = schemas.load_analysis()
    meta = schemas.PopulationMeta(
        source=bundle["meta"]["population_source"],
        source_url=bundle["meta"]["population_source_url"],
        reference_year=bundle["meta"]["population_reference_year"],
        total_population=bundle["national"]["total_population"],
    )
    records = []
    for item in bundle["prefectures"]:
        entry = next(
            (record for record in population_records_cache() if record["prefecture"] == item["prefecture"]),
            None,
        )
        records.append(schemas.PopulationRecord(
            region=item["region"],
            prefecture=item["prefecture"],
            population_total=item["population"],
            population_male=entry["population_male"] if entry else 0,
            population_female=entry["population_female"] if entry else 0,
            area_km2=item["area_km2"],
            pop_density=item["pop_density"],
        ))
    return schemas.PopulationResponse(meta=meta, records=records)


def population_records_cache():
    import pandas as pd

    from app import config

    frame = pd.read_parquet(config.PROCESSED_POPULATION_PARQUET)
    return frame.to_dict(orient="records")