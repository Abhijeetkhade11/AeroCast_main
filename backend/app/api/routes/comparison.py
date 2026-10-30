from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.core.config import settings
import pandas as pd
import joblib
from data.features.engineering import PRE_FLIGHT_FEATURES

router = APIRouter()

@router.get("")
async def get_comparison_data(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Returns actual vs predicted delay for a sample of the dataset."""
    df_path = settings.data_processed_dir / "flights_features.parquet"
    regressor_path = settings.models_dir / "regressor_v1.pkl"
    
    if not df_path.exists() or not regressor_path.exists():
        return {"status": "not_ready"}
    
    # Load dataset and model
    df = pd.read_parquet(df_path)
    regressor = joblib.load(regressor_path)
    
    df["flight_date_str"] = pd.to_datetime(df["flight_date"]).dt.strftime('%Y-%m-%d')
    
    if start_date and end_date:
        df_filtered = df[(df["flight_date_str"] >= start_date) & (df["flight_date_str"] <= end_date)]
    else:
        df_filtered = df
    
    if df_filtered.empty:
        return {"status": "ok", "data": []}
    
    # We want a good mix of delayed and non-delayed flights for the dashboard
    df_delayed = df_filtered[df_filtered["dep_delay"] > 15].head(50)
    df_on_time = df_filtered[df_filtered["dep_delay"] <= 15].head(50)
    
    df_sample = pd.concat([df_delayed, df_on_time]).sample(frac=1, random_state=42).reset_index(drop=True)
    
    if df_sample.empty:
        df_sample = df_filtered.head(100)
    
    # Prepare features
    X = df_sample[PRE_FLIGHT_FEATURES]
    y_actual = df_sample["dep_delay"].clip(lower=0)
    
    # Predict
    y_pred = regressor.predict(X).clip(0)
    
    # Create response data
    results = []
    for i in range(len(y_actual)):
        results.append({
            "id": i,
            "flight_date": str(df_sample.iloc[i]["flight_date"].date()) if hasattr(df_sample.iloc[i]["flight_date"], 'date') else str(df_sample.iloc[i]["flight_date"])[:10],
            "airline": df_sample.iloc[i]["airline"] if "airline" in df_sample.columns else "UNK",
            "origin": df_sample.iloc[i]["origin"] if "origin" in df_sample.columns else "UNK",
            "dest": df_sample.iloc[i]["dest"] if "dest" in df_sample.columns else "UNK",
            "actual_delay": float(y_actual.iloc[i]),
            "predicted_delay": float(y_pred[i])
        })
        
    return {"status": "ok", "data": results}
