"""
AeroIntel Backend — FastAPI Application
ML-Powered Flight Delay Intelligence Platform
"""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.api.routes import health, metadata, predict, analytics, models as ml_models, comparison
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    logger.info("🛫 AeroIntel backend starting up...")
    logger.info(f"   Environment : {settings.environment}")
    logger.info(f"   Models path : {settings.models_dir}")
    yield
    logger.info("🛬 AeroIntel backend shutting down.")


app = FastAPI(
    title="AeroIntel API",
    description="ML-Powered Flight Delay Intelligence Platform — US Domestic Aviation",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root URL redirect to API documentation."""
    return RedirectResponse(url="/api/docs")


# Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(metadata.router, prefix="/api/metadata", tags=["Metadata"])
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ml_models.router, prefix="/api/models", tags=["ML Models"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["Comparison"])
