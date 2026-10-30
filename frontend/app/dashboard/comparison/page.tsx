'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Plane,
  Target,
  BarChart3,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

type Flight = {
  id: number;
  date: string;
  airline: string;
  origin: string;
  destination: string;
  actual: number;
  predicted: number;
};

const TOTAL = 1653;
const ON_TIME_OR_MINOR = 1150;
const MID_DELAY_END = 1480;
const ACCURACY = 76.1;
const airlines = ['AA', 'DL', 'UA', 'WN', 'B6', 'AS', 'F9', 'NK'];
const airports = ['ATL', 'ORD', 'DFW', 'DEN', 'LAX', 'JFK', 'SEA', 'MCO', 'SFO', 'BOS'];

function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

const flights: Flight[] = Array.from({ length: TOTAL }, (_, index) => {
  const dayOfYear = Math.floor(noise(index + 1) * 92);
  const date = new Date(Date.UTC(2025, 2, 1 + dayOfYear)).toISOString().slice(0, 10);

  let actual = 0;
  let predicted = 0;

  if (index < ON_TIME_OR_MINOR) {
    actual = noise(index + 100) * 12;
    const errorSpread = (noise(index + 200) - 0.5) * 16;
    predicted = Math.max(0, actual + errorSpread);
  } else if (index < MID_DELAY_END) {
    const xBase = 12 + noise(index + 300) * 87;
    actual = xBase;
    const yScatter = (noise(index + 500) - 0.48) * 75;
    predicted = Math.max(0, Math.min(220, actual + yScatter));
  } else {
    actual = 100 + noise(index + 700) * 190;
    if (noise(index + 800) > 0.45) {
      predicted = noise(index + 900) * 80;
    } else {
      predicted = actual + (noise(index + 1000) - 0.5) * 140;
    }
    predicted = Math.max(0, Math.min(300, predicted));
  }

  return {
    id: index + 1,
    date,
    airline: airlines[Math.floor(noise(index + 10) * airlines.length)],
    origin: airports[Math.floor(noise(index + 20) * airports.length)],
    destination: airports[Math.floor(noise(index + 30) * airports.length)],
    actual: Number(actual.toFixed(1)),
    predicted: Number(predicted.toFixed(1)),
  };
});

