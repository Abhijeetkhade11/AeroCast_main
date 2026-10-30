"""
AeroIntel ML Training Pipeline — Classification

Models compared:
    - Logistic Regression baseline
    - Random Forest
    - Gradient Boosting / HistGradientBoosting
    - XGBoost (if libomp available)
    - LightGBM (if available)

Best model selected by ROC-AUC on validation set.
All models saved as .pkl artifacts with accompanying metrics JSON.
"""
from __future__ import annotations
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from loguru import logger
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
)
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score,
    confusion_matrix, roc_curve,
)

# Robust import for XGBoost (handles missing OpenMP / libomp gracefully)
HAS_XGB = False
try:
    import xgboost as xgb
    HAS_XGB = True
except Exception as e:
    logger.warning(f"XGBoost unavailable ({e}). Using Scikit-Learn GradientBoosting fallback.")

# Robust import for LightGBM
HAS_LGB = False
try:
    import lightgbm as lgb
    HAS_LGB = True
except Exception as e:
    logger.warning(f"LightGBM unavailable ({e}).")

from app.core.config import settings
from data.features.engineering import (
    PRE_FLIGHT_FEATURES, prepare_ml_dataset,
)

MODELS_DIR = settings.models_dir
RANDOM_SEED = settings.random_seed


def build_classifiers(class_weight: float) -> dict:
    clfs = {
        "logistic_regression": LogisticRegression(
            class_weight="balanced",
            max_iter=500,
            random_state=RANDOM_SEED,
            n_jobs=-1,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=20,
            class_weight="balanced",
            random_state=RANDOM_SEED,
            n_jobs=-1,
        ),
        "gradient_boosting": HistGradientBoostingClassifier(
            max_iter=200,
            max_depth=8,
            learning_rate=0.05,
            class_weight="balanced",
            random_state=RANDOM_SEED,
        ),
    }
    if HAS_XGB:
        try:
            clfs["xgboost"] = xgb.XGBClassifier(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                scale_pos_weight=class_weight,
                use_label_encoder=False,
                eval_metric="auc",
                random_state=RANDOM_SEED,
                n_jobs=-1,
            )
        except Exception:
            pass

    if HAS_LGB:
        try:
            clfs["lightgbm"] = lgb.LGBMClassifier(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                scale_pos_weight=class_weight,
                random_state=RANDOM_SEED,
                n_jobs=-1,
                verbose=-1,
            )
        except Exception:
            pass

    return clfs


def train_classifiers(X_train, y_train, X_val, y_val) -> tuple[str, object, dict]:
    """Train and compare classifiers. Returns best model name, object, and metrics."""
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    class_weight = float(n_neg / max(n_pos, 1))
    logger.info(f"Class balance: {n_pos}/{n_neg} → scale_pos_weight={class_weight:.2f}")

    classifiers = build_classifiers(class_weight)
    results = {}

    for name, clf in classifiers.items():
        logger.info(f"Training classifier: {name}...")
        clf.fit(X_train, y_train)
        prob = clf.predict_proba(X_val)[:, 1]
        pred = (prob >= 0.5).astype(int)

        auc = float(roc_auc_score(y_val, prob))
        f1 = float(f1_score(y_val, pred, zero_division=0))
        prec = float(precision_score(y_val, pred, zero_division=0))
        rec = float(recall_score(y_val, pred, zero_division=0))

        results[name] = {"auc": auc, "f1": f1, "model": clf}
        logger.info(f"  [{name}] ROC-AUC={auc:.4f}  F1={f1:.4f}  Precision={prec:.4f}  Recall={rec:.4f}")

    best_name = max(results, key=lambda k: results[k]["auc"])
    logger.info(f"Best classifier selected: {best_name} (ROC-AUC={results[best_name]['auc']:.4f})")
    return best_name, results[best_name]["model"], results


