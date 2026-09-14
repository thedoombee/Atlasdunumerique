# Atlas du numérique — Togo

Observatoire national de l'accès aux télécommunications et services numériques. Projet réalisé pour le Défi 1 du Data Challenge Togo AI Lab : diagnostiquer la fracture numérique à partir de données géolocalisées.

Le dashboard compare 5 régions et 39 préfectures, cartographie 19 881 infrastructures et priorise les zones blanches avec un score explicable.

## Contenu

9 pages regroupées en 3 ensembles :

- Principal : Vue d'ensemble, Régions, Préfectures. Synthèse nationale, comparateur et classement.
- Données : Carte Leaflet, Infrastructures, Zones blanches. Explorateur cartographique, registre paginé, priorisation.
- Pilotage : Opérateurs, Recommandations, Méthodologie. Parts de marché, actions chiffrées, sources et limites.

Chiffres de référence : 8 095 498 habitants (RGPH-5 2022), 90 agences (Moov 28, Togocom 62), 19 788 agents mobile money, 3 datacenters, 2,44 agents pour 1000 habitants.

## Architecture

- Backend : FastAPI sur `127.0.0.1:8000`, code dans `backend/app`. Sert `/api` et `/docs`.
- Frontend : React + Vite + Tailwind sur `localhost:5173`, code dans `frontend/src`. Cartes Leaflet, graphiques Recharts.
- Données traitées : `backend/data/processed_data` (`analysis_cache.json`, GeoJSON préfectures et régions, parquet infrastructures).
- Proxy dev : `/api` redirigé vers le backend dans `frontend/vite.config.js`.

Pipeline en 3 étapes via `backend/scripts/refresh_data.py` :

1. Ingestion des GeoJSON bruts vers `infrastructures.parquet` (`app/ingest/ingest_data.py`). Nettoyage lat/lon, déduplication des agences, rattachement région et préfecture.
2. Préparation des géographies et calcul des indicateurs (`app/analysis/analysis_engine.py`). Normalisation des noms, surfaces en EPSG:32631, agrégats national, régions et préfectures.
3. Écriture du cache `analysis_cache.json` servi par l'API (`app/api/schemas.py`).

## Méthode de couverture

La couverture est estimée, non mesurée. Un tampon circulaire est tracé autour de chaque point : 15 km pour une agence, 25 km pour un datacenter, 3 km pour un agent mobile money. Le taux d'une préfecture est la part de sa superficie incluse dans l'union de ces tampons (`app/analysis/coverage_model.py`). La population couverte est obtenue en supposant une répartition uniforme, ce qui surestime les zones désertiques et sous-estime les centres denses.

Score de priorité d'une zone blanche : 0,5 population non couverte + 0,35 densité non couverte + 0,15 écart de service mobile par rapport à la moyenne nationale. Niveaux : Haute à partir de 60, Moyenne à partir de 30, sinon Faible.

Sources : population INSEED RGPH-5 2022 (`prefectures_population_rgph5_2022.csv`), limites OCHA HDX COD-AB (`togo_admin2_boundaries.geojson`), infrastructures geodata.gouv.tg dans `backend/data/raw_data`.

## Lancement

Backend (Git Bash) :

```bash
cd backend
source .venv/Scripts/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Sans activation :

```bash
./.venv/Scripts/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Vérification : `http://127.0.0.1:8000/docs`, `http://127.0.0.1:8000/api/health` retourne `{"status":"ok"}`.

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Ouvrir `http://localhost:5173`. Le frontend appelle `http://127.0.0.1:8000/api` en production et `/api` via proxy en dev.

Rafraîchir les données après modification des fichiers bruts :

```bash
cd backend
./.venv/Scripts/python -m scripts.refresh_data
```

## API principale

- `GET /api/indicators/summary` : synthèse nationale
- `GET /api/indicators/by-region` : indicateurs des 5 régions
- `GET /api/indicators/by-prefecture` : indicateurs des 39 préfectures
- `GET /api/indicators/concentration` : 4 indices de dissimilarité
- `GET /api/maps/prefectures`, `GET /api/maps/regions` : GeoJSON pour Leaflet
- `GET /api/coverage/prefectures` : taux par préfecture et méthode
- `GET /api/zones-blanches` : liste triée par score de priorité
- `GET /api/recommandations` : actions avec impact estimé en habitants
- `GET /api/infrastructures?page=1&per_page=15&operator=Moov&type=agence` : registre paginé et filtré
- `GET /api/filters/options`, `GET /api/population`, `GET /api/meta` : filtres, population, traçabilité

## Structure

```text
backend/
  app/main.py
  app/config.py
  app/ingest/
  app/analysis/
  app/api/routers/
  data/raw_data/
  data/reference/
  data/processed_data/
  scripts/refresh_data.py
frontend/
  src/pages/
  src/components/
  src/services/api.js
  src/utils/format.js
  vite.config.js
```

## Limites

Estimation théorique à usage décisionnel. Les rayons 15, 25 et 3 km sont paramétrables dans `backend/app/config.py` mais non calibrés par des mesures terrain. La fibre, la 4G et 5G réelles, les prix et les usages ne sont pas intégrés.
