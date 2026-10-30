'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from 'recharts';

const FEATURES_DISPLAY: Record<string, string> = {
  sched_dep_hour: 'Departure Hour',
  day_of_week: 'Day of Week',
  month: 'Month',
  is_weekend: 'Weekend',
  distance: 'Route Distance',
  hist_origin_delay_rate: 'Origin Delay Rate (historical)',
  hist_dest_delay_rate: 'Dest Delay Rate (historical)',
  hist_route_delay_rate: 'Route Delay Rate (historical)',
  hist_airline_delay_rate: 'Airline Delay Rate (historical)',
  hist_origin_avg_delay: 'Origin Avg Delay (historical)',
  hist_congestion_proxy: 'Airport Congestion Proxy',
  wx_precip: 'Precipitation',
  wx_wind_speed: 'Wind Speed',
  wx_temp: 'Temperature',
  wx_visibility: 'Visibility',
};

function ModelStatusCard({ trained }: { trained: boolean }) {
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 10,
        background: trained ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${trained ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
      }}
    >
      {trained ? (
        <CheckCircle size={16} color="#22c55e" />
      ) : (
        <AlertTriangle size={16} color="#f59e0b" />
      )}
      <div>
        {trained ? (
          <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>Models trained and available.</span>
        ) : (
          <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 13 }}>
            Models not trained yet.{' '}
            <code style={{ fontFamily: 'JetBrains Mono', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4 }}>
              python -m ml.training.train_all
            </code>
          </span>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {value}{unit}
      </span>
    </div>
  );
}

const PIPELINE_STEPS = [
  { label: 'BTS Flight CSVs', color: '#3d7eff', type: 'source' },
  { label: 'Open-Meteo Weather API', color: '#06b6d4', type: 'source' },
  { label: 'OurAirports Metadata', color: '#8b5cf6', type: 'source' },
  { label: 'Data Validation & Cleaning', color: '#4d6080', type: 'step' },
  { label: 'Timezone Normalization', color: '#4d6080', type: 'step' },
  { label: 'Leakage-Safe Feature Eng.', color: '#f59e0b', type: 'step' },
  { label: 'Chronological Split', color: '#4d6080', type: 'step' },
  { label: 'XGBoost Classifier', color: '#3d7eff', type: 'model' },
  { label: 'GBT Regressor', color: '#06b6d4', type: 'model' },
  { label: 'SHAP Explainability', color: '#f59e0b', type: 'output' },
  { label: 'FastAPI Backend', color: '#22c55e', type: 'output' },
];

