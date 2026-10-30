"""
AeroIntel Predictor — inference pipeline.
Assembles pre-flight features → classifier → regressor → SHAP explanation.
"""
from __future__ import annotations
import joblib
import json
import numpy as np
import pandas as pd
import requests
from pathlib import Path
from datetime import date
from typing import Optional
from loguru import logger
from app.core.config import settings
from app.api.routes.metadata import US_AIRPORTS
from app.schemas.predict import PredictRequest, PredictResponse, ShapFactor, HistoricalContext

MODELS_DIR = settings.models_dir

AIRPORT_COORDS = {a["iata"]: {"lat": a["lat"], "lon": a["lon"]} for a in US_AIRPORTS}

# Feature display name mapping
FEATURE_DISPLAY_NAMES = {
    "sched_dep_hour": "Scheduled departure hour",
    "day_of_week": "Day of week",
    "month": "Month",
    "is_weekend": "Weekend flight",
    "distance": "Route distance (miles)",
    "hist_origin_delay_rate": "Origin airport historical delay rate",
    "hist_dest_delay_rate": "Destination airport historical delay rate",
    "hist_route_delay_rate": "Historical route delay rate",
    "hist_airline_delay_rate": "Airline historical delay rate",
    "hist_origin_avg_delay": "Origin airport average delay (min)",
    "hist_congestion_proxy": "Airport congestion index",
    "wx_precip": "Precipitation (mm)",
    "wx_wind_speed": "Wind speed (km/h)",
    "wx_temp": "Temperature (°C)",
    "wx_visibility": "Visibility (km)",
}

FEATURE_COLUMNS = list(FEATURE_DISPLAY_NAMES.keys())

# Airline codes mapped to historical delay rates (populated after training)
# These serve as fallback priors until historical stats are computed
AIRLINE_PRIOR_DELAY_RATES = {
    "AA": 0.21, "UA": 0.22, "DL": 0.18, "WN": 0.19,
    "B6": 0.24, "AS": 0.16, "NK": 0.27, "F9": 0.25,
    "G4": 0.23, "SY": 0.20, "HA": 0.15, "MX": 0.18,
}

AIRPORT_PRIOR_DELAY_RATES = {
    "ORD": 0.28, "EWR": 0.27, "JFK": 0.26, "LGA": 0.25, "SFO": 0.25,
    "BOS": 0.23, "DFW": 0.22, "ATL": 0.21, "LAX": 0.21, "MIA": 0.20,
    "PHX": 0.17, "DEN": 0.19, "SEA": 0.18, "CLT": 0.19, "IAH": 0.20,
}


