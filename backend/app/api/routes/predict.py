"""
Prediction API endpoint.
Assembles pre-flight features → runs classifier + regressor → returns SHAP explanation.
"""
from fastapi import APIRouter, HTTPException
from app.schemas.predict import PredictRequest, PredictResponse
from ml.inference.predictor import AeroIntelPredictor

router = APIRouter()
_predictor = AeroIntelPredictor()


@router.post("/predict", response_model=PredictResponse)
async def predict_delay(request: PredictRequest):
    """
    Predict flight delay probability and expected duration.

    - Uses only pre-flight features (no target leakage).
    - Delay threshold: DEP_DELAY >= 15 minutes (BTS standard).
    - Returns SHAP-based explanation for the individual prediction.
    """
    try:
        result = _predictor.predict(request)
        return result
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "model_not_trained",
                "message": (
                    "ML models have not been trained yet. "
                    "Run the training pipeline first: "
                    "python -m ml.training.train_all"
                ),
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"error": "prediction_failed", "message": str(exc)})
