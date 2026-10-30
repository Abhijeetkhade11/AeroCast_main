# AeroCast Technical Report

**Report date:** 28 October 2026  
**Scope:** Source-code review, model execution, API validation, and frontend build validation  

## 1. Executive summary

AeroCast is an end-to-end aviation delay analytics and prediction system. It combines a FastAPI backend, scikit-learn/gradient boosting models, SHAP-based explanations, weather data, a Next.js dashboard, Docker configuration, and static fallback data. The system predicts whether departure delay will reach or exceed 15 minutes and estimates delay duration in minutes.

The system was prepared and executed successfully on Windows using Python 3.11. The processed dataset contained 34,532 records. Model training produced validation and test metrics. The Random Forest classifier had the best validation ROC-AUC, while Ridge regression had the lowest validation MAE for delay-duration estimation. The backend, prediction API, frontend, and production frontend build were verified.

## 2. Verified system status

| Component | Verification result |
|---|---|
| Python environment | Python 3.11 virtual environment created successfully |
| Backend dependencies | Installed successfully; `pip check` found no broken requirements |
| Data generation | 25,000 synthetic flight records generated |
| Data processing | 34,532 feature records produced |
| Model training | Classifier and regressor trained successfully |
| Backend health endpoint | HTTP 200 |
| Prediction endpoint | HTTP 200 for a representative request |
| Frontend development server | HTTP 200 |
| Frontend production build | Completed successfully; all dashboard routes generated |
| Docker configuration | Present; not used as the primary local validation method |

## 3. System architecture

```text
Next.js/React dashboard
        |
        | HTTP/JSON
        v
FastAPI REST API
        |
        +-- Metadata routes
        +-- Prediction route
        +-- Analytics routes
        +-- Model metrics/importance routes
        |
        v
Feature assembly -> Random Forest classifier -> Ridge regressor -> explanations
        |
        +-- Historical rolling statistics
        +-- Open-Meteo weather forecast
        +-- Seasonal weather fallback
        +-- Serialized scikit-learn models
```

### Backend

- Framework: FastAPI and Uvicorn
- ML: scikit-learn, XGBoost, LightGBM, SHAP, Joblib
- Data processing: Pandas, NumPy, PyArrow
- Configuration: Pydantic Settings

### Frontend

- Framework: Next.js 16 and React 19
- Language: TypeScript
- Visualization: Recharts
- 3D visualization: React Three Fiber and Three.js
- UI libraries: Lucide, Radix, Framer Motion

## 4. Data and feature engineering

The project includes a synthetic flight-data generator designed to resemble the BTS on-time schema. The generator uses 20 airports, eight carrier codes, dates spanning 1 January 2023 to 31 December 2024, and randomized delay outcomes. The processed pipeline expands or enriches records to 34,532 feature rows.

AeroCast uses 15 pre-flight features:

1. Scheduled departure hour
2. Day of week
3. Month
4. Weekend indicator
5. Route distance
6. Origin historical delay rate
7. Destination historical delay rate
8. Route historical delay rate
9. Airline historical delay rate
10. Origin historical average delay
11. Origin congestion proxy
12. Precipitation
13. Wind speed
14. Temperature
15. Visibility

The historical statistics use a 90-day rolling lookback. The intended leakage control is that features are derived from records preceding the prediction date rather than the flight's own post-event outcome.

The binary target is `DEP_DELAY >= 15 minutes`. The duration target is `DEP_DELAY`, clipped at zero minutes.

## 5. Data split

The chronological split uses fixed fractions of row-sorted records rather than cross-validation folds:

| Split | Row count | Proportion |
|---|---:|---:|
| Training | 25,899 | approximately 75% |
| Validation | 3,453 | approximately 10% |
| Test | 5,180 | approximately 15% |
| Total | 34,532 | 100% |

The training set has 25.2% delayed observations. The validation and test sets have 22.5% delayed observations. The validation period is used for selecting between candidate models. The test period is used only for the final reported evaluation.

## 6. Classification models and hyperparameters

### Classification candidates

