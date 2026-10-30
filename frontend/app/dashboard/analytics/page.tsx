'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 12 }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.value < 2
            ? `${(p.value * 100).toFixed(1)}%`
            : p.value?.toLocaleString?.()}
        </div>
      ))}
    </div>
  );
};

const sampleAirlineData = [
  { code: 'HA', name: 'Hawaiian', delay_rate: 0.149, avg_delay: 18.2 },
  { code: 'AS', name: 'Alaska', delay_rate: 0.162, avg_delay: 17.1 },
  { code: 'DL', name: 'Delta', delay_rate: 0.181, avg_delay: 20.4 },
  { code: 'WN', name: 'Southwest', delay_rate: 0.194, avg_delay: 23.8 },
  { code: 'UA', name: 'United', delay_rate: 0.221, avg_delay: 26.6 },
  { code: 'AA', name: 'American', delay_rate: 0.213, avg_delay: 24.7 },
  { code: 'B6', name: 'JetBlue', delay_rate: 0.242, avg_delay: 28.1 },
  { code: 'NK', name: 'Spirit', delay_rate: 0.271, avg_delay: 31.4 },
].sort((a, b) => a.delay_rate - b.delay_rate);

const sampleWorstAirports = [
  { iata: 'EWR', name: 'Newark', delay_rate: 0.271, avg_delay: 18.2 },
  { iata: 'JFK', name: 'JFK', delay_rate: 0.258, avg_delay: 17.1 },
  { iata: 'ORD', name: "O'Hare", delay_rate: 0.281, avg_delay: 16.8 },
  { iata: 'SFO', name: 'San Francisco', delay_rate: 0.251, avg_delay: 15.9 },
  { iata: 'BOS', name: 'Boston', delay_rate: 0.232, avg_delay: 14.3 },
  { iata: 'LGA', name: 'LaGuardia', delay_rate: 0.248, avg_delay: 15.2 },
  { iata: 'MIA', name: 'Miami', delay_rate: 0.202, avg_delay: 12.1 },
  { iata: 'DFW', name: 'Dallas', delay_rate: 0.218, avg_delay: 13.4 },
].sort((a, b) => b.delay_rate - a.delay_rate);

export default function AnalyticsPage() {
  const [notReady, setNotReady] = useState(false);
  const [airlineData, setAirlineData] = useState<any[]>([]);
  const [airportData, setAirportData] = useState<any[]>([]);

  useEffect(() => {
    api.airlinesAnalytics()
      .then((r) => {
        if (r.status === 'not_ready') setNotReady(true);
        else setAirlineData(r.data);
      })
      .catch(() => setNotReady(true));
    api.airportsAnalytics()
      .then((r) => { if (r.status === 'ok') setAirportData(r.data); })
      .catch(() => {});
  }, []);

  const displayAirlines = airlineData.length > 0 ? airlineData : sampleAirlineData;
  const displayAirports = airportData.length > 0 ? airportData.slice(0, 8) : sampleWorstAirports;
  const isReal = airlineData.length > 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="text-label" style={{ marginBottom: 6 }}>Exploratory Analytics</p>
        <h1 className="page-title">Aviation Analytics</h1>
        <p className="page-subtitle">
          Explore delay patterns across airlines, airports, and time periods.
        </p>
      </div>

      {notReady && (
        <div className="pipeline-banner" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Real analytics not available.</strong> Sample patterns shown.
            Run <code style={{ fontFamily: 'JetBrains Mono', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4 }}>
              python scripts/run_pipeline.py
            </code> to load BTS data.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Airline performance */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div className="chart-title">Airline Delay Rate Comparison</div>
            {!isReal && <SampleBadge />}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Historical departure delay rate (≥15 min threshold) by carrier
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={displayAirlines} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8a9bbf', fontSize: 11 }} axisLine={false} tickLine={false} width={105} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="delay_rate" name="Delay Rate" fill="#3d7eff" radius={[0, 3, 3, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Worst airports */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div className="chart-title">Highest Delay Rate Airports</div>
            {!isReal && <SampleBadge />}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Top 8 airports by historical departure delay rate
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={displayAirports} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="iata" tick={{ fill: '#8a9bbf', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="delay_rate" name="Delay Rate" fill="#ef4444" radius={[0, 3, 3, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average delay comparison */}
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="chart-title">Average Delay Duration by Airline (when delayed)</div>
          {!isReal && <SampleBadge />}
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Average departure delay in minutes for delayed flights only
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={displayAirlines} barSize={28} margin={{ bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" />
            <XAxis dataKey="code" interval={0} angle={-35} textAnchor="end" height={52} tick={{ fill: '#4d6080', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg_delay" name="Avg Delay (min)" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SampleBadge() {
  return (
    <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100, fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
      SAMPLE
    </span>
  );
}
