"""
BTS Flight Data Ingestion.

Downloads and loads US domestic on-time performance data from the
Bureau of Transportation Statistics (BTS).

Source: https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ&QO_fu146_anzr=b0-gvzr

The BTS portal requires manual CSV download. This module handles loading
and validating those CSVs once placed in data/raw/.

Fields used from BTS On-Time Performance dataset:
    FL_DATE, OP_UNIQUE_CARRIER, ORIGIN, DEST,
    CRS_DEP_TIME, DEP_DELAY, ARR_DELAY, CANCELLED, DISTANCE

Target definition:
    delayed = 1 if DEP_DELAY >= 15 (BTS standard threshold)
    delayed = 0 otherwise (including on-time and early departures)
"""
from __future__ import annotations
import pandas as pd
import numpy as np
from pathlib import Path
from loguru import logger
from app.core.config import settings

RAW_DIR = settings.data_raw_dir
INTERIM_DIR = settings.data_interim_dir

# BTS column rename mapping
BTS_COLUMN_MAP = {
    "FL_DATE": "flight_date",
    "OP_UNIQUE_CARRIER": "airline",
    "OP_CARRIER_FL_NUM": "flight_num",
    "ORIGIN": "origin",
    "DEST": "dest",
    "CRS_DEP_TIME": "sched_dep_time",
    "DEP_TIME": "actual_dep_time",
    "DEP_DELAY": "dep_delay",
    "ARR_DELAY": "arr_delay",
    "CANCELLED": "cancelled",
    "DISTANCE": "distance",
    "CARRIER_DELAY": "carrier_delay",
    "WEATHER_DELAY": "weather_delay",
    "NAS_DELAY": "nas_delay",
    "SECURITY_DELAY": "security_delay",
    "LATE_AIRCRAFT_DELAY": "late_aircraft_delay",
}

REQUIRED_COLS = [
    "flight_date", "airline", "origin", "dest",
    "sched_dep_time", "dep_delay", "cancelled", "distance",
]


def load_bts_csvs(raw_dir: Path = RAW_DIR) -> pd.DataFrame:
    """
    Load all BTS CSV files from raw_dir.

    BTS CSVs are named like: On_Time_Reporting_Carrier_On_Time_Performance_2023_1.csv
    Place them in backend/data/raw/ after downloading from BTS portal.
    """
    csv_files = list(raw_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(
            f"No BTS CSV files found in {raw_dir}.\n"
            "Download data from: https://www.transtats.bts.gov/DL_SelectFields.aspx\n"
            "Or run: python scripts/download_bts_instructions.py"
        )

    logger.info(f"Loading {len(csv_files)} BTS CSV file(s) from {raw_dir}")
    dfs = []
    for f in sorted(csv_files):
        logger.info(f"  → {f.name}")
        df = pd.read_csv(f, low_memory=False)
        dfs.append(df)

    combined = pd.concat(dfs, ignore_index=True)
    logger.info(f"Total rows loaded: {len(combined):,}")
    return combined


def preprocess_bts(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and standardize BTS flight data.
    Returns a cleaned DataFrame with no target leakage columns mixed in.
    """
    # Rename columns that exist
    rename = {k: v for k, v in BTS_COLUMN_MAP.items() if k in df.columns}
    df = df.rename(columns=rename)

    # Type conversions
    df["flight_date"] = pd.to_datetime(df["flight_date"], errors="coerce")
    df["dep_delay"] = pd.to_numeric(df["dep_delay"], errors="coerce")
    df["arr_delay"] = pd.to_numeric(df.get("arr_delay", pd.Series(dtype=float)), errors="coerce")
    df["cancelled"] = pd.to_numeric(df.get("cancelled", pd.Series(0.0)), errors="coerce").fillna(0).astype(int)
    df["distance"] = pd.to_numeric(df["distance"], errors="coerce")

    # Parse scheduled departure: HHMM integer → hour, minute
    df["sched_dep_time"] = pd.to_numeric(df["sched_dep_time"], errors="coerce")
    df["sched_dep_hour"] = (df["sched_dep_time"] // 100).clip(0, 23).astype("Int64")
    df["sched_dep_minute"] = (df["sched_dep_time"] % 100).clip(0, 59).astype("Int64")

    # Calendar features
    df["day_of_week"] = df["flight_date"].dt.dayofweek  # 0=Monday
    df["month"] = df["flight_date"].dt.month
    df["year"] = df["flight_date"].dt.year
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Target: binary delay (BTS standard: delayed if dep_delay >= 15 min)
    # Only for non-cancelled flights
    df["delayed"] = np.where(
        (df["cancelled"] == 0) & (df["dep_delay"] >= 15), 1, 0
    )

    # Drop cancelled flights for delay prediction (they are a separate prediction task)
    df_active = df[df["cancelled"] == 0].copy()

    # Drop rows with missing critical fields
    df_active = df_active.dropna(subset=["flight_date", "origin", "dest", "dep_delay", "distance"])

    logger.info(f"After cleaning: {len(df_active):,} non-cancelled flights")
    logger.info(f"Delay rate (>= 15 min): {df_active['delayed'].mean():.1%}")

    return df_active


def save_interim(df: pd.DataFrame, filename: str = "flights_clean.parquet"):
    """Save cleaned flight data to interim directory."""
    out_path = INTERIM_DIR / filename
    df.to_parquet(out_path, index=False)
    logger.info(f"Saved interim data to {out_path}")
    return out_path


def load_interim(filename: str = "flights_clean.parquet") -> pd.DataFrame:
    """Load cleaned flight data from interim directory."""
    path = INTERIM_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Interim file not found: {path}. Run ingestion pipeline first.")
    return pd.read_parquet(path)
