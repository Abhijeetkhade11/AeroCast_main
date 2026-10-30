# ✈️ AeroCast — ML-Powered Flight Delay Intelligence Platform

> **Predict delays. Understand the skies.**  
> An end-to-end Machine Learning aviation intelligence platform built with Python FastAPI, XGBoost, Scikit-Learn, SHAP, Next.js 14, TypeScript, and Three.js.

## 🌟 Executive Summary

**AeroCast** is a production-quality aviation analytics and flight disruption prediction platform. It processes historical US domestic flight records (Bureau of Transportation Statistics) and meteorological observations (Open-Meteo API) to estimate individual flight delay probabilities, predict delay durations in minutes, analyze airport congestion patterns, stream **real-time live flight delay radar predictions**, and explain why disruptions occur using **SHAP explainability**.

The application is structured into **two strictly separated experience portals**:
1. **✈️ Flight Delay Predictor Tool**: A clean, distraction-free pre-flight risk evaluation workspace for travelers and flight dispatchers.
2. **📊 Aviation Data & Intelligence Platform**: A 6-module research portal for aviation analysts, airport planners, and data scientists to explore historical trends, congestion heatmaps, weather correlations, and ML model performance.

---

## 🚀 Key Features

### 1. 📡 Real-Time Flight Delay Radar Stream (`NEW`)
- **Live Active Flight Radar**: Streams real-time scheduled departures departing today across major US hubs (`JFK`, `ORD`, `EWR`, `ATL`, `DFW`, `LAX`, `BOS`, `SEA`).
- **Real-Time ML Delay Scoring**: Evaluates active live departures through trained ML models to flag expected late flights (`HIGH DELAY RISK 78%`, `EXPECTED DELAY +42 MINS`).
- **Live Disruption Cause Badging**: Identifies primary delay drivers in real time (e.g. *JFK Departure Congestion & High Wind 28 kts* or *ORD Runway Density & Weather Front*).
- **Interactive Live Filters & Auto-Refresh**: Filter stream by `All Live Flights`, `Expected Late Only`, or `High Delay Risk`. Refreshes automatically every 30 seconds.

### 2. ✈️ Flight Delay Predictor Studio (`/dashboard/predictor`)
- **Binary Delay Classifier**: Predicts probability of flight departure delay $\ge 15$ minutes (BTS standard definition).
- **Expected Duration Regressor**: Estimates expected delay duration in minutes with uncertainty bounds.
- **SHAP Factor Explanation**: Displays positive and negative risk contributors for every individual prediction.
- **Strict Target Leakage Prevention**: Operates exclusively on pre-flight features ($D-90 \rightarrow D-1$ rolling historical statistics, flight schedule, and forecast weather). Zero post-event fields are used.
- **Searchable Glassmorphic Combobox**: Custom airport & airline combobox with real-time instant text search across IATA codes (`JFK`, `LAX`, `ORD`, `SFO`) and city names.

### 3. 📊 Aviation Intelligence & Data Platform (`/dashboard`)
- **Overview & KPIs (`/dashboard`)**: Total flights analyzed, historical delay rates, average delay duration, 24-hr hourly departure vulnerability heatmaps, and monthly delay trends.
- **Airport Intelligence (`/dashboard/airports`)**: Departure congestion density, peak traffic hours, worst delay windows, and top 20 US airport comparisons.
- **Weather Impact Analysis (`/dashboard/weather`)**: Precipitation, wind speed, visibility, and temperature impact correlations on flight punctuality.
- **Exploratory Carrier Analytics (`/dashboard/analytics`)**: Carrier delay rankings, route delay matrices, distance vs. delay scatter plots, and day-of-week trends.
- **ML Engineering Lab (`/dashboard/mllab`)**: ROC-AUC evaluation curves, Precision-Recall curves, confusion matrices, model comparisons, and global SHAP feature importances.
- **Data Sources & Limits (`/dashboard/datasources`)**: Data lineage, feature dictionary, target leakage controls, and dataset boundaries.

---

## 🎨 UI Aesthetics & Design Architecture

- **Daylight High-Sky Palette**: Clean sky blue gradients (`#e0eeff` → `#f0f7ff` → `#ffffff`), electric aviation blue accents (`#2563eb`), and bold slate navy typography (`#0f172a`).
- **Photorealistic 3D Scroll Parallax**: Full-screen 3D Boeing 787 Dreamliner airliner soaring in a multi-layered sky. Pitch, roll, climb, and scale respond dynamically to scroll depth.
- **Glassmorphism Design System**: Translucent frosted panels (`backdrop-filter: blur(16px)`), subtle borders, and smooth micro-animations.

---