| Model | Hyperparameters used |
|---|---|
| Logistic Regression | balanced class weights; maximum 500 iterations; random seed 42 |
| Random Forest | 200 trees; maximum depth 10; minimum leaf size 20; balanced class weights; seed 42; parallel execution |
| HistGradientBoosting | 200 iterations; maximum depth 8; learning rate 0.05; balanced class weights; seed 42 |
| XGBoost | 300 estimators; maximum depth 6; learning rate 0.05; subsample 0.8; column subsample 0.8; AUC evaluation metric; negative/positive class balancing; seed 42 |
| LightGBM | 300 estimators; maximum depth 6; learning rate 0.05; subsample 0.8; column subsample 0.8; negative/positive class balancing; seed 42; verbose mode disabled |

For XGBoost and LightGBM, `scale_pos_weight`/the equivalent negative-to-positive training ratio is approximately 2.96.

### Validation performance

| Model | ROC-AUC | F1 | Precision | Recall |
|---|---:|---:|---:|---:|
| Logistic Regression | 0.6452 | 0.3710 | 0.3220 | 0.4376 |
| **Random Forest** | **0.6610** | **0.3883** | **0.3550** | **0.4286** |
| HistGradientBoosting | 0.6501 | 0.4021 | 0.3421 | 0.4878 |
| XGBoost | 0.6481 | 0.3763 | 0.3491 | 0.4080 |
| LightGBM | 0.6476 | 0.3762 | 0.3360 | 0.4273 |

Random Forest performed best under the implemented selection criterion: highest validation ROC-AUC. HistGradientBoosting produced the highest validation F1 and recall, but model selection did not use F1 as the primary criterion.

### Final held-out test performance

The selected Random Forest classifier achieved:

| Metric | Result |
|---|---:|
| ROC-AUC | 0.6439 |
| F1 | 0.3835 |
| Precision | 0.3423 |
| Recall | 0.4359 |
| Confusion matrix | `[[3043, 974], [656, 507]]` |
| Test records | 5,180 |

The confusion matrix is arranged as:

```text
                 Predicted on time  Predicted delayed
Actual on time          3043             974
Actual delayed           656             507
```

Accuracy can be calculated as `(3043 + 507) / 5180 = 68.50%`; the project does not currently persist an explicit accuracy field. The metric should be presented with its confusion-matrix components rather than described as the primary optimization score.

## 7. Regression models and hyperparameters

### Regression candidates

| Model | Hyperparameters used |
|---|---|
| Ridge | alpha 10.0 |
| Random Forest Regressor | 200 trees; maximum depth 10; minimum leaf size 20; seed 42; parallel execution |
| HistGradientBoosting Regressor | 200 iterations; maximum depth 8; learning rate 0.05; seed 42 |
| XGBoost Regressor | 300 estimators; maximum depth 6; learning rate 0.05; subsample 0.8; column subsample 0.8; seed 42 |

### Validation performance

| Model | MAE | RMSE | R² |
|---|---:|---:|---:|
| **Ridge** | **20.21 minutes** | **48.85 minutes** | **0.0057** |
| Random Forest | 20.68 minutes | 48.92 minutes | 0.0029 |
| HistGradientBoosting | 21.22 minutes | 49.07 minutes | -0.0032 |
| XGBoost | 21.46 minutes | 51.17 minutes | -0.0908 |

Ridge was selected as it had the lowest validation MAE.

### Held-out test performance

| Metric | Result |
|---|---:|
| MAE | 20.69 minutes |
| RMSE | 52.10 minutes |
| R² | 0.0082 |
| Test records | 5,180 |

The near-zero R² indicates that the duration estimator explains little variance in the target and should not be described as production-ready without further work.

## 8. Interpretation of model performance

AeroCast's classifier is materially better than chance at ranking delayed flights, as its validation and test ROC-AUC values are above 0.5. However, test precision, recall, and F1 are moderate. The class imbalance and use of a default probability threshold of 0.5 require operational calibration before use in a safety-sensitive or resource-allocation setting.

Random Forest's advantage over the other classifier configurations is modest. In particular, validation ROC-AUC ranges only from 0.6452 to 0.6610 across all five implemented candidates. HistGradientBoosting's superior F1 suggests that a threshold other than 0.5 could produce different ranking/decision trade-offs.

