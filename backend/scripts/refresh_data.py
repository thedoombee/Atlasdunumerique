from app.ingest import ingest_data


def build():
    print("Step 1/3: Ingestion des GeoJSON bruts")
    infra = ingest_data.ingest_all()
    if infra is None:
        raise SystemExit("Echec de l ingestion, arret du rafraichissement.")
    n_infra = len(infra)
    print(f"  Infrastructures normalisees: {n_infra}")

    print("Step 2/3: Analyse et calcul des indicateurs")
    from app.analysis import analysis_engine

    prefectures_gdf, regions_gdf, population_df = analysis_engine.prepare_geographies()
    analysis_engine.run_analysis(infra, prefectures_gdf, regions_gdf, population_df)
    print("  Cache d analyse ecrit dans processed_data/analysis_cache.json")

    print("Step 3/3: Verification du cache analyse")
    from app.api.schemas import load_analysis

    bundle = load_analysis()
    print(f"  National: {bundle['national']['total_infrastructures']} infrastructures, "
          f"{bundle['national']['total_population']:,} habitants")
    print(f"  Prefectures traitees: {len(bundle['prefectures'])}")
    print("Rafraichissement termine.")


if __name__ == "__main__":
    build()