## 🏗️ System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │          Next.js 14 Frontend            │
                  │   TypeScript · Tailwind CSS · Three.js  │
                  └────────────────────┬────────────────────┘
                                       │ REST API / Embedded JSON Fallbacks
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │           FastAPI Backend               │
                  │       (Python 3.11 / Uvicorn)           │
                  └────┬───────────────────────────────┬────┘
                       │                               │
                       ▼                               ▼
       ┌───────────────────────────────┐   ┌──────────────────────────────┐
       │     Pre-Trained ML Models     │   │      Data Pipelines          │
       │ • Classifier (RandomForest)   │   │ • BTS Flight Dataset         │
       │ • Regressor (Ridge Baseline)  │   │ • Open-Meteo Weather API     │
       │ • SHAP Explainer Engine       │   │ • PyArrow / Parquet Pipeline │
       └───────────────────────────────┘   └──────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend Engine
- **Framework**: Python 3.11, FastAPI, Uvicorn
- **Machine Learning**: Scikit-Learn, XGBoost, SHAP (SHapley Additive exPlanations), Joblib
- **Data Processing**: Pandas, PyArrow (Parquet engine), NumPy
- **API & Logging**: Pydantic v2, Loguru, HTTPX

### Frontend User Interface
- **Framework**: Next.js 14 (App Router), React 19, TypeScript
- **Styling & Aesthetics**: Daylight High-Sky Palette, Glassmorphic UI, Tailwind CSS
- **3D Aviation Scene**: Three.js, React Three Fiber, Framer Motion
- **Data Visualization**: Recharts, Lucide Icons

---

## 🤖 Machine Learning Methodology

### 1. Leakage-Free Feature Engineering
To ensure realistic pre-flight deployment, feature engineering uses **chronological rolling windows** ($D-90 \rightarrow D-1$):
- `hist_origin_delay_rate`: Origin airport's historical delay rate over preceding 90 days.
- `hist_dest_delay_rate`: Destination airport's historical delay rate.
- `hist_airline_delay_rate`: Operating carrier's historical on-time performance.
- `hist_congestion_proxy`: Departure count in the same 1-hour window at origin airport.
- `sched_dep_hour`, `day_of_week`, `month`, `is_weekend`, `distance`.
- Forecast meteorological features: `wx_precip`, `wx_wind_speed`, `wx_temp`, `wx_visibility`.

### 2. Model Training & Evaluation
- **Split Strategy**: Chronological Train (75%) / Validation (10%) / Test (15%) splits to preserve temporal causality.
- **Classifier**: Selected via ROC-AUC optimization across Logistic Regression, Random Forest, and Gradient Boosting.
- **Regressor**: Evaluated on Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).

---

## 💻 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10` or higher
- **npm** or **yarn**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run data pipeline (generates 25,000 realistic records & engineered features)
python scripts/generate_sample_data.py
python scripts/run_pipeline.py

# Train classification & regression ML models
python -m ml.training.train_all

# Start FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will run at **`http://127.0.0.1:8000`**.  
Interactive Swagger API documentation is available at **`http://127.0.0.1:8000/api/docs`**.

---

### 2. Frontend Setup

```bash
# Open a new terminal tab and navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Next.js development server
npm run dev
```

The frontend application will run at **`http://localhost:3000`**.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System status check for API & pipeline |
| `POST` | `/api/predict` | Predict flight delay probability, duration & SHAP factors |
| `GET` | `/api/analytics/overview` | Summary KPI metrics across dataset |
| `GET` | `/api/analytics/live_radar` | Real-time live flight departures & ML delay risk evaluation |
| `GET` | `/api/analytics/airport/{iata}` | Congestion density & hourly traffic for specific airport |
| `GET` | `/api/analytics/weather` | Weather correlation statistics |
| `GET` | `/api/analytics/airlines` | Carrier delay rankings and metrics |
| `GET` | `/api/models` | List trained ML models & metrics |
| `GET` | `/api/models/{id}/metrics` | Return confusion matrix & ROC curve points |
| `GET` | `/api/models/{id}/importance` | Return global SHAP feature importances |

---

## 🐳 Docker Deployment

To launch the full-stack application in production mode using Docker Compose:

```bash
# Build and run containers in detached mode
docker-compose up --build -d
```

- **Frontend**: Accessible at `http://localhost:3000`
- **Backend API**: Accessible at `http://localhost:8000`

---

## 📜 License & Disclaimers

Built on data from the **Bureau of Transportation Statistics (BTS)** and **Open-Meteo API**.  
*Disclaimers*: This project is designed for portfolio, research, and historical analytical purposes. Not intended for real-time operational flight dispatching.
