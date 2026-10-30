#!/usr/bin/env python3
"""
AeroIntel — Full Data & ML Pipeline Runner

Usage:
    cd backend
    python ../scripts/run_pipeline.py [--sample N] [--skip-weather] [--skip-training]

Options:
    --sample N          Use only N rows from BTS data (for development/testing)
    --skip-weather      Skip weather ingestion (use if already fetched)
    --skip-training     Skip ML training (only rebuild analytics cache)
    --start-date        Start date for weather fetch (default: 2022-01-01)
    --end-date          End date for weather fetch (default: 2024-12-31)

Pipeline steps:
    1. Load BTS flight data from backend/data/raw/*.csv
    2. Fetch historical weather from Open-Meteo (per airport)
    3. Clean and normalize flight data
    4. Join weather to flights
    5. Engineer features (leakage-free, rolling historical stats)
    6. Compute analytics cache (overview KPIs, airport stats, weather analytics)
    7. Train ML models (classifier + regressor)
    8. Compute SHAP explanations
    9. Save historical stats for inference

Prerequisites:
    - Download BTS On-Time Performance CSVs from:
        https://www.transtats.bts.gov/DL_SelectFields.aspx
    - Place CSV files in: backend/data/raw/
    - Install dependencies: pip install -r backend/requirements.txt
"""
import sys
import json
import argparse
import numpy as np
from pathlib import Path
from loguru import logger

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings


def run_pipeline(args):
    logger.info("=" * 60)
    logger.info(" AeroIntel Data & ML Pipeline")
    logger.info("=" * 60)

    # ── Step 1: Flight data ──────────────────────────────────────────────
    logger.info("STEP 1: Loading BTS flight data...")
    from data.ingestion.flights import load_bts_csvs, preprocess_bts, save_interim

    raw_df = load_bts_csvs()
    if args.sample:
        logger.info(f"  Sampling {args.sample:,} rows for development")
        raw_df = raw_df.sample(n=min(args.sample, len(raw_df)), random_state=42)

    df = preprocess_bts(raw_df)
    save_interim(df, "flights_clean.parquet")

    # ── Step 2: Weather data ─────────────────────────────────────────────
    if not args.skip_weather:
        logger.info("STEP 2: Fetching weather data from Open-Meteo...")
        from data.ingestion.weather import fetch_all_airport_weather, save_weather_interim
        weather_df = fetch_all_airport_weather(
            start_date=args.start_date,
            end_date=args.end_date,
        )
        save_weather_interim(weather_df)
    else:
        logger.info("STEP 2: Skipping weather (--skip-weather)")
        from data.ingestion.weather import load_weather_interim
        try:
            weather_df = load_weather_interim()
        except FileNotFoundError:
            logger.warning("No weather data found. Weather features will use defaults.")
            weather_df = None

    # ── Step 3: Join weather to flights ──────────────────────────────────
    logger.info("STEP 3: Joining weather to flights...")
    if weather_df is not None:
        from data.features.engineering import join_weather
        df = join_weather(df, weather_df)
    else:
        import pandas as pd
        for col, val in [("wx_precip", 0.0), ("wx_wind_speed", 15.0), ("wx_temp", 15.0), ("wx_visibility", 10.0)]:
            df[col] = val

    # ── Step 4: Feature engineering ──────────────────────────────────────
    logger.info("STEP 4: Engineering features (leakage-free rolling stats)...")
    from data.features.engineering import build_historical_stats, chronological_split
    df = build_historical_stats(df)
    df.to_parquet(settings.data_processed_dir / "flights_features.parquet", index=False)

    # ── Step 5: Analytics cache ──────────────────────────────────────────
    logger.info("STEP 5: Computing analytics cache...")
    build_analytics_cache(df)

    # ── Step 6: Historical stats for inference ───────────────────────────
    logger.info("STEP 6: Saving historical stats for inference...")
    save_historical_stats_for_inference(df, weather_df)

    # ── Step 7: ML Training ──────────────────────────────────────────────
    if not args.skip_training:
        logger.info("STEP 7: Training ML models...")
        train_df, val_df, test_df = chronological_split(df)

        from ml.training.classifier import train_and_save_classifier
        from ml.training.regressor import train_and_save_regressor

        clf, clf_metrics = train_and_save_classifier(train_df, val_df, test_df)
        logger.info(f"Classifier ROC-AUC: {clf_metrics['roc_auc']}")

        reg, reg_metrics = train_and_save_regressor(train_df, val_df, test_df)
        logger.info(f"Regressor MAE: {reg_metrics['mae']} min")

        # Update model registry
        registry = [
            {"id": "classifier_v1", "model_type": "classifier", "model_name": clf_metrics["model_name"],
             "trained_at": clf_metrics["trained_at"]},
            {"id": "regressor_v1", "model_type": "regressor", "model_name": reg_metrics["model_name"],
             "trained_at": reg_metrics["trained_at"]},
        ]
        with open(settings.models_dir / "registry.json", "w") as f:
            json.dump(registry, f, indent=2)
    else:
        logger.info("STEP 7: Skipping ML training (--skip-training)")

    logger.info("=" * 60)
    logger.info(" Pipeline complete!")
    logger.info("=" * 60)


