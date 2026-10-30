'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, Cell,
} from 'recharts';

const CONGESTION_NOTE =
  'Congestion Index is a proxy score (0–100) derived from: (avg 2-hr departure volume / max observed 2-hr volume) × 70 + (historical delay rate) × 30. Not an official ATC measure.';

const AIRPORTS_LIST = [
  'ATL','LAX','ORD','DFW','DEN','JFK','SFO','SEA','LAS','MCO',
  'EWR','CLT','PHX','IAH','MIA','BOS','MSP','FLL','LGA','DTW',
];

function NotReadyBanner() {
  return (
    <div className="pipeline-banner" style={{ marginBottom: 24 }}>
      <AlertTriangle size={16} />
      <div>
        <strong>Analytics not available.</strong> Run{' '}
        <code style={{ fontFamily: 'JetBrains Mono', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4 }}>
          python scripts/run_pipeline.py
        </code>{' '}
        to load real airport data.
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 12 }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.value <= 1 ? `${(p.value * 100).toFixed(1)}%` : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AirportIntelligencePage() {
  const [selected, setSelected] = useState('ATL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notReady, setNotReady] = useState(false);

  useEffect(() => {
    loadAirport(selected);
  }, [selected]);

  async function loadAirport(iata: string) {
    setLoading(true);
    setData(null);
    try {
      const res = await api.airportDetail(iata);
      if (res.status === 'not_ready') {
        setNotReady(true);
      } else {
        setNotReady(false);
        setData(res.data);
      }
    } catch {
      setNotReady(true);
    } finally {
      setLoading(false);
    }
  }

  // Sample hourly pattern for display when data not ready
  const sampleHourly = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    flights: Math.round(30 + Math.sin((h - 7) * 0.5) * 20 + (h >= 16 && h <= 20 ? 15 : 0)),
    delay_rate: 0.12 + (h >= 16 && h <= 21 ? 0.12 : 0) + (h < 6 ? -0.05 : 0),
  }));

  const hourlyData = data?.hourly_traffic?.map((d: any) => ({
    hour: `${String(d.hour).padStart(2, '0')}:00`,
    flights: d.flights,
    delay_rate: d.delay_rate,
  })) ?? sampleHourly;

  const isReal = !!data?.hourly_traffic;

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="text-label" style={{ marginBottom: 6 }}>Intelligence Module</p>
        <h1 className="page-title">Airport Intelligence</h1>
        <p className="page-subtitle">Congestion patterns, traffic analysis, and delay heatmaps for US domestic airports.</p>
      </div>

      {notReady && <NotReadyBanner />}

      {/* Airport selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div className="text-label">SELECT AIRPORT</div>
        <select
          className="aero-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ width: 200 }}
        >
          {AIRPORTS_LIST.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Flights', value: data?.total_flights?.toLocaleString() ?? '—' },
          { label: 'Delay Rate', value: data?.delay_rate != null ? `${(data.delay_rate * 100).toFixed(1)}%` : '—' },
          { label: 'Avg Delay', value: data?.avg_delay != null ? `${data.avg_delay.toFixed(0)} min` : '—' },
          { label: 'Congestion Index', value: data?.congestion_index != null ? `${data.congestion_index.toFixed(0)} / 100` : '—' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            className="kpi-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ marginTop: 8 }}>{loading ? '—' : k.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Congestion note */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--color-elevated)',
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid var(--color-border)',
        }}
      >
        <Info size={13} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-text-secondary)' }}>Congestion methodology:</strong>{' '}
          {CONGESTION_NOTE}
        </p>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* 24-hr traffic */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="chart-title">24-Hour Traffic Pattern</div>
            {!isReal && (
              <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                SAMPLE
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" />
              <XAxis dataKey="hour" tick={{ fill: '#4d6080', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="flights" fill="#3d7eff" name="Departures" radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delay rate by hour */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="chart-title">Delay Rate by Hour</div>
            {!isReal && (
              <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                SAMPLE
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" />
              <XAxis dataKey="hour" tick={{ fill: '#4d6080', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="delay_rate" name="Delay Rate" radius={[2, 2, 0, 0]}>
                {hourlyData.map((d: any, i: number) => (
                  <Cell key={i} fill={d.delay_rate > 0.25 ? '#ef4444' : d.delay_rate > 0.20 ? '#f59e0b' : '#3d7eff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day-of-week heatmap placeholder */}
      <div className="chart-container" style={{ marginTop: 20 }}>
        <div className="chart-title" style={{ marginBottom: 16 }}>
          Delay Heatmap — Day × Hour
          {!data?.daily_heatmap && (
            <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100, fontWeight: 600, marginLeft: 10 }}>
              AVAILABLE AFTER DATA LOAD
            </span>
          )}
        </div>
        {!data?.daily_heatmap ? (
          <div className="empty-state">
            <p style={{ fontSize: 13 }}>
              Day × Hour delay heatmap will render here after the ingestion pipeline is run.
            </p>
          </div>
        ) : (
          <p>Heatmap data available — render component</p>
        )}
      </div>
    </div>
  );
}
