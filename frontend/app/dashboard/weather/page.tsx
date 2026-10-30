'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, ScatterChart, Scatter,
} from 'recharts';

const DISCLAIMER =
  'These analyses show historical associations between weather conditions and flight delays and do not independently establish causation. Multiple confounding factors affect delay rates.';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>{label}</div>
      {payload.map((p: any, index: number) => (
        <div key={`${String(p.dataKey)}-${String(p.name)}-${index}`} style={{ color: p.color, fontSize: 12 }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.value < 2 ? `${(p.value * 100).toFixed(1)}%` : p.value?.toFixed != null ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

// Sample weather data (clearly labeled)
const samplePrecipData = [
  { label: 'None (0mm)', delay_rate: 0.18, count: 450000 },
  { label: 'Light (0–5mm)', delay_rate: 0.22, count: 120000 },
  { label: 'Moderate (5–15mm)', delay_rate: 0.28, count: 45000 },
  { label: 'Heavy (>15mm)', delay_rate: 0.34, count: 18000 },
];

const sampleVisData = [
  { label: '>10km', avg_delay: 9.2, count: 520000 },
  { label: '5–10km', avg_delay: 12.1, count: 80000 },
  { label: '2–5km', avg_delay: 17.4, count: 30000 },
  { label: '<2km', avg_delay: 28.6, count: 8000 },
];

const sampleSeasonalData = [
  { month: 'Jan', avg_precip: 3.2, delay_rate: 0.23 },
  { month: 'Feb', avg_precip: 2.8, delay_rate: 0.21 },
  { month: 'Mar', avg_precip: 4.1, delay_rate: 0.20 },
  { month: 'Apr', avg_precip: 4.8, delay_rate: 0.19 },
  { month: 'May', avg_precip: 4.2, delay_rate: 0.21 },
  { month: 'Jun', avg_precip: 3.6, delay_rate: 0.25 },
  { month: 'Jul', avg_precip: 3.9, delay_rate: 0.27 },
  { month: 'Aug', avg_precip: 3.7, delay_rate: 0.26 },
  { month: 'Sep', avg_precip: 2.9, delay_rate: 0.19 },
  { month: 'Oct', avg_precip: 2.4, delay_rate: 0.18 },
  { month: 'Nov', avg_precip: 2.8, delay_rate: 0.21 },
  { month: 'Dec', avg_precip: 3.5, delay_rate: 0.28 },
];

export default function WeatherIntelligencePage() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [notReady, setNotReady] = useState(false);

  useEffect(() => {
    api.weatherAnalytics()
      .then((r) => {
        if (r.status === 'not_ready') setNotReady(true);
        else setWeatherData(r.data);
      })
      .catch(() => setNotReady(true));
  }, []);

  const precipData = weatherData?.precip_buckets ?? samplePrecipData;
  const visData = weatherData?.visibility_buckets ?? sampleVisData;
  const seasonal = weatherData?.seasonal ?? sampleSeasonalData;
  const isReal = !!weatherData;

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="text-label" style={{ marginBottom: 6 }}>Intelligence Module</p>
        <h1 className="page-title">Weather Impact Intelligence</h1>
        <p className="page-subtitle">
          Explore how historical weather conditions are associated with flight delays.
        </p>
      </div>

      {/* Scientific disclaimer */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '12px 16px',
          background: 'rgba(61,126,255,0.06)',
          border: '1px solid rgba(61,126,255,0.15)',
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <Info size={14} color="#3d7eff" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {DISCLAIMER}
        </p>
      </div>

      {notReady && (
        <div className="pipeline-banner" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Weather analytics not available.</strong> Run the pipeline to load real data.
            Showing illustrative sample patterns below.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Precipitation vs Delay Rate */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="chart-title">Precipitation vs Delay Rate</div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Historical delay rate by daily precipitation level (associated, not causal)
              </p>
            </div>
            {!isReal && <SampleBadge />}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={precipData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#8a9bbf', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="delay_rate" name="Delay Rate" radius={[0, 3, 3, 0]}>
                {precipData.map((_: any, i: number) => (
                  <Bar key={i} fill={['#22c55e', '#3d7eff', '#f59e0b', '#ef4444'][i] ?? '#3d7eff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visibility vs Avg Delay */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="chart-title">Visibility vs Average Delay</div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Historical average delay duration by visibility range
              </p>
            </div>
            {!isReal && <SampleBadge />}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={visData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v} min`} tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#8a9bbf', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg_delay" name="Avg Delay (min)" fill="#06b6d4" radius={[0, 3, 3, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonal patterns */}
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="chart-title">Seasonal Weather & Delay Patterns</div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Monthly average precipitation and historical delay rate
            </p>
          </div>
          {!isReal && <SampleBadge />}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={seasonal}>
            <defs>
              <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="delayGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#4d6080', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="avg_precip" stroke="#06b6d4" fill="url(#precipGrad)" name="Avg Precip (mm)" strokeWidth={2} />
            <Area yAxisId="right" type="monotone" dataKey="delay_rate" stroke="#f59e0b" fill="url(#delayGrad2)" name="Delay Rate" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SampleBadge() {
  return (
    <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100, fontWeight: 600, whiteSpace: 'nowrap' }}>
      SAMPLE
    </span>
  );
}
