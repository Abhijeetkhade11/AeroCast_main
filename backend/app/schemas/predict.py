"""
Pydantic schemas for prediction request and response.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date


class PredictRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3, description="IATA origin airport code")
    destination: str = Field(..., min_length=3, max_length=3, description="IATA destination airport code")
    airline: str = Field(..., min_length=2, max_length=2, description="BTS carrier code (e.g., 'AA')")
    flight_date: date = Field(..., description="Scheduled flight date")
    scheduled_departure_hour: int = Field(..., ge=0, le=23, description="Scheduled departure hour (0–23, local airport time)")
    scheduled_departure_minute: int = Field(0, ge=0, le=59, description="Scheduled departure minute")

    @field_validator("origin", "destination")
    @classmethod
    def to_upper(cls, v: str) -> str:
        return v.upper()

    @field_validator("airline")
    @classmethod
    def airline_upper(cls, v: str) -> str:
        return v.upper()

    model_config = {
        "json_schema_extra": {
            "example": {
                "origin": "JFK",
                "destination": "LAX",
                "airline": "AA",
                "flight_date": "2024-12-20",
                "scheduled_departure_hour": 18,
                "scheduled_departure_minute": 30,
            }
        }
    }


class ShapFactor(BaseModel):
    feature: str
    display_name: str
    shap_value: float
    direction: str  # 'increases_risk' | 'decreases_risk'
    description: str


class HistoricalContext(BaseModel):
    similar_flights_count: int
    avg_delay_rate: float
    avg_delay_minutes: float
    note: str


class PredictResponse(BaseModel):
    # Core predictions
    delay_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of delay >= 15 min")
    risk_category: str = Field(..., description="'LOW' | 'MODERATE' | 'HIGH'")
    expected_delay_minutes: Optional[float] = Field(None, description="Regression estimate (only when delay likely)")

    # Model metadata
    classifier_model: str
    regressor_model: Optional[str]
    delay_threshold_minutes: int = 15
    prediction_note: str = "Predicted probability based on historical patterns. Not a guarantee."

    # Explainability
    shap_factors: List[ShapFactor]

    # Historical context
    historical_context: Optional[HistoricalContext]

    # Weather info used
    weather_source: str = Field(..., description="Weather data source: 'forecast' or 'seasonal_average'")
    weather_days_out: int = Field(..., description="Days between current date and target flight date")
    weather_used: dict = Field(..., description="Actual weather values used for prediction: precip_mm, wind_speed_kmh, temp_c, visibility_km")
    weather_impact_summary: str = Field(..., description="Human-readable summary of how weather affected this prediction")
    weather_shap_factors: List[ShapFactor] = Field(default_factory=list, description="Specific SHAP explainability factors for weather features")

    # Features used (for transparency)
    features_used: List[str]