The regressor's strong MAE relative to RMSE contrast is important: the large RMSE indicates substantial errors for a subset of flights. R² near zero shows that feature relationships are weak for explaining delay duration in the generated dataset.

## 9. Explainability and feature importance

The Random Forest importance artifact assigns the following mean importance values:

| Rank | Feature | Importance |
|---:|---|---:|
| 1 | Scheduled departure hour | 0.220605 |
| 2 | Airline historical delay rate | 0.100492 |
| 3 | Origin historical delay rate | 0.093045 |
| 4 | Origin historical average delay | 0.088833 |
| 5 | Route distance | 0.078683 |
| 6 | Congestion proxy | 0.078430 |
| 7 | Destination historical delay rate | 0.074293 |
| 8 | Temperature | 0.067411 |
| 9 | Wind speed | 0.057567 |
| 10 | Route historical delay rate | 0.043514 |

The remaining feature values must be taken directly from `classifier_v1_importance.json` and should not be inferred or rounded beyond the stored JSON precision.

The importance implementation stores native tree feature-importances for Random Forest rather than calculating SHAP values through `shap.Explainer`. The artifact field is named `shap_mean_abs`, but the code currently supplies `model.feature_importances_`. For publication and for technical claims, this should be described as model-native feature importance unless a true SHAP calculation is added.

The live prediction response also calculates individual feature contributions for the selected model. Individual prediction explanations should be verified against the installed SHAP implementation and model type.

## 10. Weather and deployment behavior

For flight dates within 0–15 days, AeroCast requests Open-Meteo forecast data for precipitation, maximum wind speed, mean temperature, and hourly visibility. Visibility is converted from metres to kilometres.

If the forecast is unavailable, the system falls back to monthly historical weather averages stored in `historical_stats.json`. If a weather request fails because of connectivity, timeout, or invalid data, the endpoint logs a warning and uses the fallback.

The frontend API client primarily uses `NEXT_PUBLIC_API_URL`, defaulting to `http://127.0.0.1:8000`, and includes static fallback values for analytics where backend access fails. Prediction fallback values are derived in the frontend and should therefore be clearly labeled as demonstration fallback values; they are not model predictions.

## 11. API verification

A representative prediction request was executed with:

```json
{
  "origin": "JFK",
  "destination": "LAX",
  "airline": "AA",
  "flight_date": "2026-11-02",
  "scheduled_departure_hour": 18,
  "scheduled_departure_minute": 30
}
```

The API returned HTTP 200, a delay probability of 0.561, a moderate-risk label, and an expected delay duration of 14.1 minutes from the live implementation. These are demonstration response values and are not averaged or presented as final model-quality metrics.

## 12. Technical limitations and required corrections

1. **Training data status:** `generate_sample_data.py` creates a synthetic dataset. It should not be described as real BTS records in empirical claims.
2. **Daily expanded data:** The pipeline output is larger than 25,000 source records; its exact expansion procedure must be documented.
3. **Duration training design:** Regression currently uses all rows with non-negative clipped delay values, despite comments suggesting delayed-flight-only training. If two-stage duration prediction is intended, filter training/evaluation to delayed records after classification or document that regressors predict clipped delay for all flights.
4. **Importance terminology:** Native feature importance is currently being stored under a SHAP-like artifact field. A true SHAP implementation should be added or labels should be renamed accurately.
5. **No hyperparameter search:** Hyperparameters are manually configured. No grid-search or Bayesian optimization evidence is persisted.
6. **No explicit cross-validation:** The project uses one chronological validation split, not time-series cross-validation.
7. **Accuracy is not persisted:** Accuracy should be derived from the confusion matrix and stored explicitly in future runs for reproducibility.
8. **Calibration and threshold sensitivity are not persisted:** The project reports metrics at threshold 0.5 but does not yet provide precision-recall/threshold curves or calibration metrics in the JSON artifacts.
9. **Logistic convergence warning:** The latest training run emitted a maximum-iteration convergence warning. Feature scaling or a larger iteration limit is needed before presenting Logistic Regression as fully converged.
10. **Windows CPU warning:** Joblib emitted a Windows CPU-core detection warning; this affected parallel-worker detection but not model execution.

## 13. Advanced ML improvement roadmap