export default function MLLabPage() {
  const [models, setModels] = useState<any[]>([]);
  const [classifierMetrics, setClassifierMetrics] = useState<any>(null);
  const [regressorMetrics, setRegressorMetrics] = useState<any>(null);
  const [importance, setImportance] = useState<any[]>([]);
  const [modelsReady, setModelsReady] = useState(false);

  useEffect(() => {
    api.models().then((r) => {
      if (r.status === 'ok' && r.models?.length) {
        setModelsReady(true);
        setModels(r.models);
        const clf = r.models.find((m: any) => m.model_type === 'classifier');
        const reg = r.models.find((m: any) => m.model_type === 'regressor');
        if (clf) {
          api.modelMetrics(clf.id).then((m) => setClassifierMetrics(m.metrics));
          api.modelImportance(clf.id).then((m) => setImportance(m.importance ?? []));
        }
        if (reg) {
          api.modelMetrics(reg.id).then((m) => setRegressorMetrics(m.metrics));
        }
      }
    }).catch(() => {});
  }, []);

  const importanceData = importance.length > 0
    ? importance.slice(0, 10).map((f: any) => ({ name: FEATURES_DISPLAY[f.feature] ?? f.feature, value: f.shap_mean_abs }))
    : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="text-label" style={{ marginBottom: 6 }}>ML Engineering</p>
        <h1 className="page-title">ML Lab</h1>
        <p className="page-subtitle">
          Model evaluation metrics, explainability, and data pipeline architecture.
        </p>
      </div>

      <ModelStatusCard trained={modelsReady} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Classifier metrics */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#3d7eff', boxShadow: '0 0 8px #3d7eff' }}
            />
            <div className="chart-title" style={{ marginBottom: 0 }}>DELAY CLASSIFICATION MODEL</div>
          </div>
          {classifierMetrics ? (
            <>
              <MetricRow label="Model" value={classifierMetrics.model_name} />
              <MetricRow label="Training Period" value={classifierMetrics.training_period} />
              <MetricRow label="Test Period" value={classifierMetrics.test_period} />
              <MetricRow label="ROC-AUC" value={classifierMetrics.roc_auc?.toFixed(4) ?? '—'} />
              <MetricRow label="F1 Score" value={classifierMetrics.f1_score?.toFixed(4) ?? '—'} />
              <MetricRow label="Precision" value={classifierMetrics.precision?.toFixed(4) ?? '—'} />
              <MetricRow label="Recall" value={classifierMetrics.recall?.toFixed(4) ?? '—'} />
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 10 }}>
                Target: delayed = 1 if DEP_DELAY ≥ 15 min (BTS standard)
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 12 }}>
                {modelsReady ? 'Loading metrics...' : 'Run training pipeline to see metrics.'}
              </p>
              {!modelsReady && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: 'var(--color-elevated)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    textAlign: 'left',
                    lineHeight: 1.6,
                  }}
                >
                  <div>Models compared: Logistic Regression, Random Forest, XGBoost, LightGBM</div>
                  <div>Split: Chronological (train → val → test, time-aware)</div>
                  <div>Class imbalance: scale_pos_weight</div>
                  <div>Metrics: ROC-AUC, F1, Precision, Recall</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Regressor metrics */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }}
            />
            <div className="chart-title" style={{ marginBottom: 0 }}>DELAY DURATION REGRESSOR</div>
          </div>
          {regressorMetrics ? (
            <>
              <MetricRow label="Model" value={regressorMetrics.model_name} />
              <MetricRow label="Training Period" value={regressorMetrics.training_period} />
              <MetricRow label="Test Period" value={regressorMetrics.test_period} />
              <MetricRow label="MAE" value={regressorMetrics.mae?.toFixed(2) ?? '—'} unit=" min" />
              <MetricRow label="RMSE" value={regressorMetrics.rmse?.toFixed(2) ?? '—'} unit=" min" />
              <MetricRow label="R²" value={regressorMetrics.r2?.toFixed(4) ?? '—'} />
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 10 }}>
                Target: DEP_DELAY in minutes · trained on delayed flights only
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 12 }}>
                {modelsReady ? 'Loading metrics...' : 'Run training pipeline to see metrics.'}
              </p>
              {!modelsReady && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: 'var(--color-elevated)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    textAlign: 'left',
                    lineHeight: 1.6,
                  }}
                >
                  <div>Models: Ridge baseline, Random Forest, Gradient Boosting</div>
                  <div>Target: DEP_DELAY (minutes) · clipped at 0</div>
                  <div>Metrics: MAE, RMSE, R²</div>
                  <div>Note: Delay distribution is right-skewed (log transform considered)</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Feature Importance */}
      <div className="chart-container" style={{ marginBottom: 20 }}>
        <div className="chart-title" style={{ marginBottom: 4 }}>Global Feature Importance (SHAP Mean |Values|)</div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Average absolute SHAP contribution across all test set predictions. Higher = more influential in predicting delay probability.
        </p>
        {importanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={importanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8a9bbf', fontSize: 11 }} axisLine={false} tickLine={false} width={220} />
              <Tooltip contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
              <Bar dataKey="value" name="SHAP Mean |Value|" fill="#3d7eff" radius={[0, 3, 3, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <p style={{ fontSize: 12 }}>
              Feature importance will be displayed here after model training with SHAP enabled.
            </p>
            <div
              style={{
                marginTop: 8,
                padding: '10px 14px',
                background: 'var(--color-elevated)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                textAlign: 'left',
              }}
            >
              Expected top features: hist_origin_delay_rate, hist_airline_delay_rate,
              sched_dep_hour, hist_congestion_proxy, wx_precip
            </div>
          </div>
        )}
      </div>

      {/* Data pipeline diagram */}
      <div className="card">
        <div className="chart-title" style={{ marginBottom: 20 }}>Data & ML Pipeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {PIPELINE_STEPS.map((step, i) => {
            const typeColors: Record<string, string> = {
              source: '#3d7eff', step: '#4d6080', model: '#06b6d4', output: '#22c55e',
            };
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div
                  style={{
                    width: 60,
                    height: 24,
                    background: `${typeColors[step.type]}18`,
                    border: `1px solid ${typeColors[step.type]}30`,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: typeColors[step.type],
                    flexShrink: 0,
                  }}
                >
                  {step.type.toUpperCase()}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: 'var(--color-elevated)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 12,
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {step.label}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginLeft: -8 }}>↓</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
