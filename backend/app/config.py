from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw_data"
REFERENCE_DIR = DATA_DIR / "reference"
PROCESSED_DATA_DIR = DATA_DIR / "processed_data"

ALLOWED_OPERATORS = ["Moov", "Togocom", "Telecom", "Canal Plus"]
ALLOWED_TYPES = ["agence", "datacenter", "agent_mobile_money"]

AGENCE_COVERAGE_RADIUS_KM = 15.0
DATACENTER_COVERAGE_RADIUS_KM = 25.0
AGENT_COVERAGE_RADIUS_KM = 3.0

GRID_SPACING_DEGREES = 0.014
COUNTRY_EPSG = 32631

POPULATION_SOURCE_LABEL = "INSEED, RGPH-5 (recensement general 2022)"
POPULATION_SOURCE_URL = "https://inseed.tg/resultats-definitifs-du-rgph-5-novembre-2022"
POPULATION_REFERENCE_YEAR = 2022
BOUNDARIES_SOURCE_LABEL = "OCHA HDX, COD-AB Togo, limites administratives v02"
BOUNDARIES_SOURCE_URL = "https://data.humdata.org/dataset/cod-ab-tgo"

PROCESSED_INFRASTRUCTURES_PARQUET = PROCESSED_DATA_DIR / "infrastructures.parquet"
PROCESSED_INFRASTRUCTURES_GEOJSON = PROCESSED_DATA_DIR / "infrastructures.geojson"
PROCESSED_POPULATION_PARQUET = PROCESSED_DATA_DIR / "prefectures_population.parquet"
PROCESSED_PREFECTURES_GEOJSON = PROCESSED_DATA_DIR / "prefectures_coverage.geojson"
PROCESSED_REGIONS_GEOJSON = PROCESSED_DATA_DIR / "regions.geojson"
PROCESSED_ANALYSIS_JSON = PROCESSED_DATA_DIR / "analysis_cache.json"

KM_TO_DEGREES_LAT = 1.0 / 110.574