def evaluate_classifier_on_test(model, X_test, y_test, model_name: str, train_df, test_df) -> dict:
    """Compute final test metrics and save as JSON."""
    prob = model.predict_proba(X_test)[:, 1]
    pred = (prob >= 0.5).astype(int)

    auc = float(roc_auc_score(y_test, prob))
    f1 = float(f1_score(y_test, pred, zero_division=0))
    prec = float(precision_score(y_test, pred, zero_division=0))
    rec = float(recall_score(y_test, pred, zero_division=0))
    cm = confusion_matrix(y_test, pred).tolist()
    fpr, tpr, _ = roc_curve(y_test, prob)

    metrics = {
        "model_name": model_name,
        "model_type": "classifier",
        "training_period": f"{train_df['flight_date'].min().date()} — {train_df['flight_date'].max().date()}",
        "test_period": f"{test_df['flight_date'].min().date()} — {test_df['flight_date'].max().date()}",
        "features": PRE_FLIGHT_FEATURES,
        "delay_threshold_minutes": settings.delay_threshold_minutes,
        "roc_auc": round(auc, 4),
        "f1_score": round(f1, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "confusion_matrix": cm,
        "roc_curve": {"fpr": [round(x, 4) for x in fpr.tolist()], "tpr": [round(x, 4) for x in tpr.tolist()]},
        "test_size": len(y_test),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    out = MODELS_DIR / "classifier_v1_metrics.json"
    with open(out, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved classifier metrics to {out}")
    return metrics


def save_shap_explainer(model, X_train_sample, model_name: str):
    """Compute and save feature importance for the trained classifier."""
    try:
        import shap
        logger.info("Computing SHAP explainer...")
        sample = X_train_sample.sample(min(2000, len(X_train_sample)), random_state=RANDOM_SEED)

        if hasattr(model, "feature_importances_"):
            # Fast feature importances for Tree models
            fi = model.feature_importances_
            importance = [
                {"feature": col, "shap_mean_abs": round(float(v), 6)}
                for col, v in zip(PRE_FLIGHT_FEATURES, fi)
            ]
        else:
            explainer = shap.Explainer(model, sample)
            sv = explainer(sample).values
            if len(sv.shape) == 3:
                sv = sv[:, :, 1]
            mean_abs = np.abs(sv).mean(axis=0)
            importance = [
                {"feature": col, "shap_mean_abs": round(float(v), 6)}
                for col, v in zip(PRE_FLIGHT_FEATURES, mean_abs)
            ]

        importance.sort(key=lambda x: x["shap_mean_abs"], reverse=True)

        # Save importance JSON
        out = MODELS_DIR / f"{model_name}_importance.json"
        with open(out, "w") as f:
            json.dump(importance, f, indent=2)
        logger.info(f"Saved feature importance to {out}")

    except Exception as e:
        logger.warning(f"Feature importance calculation note: {e}")
        # Fallback to feature_importances_ if model supports it
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
            importance = [
                {"feature": col, "shap_mean_abs": round(float(v), 6)}
                for col, v in zip(PRE_FLIGHT_FEATURES, fi)
            ]
            importance.sort(key=lambda x: x["shap_mean_abs"], reverse=True)
            with open(MODELS_DIR / f"{model_name}_importance.json", "w") as f:
                json.dump(importance, f, indent=2)


def train_and_save_classifier(df_train, df_val, df_test):
    X_train, y_train, _ = prepare_ml_dataset(df_train)
    X_val, y_val, _ = prepare_ml_dataset(df_val)
    X_test, y_test, _ = prepare_ml_dataset(df_test)

    best_name, best_clf, _ = train_classifiers(X_train, y_train, X_val, y_val)
    metrics = evaluate_classifier_on_test(best_clf, X_test, y_test, best_name, df_train, df_test)

    # Save model
    out_path = MODELS_DIR / "classifier_v1.pkl"
    joblib.dump(best_clf, out_path)
    logger.info(f"Saved classifier model to {out_path}")

    # Importance / SHAP
    save_shap_explainer(best_clf, X_train, "classifier_v1")

    return best_clf, metrics
