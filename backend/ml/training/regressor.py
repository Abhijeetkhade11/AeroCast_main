"""
AeroIntel ML Training — Regression (Delay Duration)

Predicts DEP_DELAY in minutes.
"""
from __future__ import annotations
import json
import joblib
from datetime import datetime, timezone

import numpy as np
from loguru import logger
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

HAS_XGB = False
try:
    import xgboost as xgb
    HAS_XGB = True
except Exception as e:
    logger.warning(f"XGBoost regressor unavailable ({e}). Using Scikit-Learn HistGradientBoostingRegressor.")

from app.core.config import settings
from data.features.engineering import (
    PRE_FLIGHT_FEATURES, prepare_ml_dataset,
)

MODELS_DIR = settings.models_dir
RANDOM_SEED = settings.random_seed


def build_regressors() -> dict:
    regs = {
        "ridge": Ridge(alpha=10.0),
        "random_forest": RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=20,
            random_state=RANDOM_SEED,
            n_jobs=-1,
        ),
        "gradient_boosting": HistGradientBoostingRegressor(
            max_iter=200,
            max_depth=8,
            learning_rate=0.05,
            random_state=RANDOM_SEED,
        ),
    }
    if HAS_XGB:
        try:
            regs["xgboost"] = xgb.XGBRegressor(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=RANDOM_SEED,
                n_jobs=-1,
            )
        except Exception:
            pass

    return regs


def train_regressors(X_train, y_train, X_val, y_val) -> tuple[str, object, dict]:
    regressors = build_regressors()
    results = {}

    for name, reg in regressors.items():
        logger.info(f"Training regressor: {name}...")
        reg.fit(X_train, y_train)
        pred = reg.predict(X_val).clip(0)
        mae = float(mean_absolute_error(y_val, pred))
        rmse = float(np.sqrt(mean_squared_error(y_val, pred)))
        r2 = float(r2_score(y_val, pred))
        results[name] = {"mae": mae, "rmse": rmse, "r2": r2, "model": reg}
        logger.info(f"  [{name}] MAE={mae:.2f}  RMSE={rmse:.2f}  R²={r2:.4f}")

    best_name = min(results, key=lambda k: results[k]["mae"])
    logger.info(f"Best regressor selected: {best_name} (MAE={results[best_name]['mae']:.2f})")
    return best_name, results[best_name]["model"], results


def evaluate_regressor(model, X_test, y_test, model_name: str, train_df, test_df) -> dict:
    pred = model.predict(X_test).clip(0)
    mae = float(mean_absolute_error(y_test, pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
    r2 = float(r2_score(y_test, pred))

    metrics = {
        "model_name": model_name,
        "model_type": "regressor",
        "training_period": f"{train_df['flight_date'].min().date()} — {train_df['flight_date'].max().date()}",
        "test_period": f"{test_df['flight_date'].min().date()} — {test_df['flight_date'].max().date()}",
        "features": PRE_FLIGHT_FEATURES,
        "target": "DEP_DELAY (minutes, clipped at 0)",
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 4),
        "test_size": len(y_test),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    out = MODELS_DIR / "regressor_v1_metrics.json"
    with open(out, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved regressor metrics to {out}")
    return metrics


def train_and_save_regressor(df_train, df_val, df_test):
    X_train, _, y_train = prepare_ml_dataset(df_train)
    X_val, _, y_val = prepare_ml_dataset(df_val)
    X_test, _, y_test = prepare_ml_dataset(df_test)

    best_name, best_reg, _ = train_regressors(X_train, y_train, X_val, y_val)
    metrics = evaluate_regressor(best_reg, X_test, y_test, best_name, df_train, df_test)

    out_path = MODELS_DIR / "regressor_v1.pkl"
    joblib.dump(best_reg, out_path)
    logger.info(f"Saved regressor model to {out_path}")

    return best_reg, metrics
