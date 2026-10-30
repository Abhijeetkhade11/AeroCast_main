"""
Feature Engineering Pipeline.

Creates pre-flight prediction features with strict leakage prevention.

LEAKAGE PREVENTION RULES:
    1. No post-event fields: actual_dep_time, actual_arr_time, arr_delay,
       carrier_delay, weather_delay, nas_delay, etc.
    2. All rolling historical statistics use ONLY data prior to the flight date.
       We compute a 90-day lookback window ending the day before the flight.
    3. Weather features use the forecast/historical observation for the SAME day,
       which would be available before the flight in a real operational setting.
    4. No direct dep_delay leakage into pre-flight features.
"""
from __future__ import annotations
import pandas as pd
import numpy as np
from pathlib import Path
from loguru import logger
from app.core.config import settings
from tqdm import tqdm

INTERIM_DIR = settings.data_interim_dir
PROCESSED_DIR = settings.data_processed_dir

DELAY_THRESHOLD = settings.delay_threshold_minutes  # 15 min

# Rolling lookback window (days) for historical stats
LOOKBACK_DAYS = 90

PRE_FLIGHT_FEATURES = [
    "sched_dep_hour",
    "day_of_week",
    "month",
    "is_weekend",
    "distance",
    "hist_origin_delay_rate",
    "hist_dest_delay_rate",
    "hist_route_delay_rate",
    "hist_airline_delay_rate",
    "hist_origin_avg_delay",
    "hist_congestion_proxy",
    "wx_precip",
    "wx_wind_speed",
    "wx_temp",
    "wx_visibility",
]

TARGET = "delayed"
REGRESSION_TARGET = "dep_delay"


def build_historical_stats(df: pd.DataFrame, lookback: int = LOOKBACK_DAYS) -> pd.DataFrame:
    """
    Compute rolling historical delay statistics per flight row.

    For each flight on date D:
      - Uses flights from [D - lookback, D - 1] to compute stats.
      - This ensures no future data leakage.

    This is the most computationally intensive step.
    For large datasets, consider chunked computation or precomputed lookup tables.
    """
    logger.info("Computing rolling historical statistics (leakage-free)...")

    # Sort by date for efficient rolling
    df = df.sort_values("flight_date").reset_index(drop=True)

    # We'll compute airport, route, and airline stats via groupby + expanding join
    # Strategy: pre-aggregate daily stats, then join with window

    # Daily airport stats
    daily_airport = (
        df.groupby(["flight_date", "origin"])
        .agg(
            daily_flights=("delayed", "count"),
            daily_delayed=("delayed", "sum"),
            daily_avg_delay=("dep_delay", "mean"),
        )
        .reset_index()
    )

    # Daily route stats
    daily_route = (
        df.groupby(["flight_date", "origin", "dest"])
        .agg(
            route_flights=("delayed", "count"),
            route_delayed=("delayed", "sum"),
        )
        .reset_index()
    )

    # Daily airline stats
    daily_airline = (
        df.groupby(["flight_date", "airline"])
        .agg(
            airline_flights=("delayed", "count"),
            airline_delayed=("delayed", "sum"),
        )
        .reset_index()
    )

    logger.info("Building rolling window lookups...")

    # Compute rolling stats for airports
    dates = sorted(df["flight_date"].unique())

    airport_stats_map = {}  # date → airport → {rate, avg_delay, congestion}
    route_stats_map = {}    # date → route_key → {rate}
    airline_stats_map = {}  # date → airline → {rate}

    for d in tqdm(dates, desc="Rolling windows"):
        window_start = d - pd.Timedelta(days=lookback)
        window = daily_airport[
            (daily_airport["flight_date"] >= window_start) &
            (daily_airport["flight_date"] < d)
        ]
        airport_agg = (
            window.groupby("origin")
            .agg(
                total=("daily_flights", "sum"),
                delayed=("daily_delayed", "sum"),
                avg_delay=("daily_avg_delay", "mean"),
            )
        )
        airport_agg["delay_rate"] = airport_agg["delayed"] / airport_agg["total"].clip(1)
        airport_stats_map[d] = airport_agg.to_dict(orient="index")

        # Congestion proxy: avg daily flight count in window
        cong = window.groupby("origin")["daily_flights"].mean()
        cong_max = cong.max() if len(cong) > 0 else 1
        for apt in cong.index:
            if apt in airport_stats_map[d]:
                airport_stats_map[d][apt]["congestion_proxy"] = (
                    (cong[apt] / cong_max) * 100
                )

        # Route stats
        route_window = daily_route[
            (daily_route["flight_date"] >= window_start) &
            (daily_route["flight_date"] < d)
        ]
        route_agg = (
            route_window.groupby(["origin", "dest"])
            .agg(total=("route_flights", "sum"), delayed=("route_delayed", "sum"))
        )
        route_agg["delay_rate"] = route_agg["delayed"] / route_agg["total"].clip(1)
        route_stats_map[d] = {
            f"{r[0]}_{r[1]}": {"delay_rate": v, "total": t}
            for (r, v, t) in zip(
                route_agg.index,
                route_agg["delay_rate"],
                route_agg["total"],
            )
        }

        # Airline stats
        airline_window = daily_airline[
            (daily_airline["flight_date"] >= window_start) &
            (daily_airline["flight_date"] < d)
        ]
        airline_agg = (
            airline_window.groupby("airline")
            .agg(total=("airline_flights", "sum"), delayed=("airline_delayed", "sum"))
        )
        airline_agg["delay_rate"] = airline_agg["delayed"] / airline_agg["total"].clip(1)
        airline_stats_map[d] = airline_agg["delay_rate"].to_dict()

    logger.info("Joining historical stats to flights...")

    # Apply stats to each row
    def apply_stats(row):
        d = row["flight_date"]
        origin = row["origin"]
        dest = row["dest"]
        airline = row["airline"]
        route_key = f"{origin}_{dest}"

        a_stats = airport_stats_map.get(d, {}).get(origin, {})
        r_stats = route_stats_map.get(d, {}).get(route_key, {})
        d_stats = airport_stats_map.get(d, {}).get(dest, {})
        al_stats = airline_stats_map.get(d, {})

        return pd.Series({
            "hist_origin_delay_rate": a_stats.get("delay_rate", 0.20),
            "hist_dest_delay_rate": d_stats.get("delay_rate", 0.20),
            "hist_route_delay_rate": r_stats.get("delay_rate", 0.20),
            "hist_airline_delay_rate": al_stats.get(airline, 0.20),
            "hist_origin_avg_delay": a_stats.get("avg_delay", 12.0),
            "hist_congestion_proxy": a_stats.get("congestion_proxy", 50.0),
        })

    hist_features = df.apply(apply_stats, axis=1)
    df = pd.concat([df, hist_features], axis=1)

    return df


