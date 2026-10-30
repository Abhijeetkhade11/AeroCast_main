"""
Historical Weather Data Ingestion using Open-Meteo Historical Weather API.
Source: https://open-meteo.com/en/docs/historical-weather-api
License: Free for non-commercial use, attribution required.

Fetches daily weather observations for each airport location.
Matched to flights by airport + date.

Variables fetched:
    - precipitation_sum (mm)
    - windspeed_10m_max (km/h)
    - temperature_2m_mean (°C)
    - visibility (km) — via hourly aggregation
    - snowfall_sum (cm)
"""
from __future__ import annotations
import requests
import pandas as pd
import time
from pathlib import Path
from loguru import logger
from app.core.config import settings
from app.api.routes.metadata import US_AIRPORTS

RAW_DIR = settings.data_raw_dir
INTERIM_DIR = settings.data_interim_dir

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

# Variables to fetch
DAILY_VARS = [
    "precipitation_sum",
    "windspeed_10m_max",
    "temperature_2m_mean",
    "snowfall_sum",
]

HOURLY_VARS = [
    "visibility",
]


def fetch_airport_weather(
    iata: str,
    lat: float,
    lon: float,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    """
    Fetch historical daily weather for an airport from Open-Meteo.

    Args:
        iata: Airport IATA code (for labeling)
        lat, lon: Airport coordinates
        start_date, end_date: Date strings in YYYY-MM-DD format

    Returns:
        DataFrame with columns: date, airport, precipitation_mm, windspeed_kmh,
        temp_c, snowfall_cm, avg_visibility_km
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": ",".join(DAILY_VARS),
        "hourly": ",".join(HOURLY_VARS),
        "timezone": "auto",
    }

    response = requests.get(OPEN_METEO_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    # Build daily DataFrame
    daily = data.get("daily", {})
    df_daily = pd.DataFrame({
        "date": pd.to_datetime(daily.get("time", [])),
        "precipitation_mm": daily.get("precipitation_sum", []),
        "windspeed_kmh": daily.get("windspeed_10m_max", []),
        "temp_c": daily.get("temperature_2m_mean", []),
        "snowfall_cm": daily.get("snowfall_sum", []),
    })

    # Aggregate hourly visibility to daily average
    hourly = data.get("hourly", {})
    if hourly.get("time") and hourly.get("visibility"):
        df_hourly = pd.DataFrame({
            "dt": pd.to_datetime(hourly["time"]),
            "visibility_m": hourly["visibility"],
        })
        df_hourly["date"] = df_hourly["dt"].dt.normalize()
        df_hourly["visibility_km"] = df_hourly["visibility_m"] / 1000
        daily_vis = df_hourly.groupby("date")["visibility_km"].mean().reset_index()
        df_daily = df_daily.merge(daily_vis, on="date", how="left")
    else:
        df_daily["visibility_km"] = None

    df_daily["airport"] = iata
    df_daily = df_daily.fillna(0)

    return df_daily


def fetch_all_airport_weather(
    start_date: str = "2022-01-01",
    end_date: str = "2024-12-31",
    airports: list = None,
    delay_seconds: float = 0.5,
) -> pd.DataFrame:
    """
    Fetch weather for all US airports with rate limiting.

    Open-Meteo free tier is generous but we rate-limit to be respectful.
    """
    if airports is None:
        airports = US_AIRPORTS

    all_dfs = []
    for i, airport in enumerate(airports):
        iata = airport["iata"]
        logger.info(f"  [{i+1}/{len(airports)}] Fetching weather for {iata}...")
        try:
            df = fetch_airport_weather(
                iata=iata,
                lat=airport["lat"],
                lon=airport["lon"],
                start_date=start_date,
                end_date=end_date,
            )
            all_dfs.append(df)
            time.sleep(delay_seconds)
        except Exception as e:
            logger.warning(f"    Failed for {iata}: {e}")

    if not all_dfs:
        raise RuntimeError("No weather data fetched for any airport.")

    combined = pd.concat(all_dfs, ignore_index=True)
    logger.info(f"Total weather records: {len(combined):,}")
    return combined


def save_weather_interim(df: pd.DataFrame, filename: str = "weather.parquet"):
    out_path = INTERIM_DIR / filename
    df.to_parquet(out_path, index=False)
    logger.info(f"Saved weather data to {out_path}")
    return out_path


def load_weather_interim(filename: str = "weather.parquet") -> pd.DataFrame:
    path = INTERIM_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Weather interim file not found: {path}. Run weather ingestion first.")
    return pd.read_parquet(path)
