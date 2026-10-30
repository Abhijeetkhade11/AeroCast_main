"""
ML Models metadata endpoints.
Returns model registry entries, metrics, and feature importance.
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
from app.core.config import settings
import json

router = APIRouter()

MODELS_DIR = settings.models_dir


def _load_model_registry() -> list:
    registry_path = MODELS_DIR / "registry.json"
    if registry_path.exists():
        with open(registry_path) as f:
            return json.load(f)

    # Dynamic fallback: scan MODELS_DIR for trained models
    models = []
    cls_metrics = MODELS_DIR / "classifier_v1_metrics.json"
    if cls_metrics.exists():
        with open(cls_metrics) as f:
            m = json.load(f)
            models.append({
                "model_id": "classifier_v1",
                "name": "Flight Delay Classifier",
                "version": "1.0.0",
                "type": "classification",
                "best_model": m.get("best_model", "random_forest"),
                "metrics": m.get("best_test_metrics", {}),
            })

    reg_metrics = MODELS_DIR / "regressor_v1_metrics.json"
    if reg_metrics.exists():
        with open(reg_metrics) as f:
            m = json.load(f)
            models.append({
                "model_id": "regressor_v1",
                "name": "Flight Delay Regressor",
                "version": "1.0.0",
                "type": "regression",
                "best_model": m.get("best_model", "ridge"),
                "metrics": m.get("best_test_metrics", {}),
            })

    return models


@router.get("")
async def list_models():
    """List all trained model versions in the registry."""
    registry = _load_model_registry()
    if not registry:
        return {
            "status": "not_ready",
            "message": "No trained models found. Run the training pipeline first.",
            "models": [],
        }
    return {"status": "ok", "models": registry}


@router.get("/{model_id}/metrics")
async def get_model_metrics(model_id: str):
    """Return evaluation metrics for a specific model."""
    metrics_path = MODELS_DIR / f"{model_id}_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Metrics for model '{model_id}' not found. Run the training pipeline.",
        )
    with open(metrics_path) as f:
        return {"status": "ok", "model_id": model_id, "metrics": json.load(f)}


@router.get("/{model_id}/importance")
async def get_feature_importance(model_id: str):
    """Return global SHAP feature importance for a model."""
    importance_path = MODELS_DIR / f"{model_id}_importance.json"
    if not importance_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Feature importance for model '{model_id}' not found.",
        )
    with open(importance_path) as f:
        return {"status": "ok", "model_id": model_id, "importance": json.load(f)}
