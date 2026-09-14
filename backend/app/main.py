from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

app = FastAPI(
    title="Economie Numerique Togo - Dashboard API",
    description="API du defi 1 Data Challenge Togo AI Lab : diagnostic de l acces aux telecommunications et services numeriques au Togo.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root() -> dict:
    return {"name": "Economie Numerique Togo - Dashboard API", "docs": "/docs"}