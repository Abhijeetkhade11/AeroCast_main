// ── Airport & Airline Types ──────────────────────────────────────────────
export interface Airport {
  iata: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  tz: string;
}

export interface Airline {
  code: string;
  name: string;
  iata: string;
}

// ── Prediction Types ─────────────────────────────────────────────────────
export interface PredictRequest {
  origin: string;
  destination: string;
  airline: string;
  flight_date: string;          // YYYY-MM-DD
  scheduled_departure_hour: number;
  scheduled_departure_minute: number;
}

export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH';

export interface ShapFactor {
  feature: string;
  display_name: string;
  shap_value: number;
  direction: 'increases_risk' | 'decreases_risk';
  description: string;
}

export interface HistoricalContext {
  similar_flights_count: number;
  avg_delay_rate: number;
  avg_delay_minutes: number;
  note: string;
}

export interface PredictResponse {
  delay_probability: number;
  risk_category: RiskCategory;
  expected_delay_minutes: number | null;
  classifier_model: string;
  regressor_model: string | null;
  delay_threshold_minutes: number;
  prediction_note: string;
  shap_factors: ShapFactor[];
  historical_context: HistoricalContext | null;
  weather_source?: string;
  weather_days_out?: number;
  weather_used?: {
    precip_mm: number;
    wind_speed_kmh: number;
    temp_c: number;
    visibility_km: number;
  };
  weather_impact_summary?: string;
  weather_shap_factors?: ShapFactor[];
  features_used: string[];
}

// ── Analytics Types ──────────────────────────────────────────────────────
export interface OverviewKPIs {
  total_flights: number;
  delay_rate: number;
  avg_delay_minutes: number;
  airports_covered: number;
  airlines_covered: number;
  data_period_start: string;
  data_period_end: string;
}

export interface AirportAnalytics {
  iata: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  total_flights: number;
  delay_rate: number;
  avg_delay: number;
  congestion_index: number;
  peak_window: string;
  worst_hour: number;
}

export interface AirportDetail extends AirportAnalytics {
  hourly_traffic: { hour: number; flights: number; delay_rate: number }[];
  daily_heatmap: { day: number; hour: number; delay_rate: number }[];
  trend: { month: string; delay_rate: number; total_flights: number }[];
  congestion_by_hour: { hour: number; congestion: number; delays: number }[];
}

export interface WeatherAnalytics {
  precip_buckets: { label: string; delay_rate: number; count: number }[];
  visibility_buckets: { label: string; avg_delay: number; count: number }[];
  wind_buckets: { label: string; delay_rate: number; count: number }[];
  seasonal: { month: string; avg_precip: number; delay_rate: number }[];
}

export interface TrendPoint {
  period: string;
  delay_rate: number;
  total_flights: number;
  avg_delay: number;
}

export interface AirlinePerf {
  code: string;
  name: string;
  delay_rate: number;
  avg_delay: number;
  total_flights: number;
}

// ── ML Model Types ───────────────────────────────────────────────────────
export interface ModelMetrics {
  model_name: string;
  model_type: 'classifier' | 'regressor';
  training_period: string;
  test_period: string;
  features: string[];
  // Classifier metrics
  roc_auc?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  confusion_matrix?: number[][];
  roc_curve?: { fpr: number[]; tpr: number[] };
  // Regressor metrics
  mae?: number;
  rmse?: number;
  r2?: number;
  trained_at: string;
}

export interface FeatureImportance {
  feature: string;
  display_name: string;
  importance: number;
  shap_mean_abs: number;
}

// ── API Response Wrappers ────────────────────────────────────────────────
export type DataStatus = 'ok' | 'not_ready';

export interface ApiResponse<T> {
  status: DataStatus;
  data?: T;
  message?: string;
}