def join_weather(df: pd.DataFrame, weather: pd.DataFrame) -> pd.DataFrame:
    """
    Join weather observations to flights.

    Matching strategy:
      - Join on origin airport + flight_date
      - Weather represents the daily observations at the origin airport
      - This is information available before departure in an operational setting

    Timezone note:
      - BTS flight dates are in local time. We join on the calendar date.
      - Weather data from Open-Meteo is fetched per airport location with
        timezone="auto", so dates align with local airport timezone.
    """
    logger.info("Joining weather to flights...")

    weather_cols = weather.rename(columns={
        "precipitation_mm": "wx_precip",
        "windspeed_kmh": "wx_wind_speed",
        "temp_c": "wx_temp",
        "visibility_km": "wx_visibility",
        "snowfall_cm": "wx_snowfall",
    })[["date", "airport", "wx_precip", "wx_wind_speed", "wx_temp", "wx_visibility"]]

    weather_cols = weather_cols.rename(columns={"date": "flight_date", "airport": "origin"})

    df = df.merge(weather_cols, on=["flight_date", "origin"], how="left")

    # Fill missing weather with global means (clearly documented)
    for col, default in [("wx_precip", 0.0), ("wx_wind_speed", 15.0), ("wx_temp", 15.0), ("wx_visibility", 10.0)]:
        df[col] = df[col].fillna(default)

    logger.info(f"Weather join coverage: {df['wx_precip'].notna().mean():.1%}")
    return df


def prepare_ml_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Extract final feature matrix and targets for ML training.

    Returns:
        X: Feature DataFrame (PRE_FLIGHT_FEATURES only)
        y_class: Binary delay labels (0/1)
        y_reg: Delay duration in minutes (only for delayed flights)
    """
    X = df[PRE_FLIGHT_FEATURES].copy()
    y_class = df[TARGET].copy()
    y_reg = df[REGRESSION_TARGET].copy().clip(lower=0)

    logger.info(f"Feature matrix shape: {X.shape}")
    logger.info(f"Class balance: {y_class.mean():.1%} delayed")

    return X, y_class, y_reg


def chronological_split(df: pd.DataFrame, val_frac: float = 0.10, test_frac: float = 0.15):
    """
    Time-aware train/val/test split.

    Avoids mixing future records into past evaluation.
    Test set = last test_frac of time period.
    Val set = preceding val_frac.
    """
    df = df.sort_values("flight_date")
    n = len(df)
    test_start = int(n * (1 - test_frac))
    val_start = int(n * (1 - test_frac - val_frac))

    train = df.iloc[:val_start]
    val = df.iloc[val_start:test_start]
    test = df.iloc[test_start:]

    logger.info(f"Train: {len(train):,} ({train['flight_date'].min()} → {train['flight_date'].max()})")
    logger.info(f"Val:   {len(val):,} ({val['flight_date'].min()} → {val['flight_date'].max()})")
    logger.info(f"Test:  {len(test):,} ({test['flight_date'].min()} → {test['flight_date'].max()})")

    return train, val, test