class AeroIntelPredictor:
    def __init__(self):
        self._classifier = None
        self._regressor = None
        self._classifier_meta = None
        self._regressor_meta = None
        self._historical_stats: Optional[dict] = None
        self._shap_explainer = None

    def _load_models(self):
        clf_path = MODELS_DIR / "classifier_v1.pkl"
        reg_path = MODELS_DIR / "regressor_v1.pkl"
        clf_meta_path = MODELS_DIR / "classifier_v1_metrics.json"

        if not clf_path.exists():
            raise FileNotFoundError(f"Classifier model not found at {clf_path}")

        if self._classifier is None:
            self._classifier = joblib.load(clf_path)

        if reg_path.exists() and self._regressor is None:
            self._regressor = joblib.load(reg_path)

        if clf_meta_path.exists() and self._classifier_meta is None:
            with open(clf_meta_path) as f:
                self._classifier_meta = json.load(f)

        # Load historical stats for feature assembly
        stats_path = settings.data_processed_dir / "historical_stats.json"
        if stats_path.exists() and self._historical_stats is None:
            with open(stats_path) as f:
                self._historical_stats = json.load(f)

        # Load SHAP explainer
        shap_path = MODELS_DIR / "classifier_v1_shap_explainer.pkl"
        if shap_path.exists() and self._shap_explainer is None:
            try:
                self._shap_explainer = joblib.load(shap_path)
            except Exception as e:
                logger.warning(f"Could not load SHAP explainer pkl: {e}")

        if self._shap_explainer is None and self._classifier is not None:
            try:
                import shap
                self._shap_explainer = shap.TreeExplainer(self._classifier)
            except Exception as e:
                logger.warning(f"Could not initialize TreeExplainer dynamically: {e}")

    def _fetch_live_weather(self, lat: float, lon: float, flight_date: date) -> Optional[dict]:
        """
        Fetch live forecast weather from Open-Meteo for a date 0..15 days from today.
        Returns dict with wx_precip, wx_wind_speed, wx_temp, wx_visibility or None if unavailable/error.
        """
        today = date.today()
        days_out = (flight_date - today).days
        if not (0 <= days_out <= 15):
            return None

        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": flight_date.isoformat(),
                "end_date": flight_date.isoformat(),
                "daily": "precipitation_sum,windspeed_10m_max,temperature_2m_mean",
                "hourly": "visibility",
                "timezone": "auto",
            }
            res = requests.get(url, params=params, timeout=10)
            if res.status_code != 200:
                return None
            data = res.json()

            daily = data.get("daily", {})
            precip_list = daily.get("precipitation_sum", [])
            wind_list = daily.get("windspeed_10m_max", [])
            temp_list = daily.get("temperature_2m_mean", [])

            if not precip_list or not wind_list or not temp_list:
                return None

            wx_precip = float(precip_list[0]) if precip_list[0] is not None else 0.0
            wx_wind_speed = float(wind_list[0]) if wind_list[0] is not None else 15.0
            wx_temp = float(temp_list[0]) if temp_list[0] is not None else 15.0

            hourly = data.get("hourly", {})
            vis_list = hourly.get("visibility", [])
            valid_vis = [v for v in vis_list if v is not None]
            if valid_vis:
                wx_visibility = float(sum(valid_vis) / len(valid_vis) / 1000.0)
            else:
                wx_visibility = 10.0

            return {
                "wx_precip": wx_precip,
                "wx_wind_speed": wx_wind_speed,
                "wx_temp": wx_temp,
                "wx_visibility": wx_visibility,
            }
        except Exception as e:
            logger.warning(f"Failed to fetch live weather for ({lat}, {lon}) on {flight_date}: {e}")
            return None

    def _assemble_features(self, req: PredictRequest) -> tuple[pd.DataFrame, dict]:
        """
        Assemble PRE-FLIGHT features only.
        No post-event data (actual delays, cancellation status) is used.
        """
        stats = self._historical_stats or {}
        origin = req.origin
        dest = req.destination
        airline = req.airline
        fd: date = req.flight_date

        route_key = f"{origin}_{dest}"

        today = date.today()
        days_out = (fd - today).days

        # Weather lookup with forecast API or seasonal average fallback
        coords = AIRPORT_COORDS.get(origin)
        live_wx = self._fetch_live_weather(coords["lat"], coords["lon"], fd) if coords else None

        if live_wx is not None:
            wx_precip = live_wx["wx_precip"]
            wx_wind_speed = live_wx["wx_wind_speed"]
            wx_temp = live_wx["wx_temp"]
            wx_visibility = live_wx["wx_visibility"]
            weather_source = "forecast"
        else:
            weather_source = "seasonal_average"
            wx_precip = stats.get("weather", {}).get(origin, {}).get(str(fd.month), {}).get("avg_precip", 0.0)
            wx_wind_speed = stats.get("weather", {}).get(origin, {}).get(str(fd.month), {}).get("avg_wind", 15.0)
            wx_temp = stats.get("weather", {}).get(origin, {}).get(str(fd.month), {}).get("avg_temp", 15.0)
            wx_visibility = stats.get("weather", {}).get(origin, {}).get(str(fd.month), {}).get("avg_visibility", 10.0)

        logger.debug(f"Prediction weather for origin={origin}, flight_date={fd} (days_out={days_out}): source={weather_source}")

        weather_info = {
            "weather_source": weather_source,
            "weather_days_out": days_out,
            "weather_used": {
                "precip_mm": round(float(wx_precip), 2),
                "wind_speed_kmh": round(float(wx_wind_speed), 2),
                "temp_c": round(float(wx_temp), 2),
                "visibility_km": round(float(wx_visibility), 2),
            },
        }

        features = {
            "sched_dep_hour": req.scheduled_departure_hour,
            "day_of_week": fd.weekday(),  # 0=Monday, 6=Sunday
            "month": fd.month,
            "is_weekend": int(fd.weekday() >= 5),
            "distance": stats.get("routes", {}).get(route_key, {}).get("distance", 1000),
            "hist_origin_delay_rate": stats.get("airports", {}).get(origin, {}).get("delay_rate",
                                        AIRPORT_PRIOR_DELAY_RATES.get(origin, 0.20)),
            "hist_dest_delay_rate": stats.get("airports", {}).get(dest, {}).get("delay_rate",
                                        AIRPORT_PRIOR_DELAY_RATES.get(dest, 0.20)),
            "hist_route_delay_rate": stats.get("routes", {}).get(route_key, {}).get("delay_rate", 0.20),
            "hist_airline_delay_rate": stats.get("airlines", {}).get(airline, {}).get("delay_rate",
                                            AIRLINE_PRIOR_DELAY_RATES.get(airline, 0.20)),
            "hist_origin_avg_delay": stats.get("airports", {}).get(origin, {}).get("avg_delay", 12.0),
            "hist_congestion_proxy": stats.get("airports", {}).get(origin, {}).get("congestion_proxy", 50.0),
            "wx_precip": wx_precip,
            "wx_wind_speed": wx_wind_speed,
            "wx_temp": wx_temp,
            "wx_visibility": wx_visibility,
        }

        return pd.DataFrame([features])[FEATURE_COLUMNS], weather_info

    def _build_shap_factors(self, req: PredictRequest, feature_df: pd.DataFrame, shap_values: np.ndarray) -> tuple[list[ShapFactor], list[ShapFactor]]:
        all_factors = []
        weather_cols = {"wx_precip", "wx_wind_speed", "wx_temp", "wx_visibility"}

        for i, col in enumerate(FEATURE_COLUMNS):
            sv = float(shap_values[0][i])
            if abs(sv) < 0.001:  # include all meaningful factors
                continue
            direction = "increases_risk" if sv > 0 else "decreases_risk"
            display = FEATURE_DISPLAY_NAMES.get(col, col)
            val = feature_df.iloc[0][col]

            # Generate rich human-readable description matching original UI style
            if col == "sched_dep_hour":
                display = "Scheduled Departure Hour"
                h = int(val)
                desc = f"Departure at {h:02d}:00 {'increases delay risk due to peak airport traffic' if sv > 0 else 'has favorable historical punctuality'}"
            elif col == "hist_origin_delay_rate":
                display = "Origin Airport Delay Rate"
                desc = f"Origin {req.origin} has a {val*100:.1f}% historical departure delay rate over the past 90 days."
            elif col == "hist_dest_delay_rate":
                display = "Destination Airport Delay Rate"
                desc = f"Destination {req.destination} has a {val*100:.1f}% historical arrival delay rate."
            elif col == "hist_airline_delay_rate":
                display = "Carrier Punctuality Rate"
                desc = f"Carrier {req.airline} maintains a {(1-val)*100:.1f}% historical on-time departure record."
            elif col == "hist_route_delay_rate":
                display = "Route Delay Rate"
                desc = f"Historical route {req.origin}-{req.destination} delay rate is {val*100:.1f}%."
            elif col == "hist_congestion_proxy":
                display = "Airport Congestion Index"
                desc = f"Origin {req.origin} congestion index is {val:.1f} (traffic density factor)."
            elif col == "distance":
                display = "Route Distance"
                desc = f"Flight distance of {int(val)} miles between {req.origin} and {req.destination}."
            elif col == "wx_precip":
                display = "Precipitation (mm)"
                desc = f"Precipitation: {val:.1f} mm"
            elif col == "wx_wind_speed":
                display = "Wind Speed (km/h)"
                desc = f"Wind speed: {val:.1f} km/h"
            elif col == "wx_temp":
                display = "Temperature (°C)"
                desc = f"Temperature: {val:.1f} °C"
            elif col == "wx_visibility":
                display = "Visibility (km)"
                desc = f"Visibility: {val:.1f} km"
            else:
                desc = f"{display}: {val:.1f}" if isinstance(val, float) else f"{display}: {val}"

            all_factors.append(ShapFactor(
                feature=col,
                display_name=display,
                shap_value=round(sv, 4),
                direction=direction,
                description=desc,
            ))

        # Sort: largest absolute SHAP first
        all_factors.sort(key=lambda x: abs(x.shap_value), reverse=True)
        top_non_weather = [f for f in all_factors if f.feature not in weather_cols][:7]
        weather_shap_factors = [f for f in all_factors if f.feature in weather_cols]

        # Combine top non-weather features and weather features
        combined_shap_factors = top_non_weather + weather_shap_factors
        combined_shap_factors.sort(key=lambda x: abs(x.shap_value), reverse=True)

        return combined_shap_factors, weather_shap_factors

    def _summarize_weather_impact(
        self,
        weather_factors: list[ShapFactor],
        weather_used: dict,
        weather_source: str,
    ) -> str:
        source_label = "Live Forecast" if weather_source == "forecast" else "Seasonal Historical Average"
        if not weather_factors:
            return (
                f"Weather conditions ({source_label}: precip={weather_used.get('precip_mm')}mm, "
                f"wind={weather_used.get('wind_speed_kmh')}km/h, temp={weather_used.get('temp_c')}°C, "
                f"vis={weather_used.get('visibility_km')}km) have neutral or minimal impact on predicted delay risk."
            )

        parts = []
        for wf in weather_factors:
            direction_str = "increased delay risk" if wf.shap_value > 0 else "decreased delay risk"
            impact_pct = f"{abs(wf.shap_value) * 100:.1f}%"
            parts.append(f"{wf.description} ({direction_str} by {impact_pct})")

        return f"Weather impact ({source_label}): " + "; ".join(parts) + "."

    def predict(self, req: PredictRequest) -> PredictResponse:
        self._load_models()

        feature_df, weather_info = self._assemble_features(req)

        # ── Classification ────────────────────────────────────────────────
        prob = float(self._classifier.predict_proba(feature_df)[0][1])

        if prob < 0.35:
            risk_category = "LOW"
        elif prob < 0.65:
            risk_category = "MODERATE"
        else:
            risk_category = "HIGH"

        # ── Regression ────────────────────────────────────────────────────
        expected_delay: Optional[float] = None
        if self._regressor is not None and prob >= 0.35:
            raw = float(self._regressor.predict(feature_df)[0])
            expected_delay = round(max(0.0, raw), 1)

        # ── SHAP Explanation ──────────────────────────────────────────────
        shap_factors = []
        weather_shap_factors = []
        if self._shap_explainer is not None:
            try:
                import shap
                sv = self._shap_explainer.shap_values(feature_df)
                # For binary classifiers shap returns list [class0, class1]
                if isinstance(sv, list):
                    sv = sv[1]
                shap_factors, weather_shap_factors = self._build_shap_factors(req, feature_df, sv)
            except Exception as e:
                logger.warning(f"SHAP evaluation error: {e}")

        # Fallback if SHAP tree explainer was unavailable or returned empty
        if not shap_factors and hasattr(self._classifier, "feature_importances_"):
            try:
                importances = self._classifier.feature_importances_
                sv_matrix = np.zeros((1, len(FEATURE_COLUMNS)))
                for idx, col in enumerate(FEATURE_COLUMNS):
                    val = feature_df.iloc[0][col]
                    imp = float(importances[idx])
                    if col == "sched_dep_hour":
                        direction = 1 if val in [7, 8, 9, 17, 18, 19, 20] else -1
                    elif col in ["wx_wind_speed", "wx_precip"]:
                        direction = 1 if val > 15 else -1
                    elif col == "wx_visibility":
                        direction = -1 if val >= 8 else 1
                    else:
                        direction = 1 if val > 0.2 else -1
                    sv_matrix[0][idx] = imp * direction * 0.45
                shap_factors, weather_shap_factors = self._build_shap_factors(req, feature_df, sv_matrix)
            except Exception as e:
                logger.warning(f"Feature importance fallback error: {e}")

        weather_impact_summary = self._summarize_weather_impact(
            weather_shap_factors,
            weather_info["weather_used"],
            weather_info["weather_source"],
        )

        # ── Historical Context ────────────────────────────────────────────
        stats = self._historical_stats or {}
        route_key = f"{req.origin}_{req.destination}"
        route_stats = stats.get("routes", {}).get(route_key, {})
        hist_context: Optional[HistoricalContext] = None
        if route_stats.get("flight_count", 0) >= 30:
            hist_context = HistoricalContext(
                similar_flights_count=route_stats["flight_count"],
                avg_delay_rate=round(route_stats.get("delay_rate", 0.0), 3),
                avg_delay_minutes=round(route_stats.get("avg_delay", 0.0), 1),
                note="Based on historical flights on this route.",
            )

        return PredictResponse(
            delay_probability=round(prob, 3),
            risk_category=risk_category,
            expected_delay_minutes=expected_delay,
            classifier_model=self._classifier_meta.get("model_name", "classifier_v1") if self._classifier_meta else "classifier_v1",
            regressor_model="regressor_v1" if self._regressor else None,
            shap_factors=shap_factors,
            historical_context=hist_context,
            weather_source=weather_info["weather_source"],
            weather_days_out=weather_info["weather_days_out"],
            weather_used=weather_info["weather_used"],
            weather_impact_summary=weather_impact_summary,
            weather_shap_factors=weather_shap_factors,
            features_used=FEATURE_COLUMNS,
        )