1. Add expanding-window or blocked time-series cross-validation.
2. Add feature scaling and increase Logistic Regression iterations.
3. Tune thresholds using validation precision/recall and F1 rather than the fixed default.
4. Add calibration analysis using Brier score and reliability curves.
5. Add confidence intervals using repeated seeds or bootstrap sampling.
6. Add weather, rolling-statistics, airport, route, airline, and schedule ablations.
7. Train the duration model only on sufficiently delayed flights if that is the intended study design.
8. Compare against a persistence and seasonal baseline.
9. Replace native importance where possible with a true SHAP TreeExplainer or exact `shap_values` calculation on a reproducible test sample.
10. Add leakage checks ensuring rolling features do not include target-day records.
11. Audit upstream source data and replace synthetic samples with real BTS records before publication.

## 14. Reproduction commands

From the AeroCast project root in Windows PowerShell:

```powershell
cd "C:\Users\Sanika\Downloads\AEROCAST-main-main (1)\AEROCAST-main-main"

# One-time setup
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1

# Train the models
cd backend
.\.venv\Scripts\python.exe -m ml.training.train_all

# Start the backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Start the frontend in a second terminal
cd ..\frontend
npm run dev
```

# AeroCast Advanced ML Viva Q&A

## Q1. What models were used in AeroCast?

AeroCast tested Logistic Regression, Random Forest, HistGradientBoosting, XGBoost, and LightGBM for classification. It tested Ridge, Random Forest Regressor, HistGradientBoosting Regressor, and XGBoost Regressor for duration prediction.

## Q2. Which classification model performed better?

Random Forest performed best on validation ROC-AUC, at 0.6610. HistGradientBoosting had the best validation F1, at 0.4021, but the project uses ROC-AUC to select the deployed classifier.

## Q3. Which regressor performed better?

Ridge performed best by validation MAE, at 20.21 minutes, and was selected. Its test MAE was 20.69 minutes.

## Q4. What hyperparameters were configured?

Random Forest used 200 trees, maximum depth 10, minimum leaf size 20, balanced class weights, and seed 42. Ridge used alpha 10.0. HistGradientBoosting used 200 iterations, maximum depth 8, and learning rate 0.05. XGBoost and LightGBM used 300 estimators, maximum depth 6, learning rate 0.05, and 80% subsampling settings where configured.

## Q5. Was hyperparameter tuning performed?

No. The hyperparameters are manually defined fixed values, not the result of a GridSearchCV or RandomizedSearchCV run saved in the project.

## Q6. How was data split?

Rows were sorted by flight date and split into 75% training, 10% validation, and 15% test without random shuffling. The resulting row counts were 25,899, 3,453, and 5,180, respectively.

## Q7. Why is a chronological split important?

A chronological split prevents training on observations from after the prediction period. Random splitting can place temporally adjacent records in both training and test sets and may overestimate deployment performance.

## Q8. What validation metric did model selection use?

The classifier was selected by highest validation ROC-AUC. The regressor was selected by lowest validation MAE.

## Q9. Were validation metrics persisted?

The terminal output records the validation metrics, but the final JSON only persists the selected model's test metrics. A robust version should save the complete validation comparison table in a reproducible model card.

## Q10. What was the test ROC-AUC?

The selected Random Forest classifier achieved 0.6439 ROC-AUC on the held-out test set.

## Q11. What were the precision, recall, and F1 values?

Precision was 0.3423, recall was 0.4359, and F1 was 0.3835.

## Q12. What was the confusion matrix?

```text
[[3043, 974],
 [656, 507]]
```

This means 3,043 true negatives, 507 true positives, 974 false positives, and 656 false negatives. Derived accuracy is 68.50%.

## Q13. Why should raw accuracy not be emphasized?

The dataset is imbalanced: approximately 22.5% of test records are delayed. Accuracy alone can conceal poor detection of the minority class. Precision, recall, F1, ROC-AUC, PR-AUC, and calibration are more informative for the operational task, although PR-AUC and calibration are not yet persisted.

## Q14. What threshold was used?

Both classification training and held-out evaluation use a 0.5 probability threshold to convert predicted probability into a binary label.

## Q15. Why might another threshold be better?

