"""
AeroIntel — ML Model Training Entry Point

Trains both classification and regression models on processed feature dataset.
Saves model pickles, metrics JSONs, and SHAP explainers to backend/models/.
"""
import sys
import pandas as pd
from pathlib import Path
from loguru import logger

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from data.features.engineering import chronological_split
from ml.training.classifier import train_and_save_classifier
from ml.training.regressor import train_and_save_regressor


def main():
    processed_file = settings.data_processed_dir / "flights_features.parquet"
    if not processed_file.exists():
        logger.error(f"Processed features file not found at {processed_file}")
        logger.error("Run the data pipeline first: python scripts/run_pipeline.py")
        sys.exit(1)

    logger.info(f"Loading processed features from {processed_file}...")
    df = pd.read_parquet(processed_file)
    logger.info(f"Loaded {len(df):,} records.")

    logger.info("Splitting dataset chronologically...")
    train_df, val_df, test_df = chronological_split(df)

    logger.info("--- 1. TRAINING CLASSIFIER ---")
    clf, clf_metrics = train_and_save_classifier(train_df, val_df, test_df)

    logger.info("--- 2. TRAINING REGRESSOR ---")
    reg, reg_metrics = train_and_save_regressor(train_df, val_df, test_df)

    logger.info("All models trained and persisted successfully!")


if __name__ == "__main__":
    main()