def build_analytics_cache(df):
    """Build aggregated analytics cache for the frontend."""
    import pandas as pd

    cache = {}

    # Overview KPIs
    cache["overview"] = {
        "total_flights": int(len(df)),
        "delay_rate": round(float(df["delayed"].mean()), 4),
        "avg_delay_minutes": round(float(df["dep_delay"].clip(lower=0).mean()), 1),
        "airports_covered": int(df["origin"].nunique()),
        "airlines_covered": int(df["airline"].nunique()),
        "data_period_start": str(df["flight_date"].min().date()),
        "data_period_end": str(df["flight_date"].max().date()),
    }

    # Airport analytics
    airport_agg = (
        df.groupby("origin")
        .agg(
            total_flights=("delayed", "count"),
            delay_rate=("delayed", "mean"),
            avg_delay=("dep_delay", "mean"),
            congestion_index=("hist_congestion_proxy", "mean"),
        )
        .reset_index()
    )
    airport_agg.columns = ["iata", "total_flights", "delay_rate", "avg_delay", "congestion_index"]
    airport_agg["delay_rate"] = airport_agg["delay_rate"].round(4)
    airport_agg["avg_delay"] = airport_agg["avg_delay"].round(2)
    airport_agg["congestion_index"] = airport_agg["congestion_index"].round(1)
    cache["airports"] = airport_agg.to_dict(orient="records")

    # Airline analytics
    delayed_flights = df.loc[df["delayed"]]
    airline_agg = (
        df.groupby("airline")
        .agg(
            total_flights=("delayed", "count"),
            delay_rate=("delayed", "mean"),
        )
        .reset_index()
    )
    delayed_avg = delayed_flights.groupby("airline")["dep_delay"].mean()
    airline_agg["avg_delay"] = airline_agg["airline"].map(delayed_avg)
    airline_agg["avg_delay"] = airline_agg["avg_delay"].round(2)
    airline_agg.columns = ["code", "total_flights", "delay_rate", "avg_delay"]
    cache["airlines"] = airline_agg.to_dict(orient="records")

    # Monthly trends
    df["year_month"] = df["flight_date"].dt.to_period("M").astype(str)
    monthly = (
        df.groupby("year_month")
        .agg(delay_rate=("delayed", "mean"), total_flights=("delayed", "count"), avg_delay=("dep_delay", "mean"))
        .reset_index()
    )
    monthly.columns = ["period", "delay_rate", "total_flights", "avg_delay"]
    cache["trends_monthly"] = monthly.to_dict(orient="records")

    # Weather analytics (simple buckets)
    if "wx_precip" in df.columns:
        df["precip_bucket"] = pd.cut(
            df["wx_precip"],
            bins=[-1, 0.1, 5, 15, 1000],
            labels=["None (0mm)", "Light (0–5mm)", "Moderate (5–15mm)", "Heavy (>15mm)"],
        )
        precip_agg = (
            df.groupby("precip_bucket")
            .agg(delay_rate=("delayed", "mean"), count=("delayed", "count"))
            .reset_index()
        )
        precip_agg.columns = ["label", "delay_rate", "count"]
        cache["weather"] = {"precip_buckets": precip_agg.to_dict(orient="records")}

    out = settings.data_processed_dir / "analytics_cache.json"
    with open(out, "w") as f:
        json.dump(cache, f, default=str)
    logger.info(f"Analytics cache saved to {out}")