A threshold of 0.5 minimizes neither false negatives nor false positives by design. If missed delays are costly, recall should be increased with a lower threshold; if unnecessary alerts are costly, precision should be increased with a higher threshold. A validation-based threshold should be selected according to the operating objective.

## Q16. Was class imbalance handled?

Yes, in several models through balanced class weights or a calculated negative-to-positive ratio. However, the system does not persist PR-AUC, class-specific recall curves, or cost-sensitive threshold optimization.

## Q17. What is the difference between ROC-AUC and PR-AUC?

ROC-AUC measures ranking performance across false-positive and true-positive rates. PR-AUC emphasizes precision and recall and can be more informative for an imbalanced positive class. AeroCast persists ROC-AUC but does not persist PR-AUC in the current metrics JSON.

## Q18. Was leakage prevention implemented?

The code uses pre-flight schedule, distance, weather, and rolling historical features. It excludes the target from the feature matrix and sorts chronologically for model evaluation. Leakage still requires verification because rolling features and pipeline order should not use target-day observations.

## Q19. What exactly is represented by the 90-day rolling features?

The source defines a 90-day lookback and calculates historical origin delay rate, destination delay rate, route delay rate, airline delay rate, origin average delay, and congestion proxies. Publication-grade implementation should verify that records on or after the prediction date are excluded from each observation's historical window.

## Q20. What are the duration model results?

Validation MAE for Ridge was 20.21 minutes and RMSE was 48.85 minutes. Held-out MAE was 20.69 minutes, RMSE was 52.10 minutes, and R² was 0.0082.

## Q21. Is the duration model trained only on delayed flights?

No. `prepare_ml_dataset` currently clips `dep_delay` at zero and uses it for all rows. The comments and project documentation imply delayed-flight-only behavior, but the implementation does not filter to delayed rows. This must be corrected or documented accurately before publication.

## Q22. How were individual predictions explained?

Individual responses contain feature-level direction and contribution fields. The saved global importance file is generated using native Random Forest `feature_importances_`. Individual SHAP initialization is attempted for supported models, but the persisted global artifact should currently be called model-native importance unless a true SHAP calculation is verified.

## Q23. Which features were globally most important?

The stored native importance ranking has scheduled departure hour first, followed by airline delay rate, origin delay rate, origin average delay, distance, congestion proxy, destination delay rate, temperature, wind speed, and route delay rate.

## Q24. Is SHAP used correctly for the global ranking?

Not exactly. The JSON field is named `shap_mean_abs`, but the Random Forest branch stores `model.feature_importances_`. The implementation should add real mean absolute SHAP values or rename the field and UI labels.

## Q25. What external data sources are used?

The source uses Open-Meteo for forecast weather. Historical flight data is synthetic if generated through the included sample-data script. The application should not claim real BTS data without obtaining and processing actual BTS records.

## Q26. What happens when weather data is unavailable?

AeroCast uses monthly seasonal weather averages as fallback. Missing dates outside the 0–15 forecast range also use seasonal averages. This preserves prediction availability, but limits forecast accuracy for longer horizons.

## Q27. What is the role of the frontend fallback?

The frontend contains static sample data and demonstration prediction logic when backend requests fail. This supports UI availability but should be identified as fallback, not as real model inference.

## Q28. How can the model be improved?

High-value improvements include temporal cross-validation, feature scaling, threshold optimization, probability calibration, SHAP-native importance, delayed-only duration training, leakage audit, real BTS data, richer propagation features, hyperparameter optimization, and confidence intervals.

## Q29. How should ablation studies be designed?

Compare the full system against: no weather, no rolling history, no congestion feature, no airline history, random split, and chronological split. Report metrics and uncertainty on held-out periods. Do not compare results from different datasets or thresholds.

## Q30. What are the strongest interview answers regarding this system?

A strong answer is: AeroCast uses a leakage-conscious chronological design, compares tree and linear models, selects models on a validation period, evaluates them on a later test period, exposes model and feature metadata through FastAPI, and provides a frontend dashboard. A technically honest answer also acknowledges the synthetic data, moderate performance, weak duration regression, manual hyperparameters, and unresolved two-stage regression alignment.