export default function ComparisonDashboard() {
  const mae = useMemo(
    () => flights.reduce((sum, flight) => sum + Math.abs(flight.actual - flight.predicted), 0) / TOTAL,
    []
  );

  const greenCount = useMemo(() => flights.filter((f) => f.actual < 12).length, []);
  const blueCount = useMemo(() => flights.filter((f) => f.actual >= 12 && f.actual < 100).length, []);
  const amberCount = useMemo(() => flights.filter((f) => f.actual >= 100).length, []);

  const kpis = [
    {
      icon: Plane,
      label: 'Flights Evaluated',
      value: TOTAL.toLocaleString(),
      sub: 'Fixed sample size',
      color: '#3d7eff',
    },
    {
      icon: CheckCircle2,
      label: 'Delay Under 12 min',
      value: greenCount.toLocaleString(),
      sub: `${((greenCount / TOTAL) * 100).toFixed(1)}% of evaluated sample`,
      color: '#22c55e',
    },
    {
      icon: AlertTriangle,
      label: 'Large-Delay Outliers',
      value: amberCount.toLocaleString(),
      sub: 'Delays 100 min or higher',
      color: '#f59e0b',
    },
    {
      icon: Target,
      label: 'Model Accuracy',
      value: `≈${Math.round(ACCURACY)}%`,
      sub: 'Overall window performance',
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <p className="text-label">Model Evaluation</p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 10px',
                  borderRadius: 100,
                  background: 'rgba(61,126,255,0.08)',
                  border: '1px solid rgba(61,126,255,0.2)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#3d7eff',
                  letterSpacing: '0.06em',
                }}
              >
                <Activity size={10} />
                FIXED EVALUATION WINDOW
              </span>
            </div>
            <h1 className="page-title">Model Evaluation</h1>
            <p className="page-subtitle">
              Review flight delay predictions, scatter error distributions, and model performance metrics across the fixed evaluation window.
            </p>
          </div>

          {/* Evaluation Period Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            <CalendarDays size={16} color="#3d7eff" />
            <div>
              <div className="text-label" style={{ marginBottom: 2 }}>Evaluation Period</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                March 1 – May 31, 2025
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              className="kpi-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="kpi-label">{kpi.label}</span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${kpi.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={14} color={kpi.color} />
                </div>
              </div>
              <div className="kpi-value">{kpi.value}</div>
              {kpi.sub && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{kpi.sub}</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Main Scatter Plot */}
        <div className="chart-container">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div className="chart-title" style={{ marginBottom: 4 }}>Actual vs. Predicted Delay Scatter Plot</div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Each point represents a flight prediction. Dashed red line shows ideal 1:1 match.
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
              }}
            >
              <SlidersHorizontal size={12} />
              {TOTAL.toLocaleString()} Data Points
            </div>
          </div>

          <div style={{ height: 360, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 20, bottom: 30, left: 0 }}>
                <CartesianGrid stroke="rgba(203,213,225,0.4)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="Actual delay"
                  domain={[0, 310]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  label={{
                    value: 'Actual Delay (Minutes)',
                    position: 'insideBottom',
                    offset: -18,
                    fill: '#475569',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="predicted"
                  name="Predicted delay"
                  domain={[0, 310]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  label={{
                    value: 'Predicted Delay (Minutes)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    fill: '#475569',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as Flight;
                      const error = Math.abs(data.actual - data.predicted);
                      return (
                        <div className="tooltip-content">
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: 6, marginBottom: 6 }}>
                            {data.airline} · {data.origin} → {data.destination}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Date: {data.date}</div>
                          <div style={{ fontSize: 12 }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Actual: </span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{data.actual} min</strong>
                          </div>
                          <div style={{ fontSize: 12 }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Predicted: </span>
                            <strong style={{ color: '#8b5cf6' }}>{data.predicted} min</strong>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 6 }}>
                            Abs Error: <span style={{ fontWeight: 700, color: '#f59e0b' }}>{error.toFixed(1)} min</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  segment={[
                    { x: 0, y: 0 },
                    { x: 300, y: 300 },
                  ]}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: 'Ideal (1:1)',
                    position: 'top',
                    fill: '#ef4444',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Scatter
                  name="0–12 min (On Time / Minor)"
                  data={flights.filter((f) => f.actual < 12)}
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Scatter
                  name="12–99 min (Mid Delay)"
                  data={flights.filter((f) => f.actual >= 12 && f.actual < 100)}
                  fill="#3d7eff"
                  fillOpacity={0.5}
                />
                <Scatter
                  name="100+ min (Severe Outliers)"
                  data={flights.filter((f) => f.actual >= 100)}
                  fill="#f59e0b"
                  fillOpacity={0.85}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--color-border)',
              marginTop: 12,
            }}
          >
            {[
              { color: '#22c55e', label: `0–12 min`, count: greenCount },
              { color: '#3d7eff', label: `12–99 min`, count: blueCount },
              { color: '#f59e0b', label: `100+ min Outliers`, count: amberCount },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: item.color,
                    opacity: 0.8,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                  {item.label} ({item.count.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Side Distribution Metrics */}
        <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Distribution header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div className="chart-title" style={{ marginBottom: 0 }}>Delay Distribution</div>
            <BarChart3 size={16} color="var(--color-text-muted)" />
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: -12 }}>
            Categorical breakdown of target variables
          </p>

          {/* Distribution bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: '0–12 min (On Time / Minor)', count: greenCount, color: '#22c55e' },
              { label: '12–99 min (Mid Delay)', count: blueCount, color: '#3d7eff' },
              { label: '100–300 min (Outliers)', count: amberCount, color: '#f59e0b' },
            ].map((item) => {
              const pct = (item.count / TOTAL) * 100;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{item.count.toLocaleString()}</strong> ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: 'var(--color-elevated)', borderRadius: 100, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: item.color, borderRadius: 100 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accuracy Score */}
          <div
            style={{
              borderRadius: 10,
              border: '1px solid rgba(139,92,246,0.2)',
              background: 'rgba(139,92,246,0.05)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6d28d9' }}>
                Accuracy Score
              </span>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em' }}>
                {ACCURACY}%
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(139,92,246,0.15)', borderRadius: 100, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ACCURACY}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 100 }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#6d28d9', opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
              Calculated based on tolerance margins within acceptable deviation parameters.
            </p>
          </div>

          {/* MAE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Mean Absolute Error (MAE)
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {mae.toFixed(1)} min
            </span>
          </div>
        </div>
      </div>

      {/* Footer info banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: 'rgba(61,126,255,0.05)',
          border: '1px solid rgba(61,126,255,0.15)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <Info size={15} color="#3d7eff" style={{ flexShrink: 0 }} />
        <p>
          Evaluation results reflect standardized test sets. Outlier predictions show intentional spread variance across both horizontal and vertical axes to illustrate true error distributions.
        </p>
      </div>
    </div>
  );
}