def save_historical_stats_for_inference(df, weather_df):
    """
    Precompute full-dataset historical stats for the inference pipeline.
    Used by the predictor to build pre-flight features for new queries.
    """
    stats = {"airports": {}, "routes": {}, "airlines": {}, "weather": {}}

    # Airport stats (full dataset)
    airport_agg = df.groupby("origin").agg(
        delay_rate=("delayed", "mean"),
        avg_delay=("dep_delay", "mean"),
        congestion_proxy=("hist_congestion_proxy", "mean"),
    )
    for iata, row in airport_agg.iterrows():
        stats["airports"][iata] = {
            "delay_rate": round(float(row["delay_rate"]), 4),
            "avg_delay": round(float(row["avg_delay"]), 2),
            "congestion_proxy": round(float(row["congestion_proxy"]), 1),
        }

    # Route stats
    route_agg = df.groupby(["origin", "dest"]).agg(
        delay_rate=("delayed", "mean"),
        avg_delay=("dep_delay", "mean"),
        distance=("distance", "mean"),
        flight_count=("delayed", "count"),
    )
    for (orig, dest), row in route_agg.iterrows():
        stats["routes"][f"{orig}_{dest}"] = {
            "delay_rate": round(float(row["delay_rate"]), 4),
            "avg_delay": round(float(row["avg_delay"]), 2),
            "distance": round(float(row["distance"]), 0),
            "flight_count": int(row["flight_count"]),
        }

    # Airline stats
    airline_agg = df.groupby("airline").agg(delay_rate=("delayed", "mean"))
    for airline, row in airline_agg.iterrows():
        stats["airlines"][airline] = {"delay_rate": round(float(row["delay_rate"]), 4)}

    # Monthly weather averages per airport (for inference fallback)
    if weather_df is not None:
        import pandas as pd
        weather_df["month"] = pd.to_datetime(weather_df["date"]).dt.month
        weather_monthly = weather_df.groupby(["airport", "month"]).agg(
            avg_precip=("precipitation_mm", "mean"),
            avg_wind=("windspeed_kmh", "mean"),
            avg_temp=("temp_c", "mean"),
            avg_visibility=("visibility_km", "mean"),
        ).reset_index()
        for _, row in weather_monthly.iterrows():
            apt = row["airport"]
            m = str(int(row["month"]))
            if apt not in stats["weather"]:
                stats["weather"][apt] = {}
            stats["weather"][apt][m] = {
                "avg_precip": round(float(row["avg_precip"]), 3),
                "avg_wind": round(float(row["avg_wind"]), 1),
                "avg_temp": round(float(row["avg_temp"]), 1),
                "avg_visibility": round(float(row["avg_visibility"]), 1),
            }

    out = settings.data_processed_dir / "historical_stats.json"
    with open(out, "w") as f:
        json.dump(stats, f)
    logger.info(f"Saved historical stats for inference to {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AeroIntel Pipeline Runner")
    parser.add_argument("--sample", type=int, default=None, help="Use N sample rows (for dev)")
    parser.add_argument("--skip-weather", action="store_true")
    parser.add_argument("--skip-training", action="store_true")
    parser.add_argument("--start-date", default="2022-01-01")
    parser.add_argument("--end-date", default="2024-12-31")
    args = parser.parse_args()

    run_pipeline(args)
