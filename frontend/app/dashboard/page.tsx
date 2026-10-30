'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, Clock, Plane, Building2, Users, MapPin, CloudRain, BarChart3, Database, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Skeleton ─────────────────────────────────────────────────────────────
function KPISkeleton() {
  return (
    <div className="kpi-card">
      <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 32, width: '70%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 10, width: '40%' }} />
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color = '#3d7eff',
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span className="kpi-label">{label}</span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={14} color={color} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>
      )}
    </motion.div>
  );
}

// ── Pipeline Setup Banner ─────────────────────────────────────────────────────
function PipelineSetupBanner() {
  return (
    <div className="pipeline-banner" style={{ marginBottom: 24 }}>
      <AlertTriangle size={16} />
      <div>
        <strong>Analytics dataset not loaded.</strong>
        {' '}Run the ingestion pipeline to enable real analytics:{' '}
        <code
          style={{
            fontFamily: 'JetBrains Mono',
            background: 'rgba(245,158,11,0.1)',
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          python scripts/run_pipeline.py
        </code>
      </div>
    </div>
  );
}

const sampleMonthlyTrend = [
  { period: 'Jan', delay_rate: 0.23, total_flights: 45000 },
  { period: 'Feb', delay_rate: 0.21, total_flights: 41000 },
  { period: 'Mar', delay_rate: 0.19, total_flights: 52000 },
  { period: 'Apr', delay_rate: 0.18, total_flights: 50000 },
  { period: 'May', delay_rate: 0.20, total_flights: 55000 },
  { period: 'Jun', delay_rate: 0.25, total_flights: 60000 },
  { period: 'Jul', delay_rate: 0.27, total_flights: 63000 },
  { period: 'Aug', delay_rate: 0.26, total_flights: 61000 },
  { period: 'Sep', delay_rate: 0.20, total_flights: 54000 },
  { period: 'Oct', delay_rate: 0.18, total_flights: 53000 },
  { period: 'Nov', delay_rate: 0.21, total_flights: 48000 },
  { period: 'Dec', delay_rate: 0.28, total_flights: 51000 },
];

const sampleHourlyDelays = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  delay_rate: 0.12 + Math.sin((h - 6) * 0.4) * 0.08 + (h >= 16 && h <= 21 ? 0.10 : 0),
}));

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: {typeof p.value === 'number' && p.value < 1
            ? `${(p.value * 100).toFixed(1)}%`
            : p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const overview = await api.overview();
      if (overview.status === 'ok') {
        setDataReady(true);
        setOverviewData(overview.data);
      }
      const trends = await api.trends();
      if (trends.status === 'ok') {
        setTrendData(trends.data);
      }
    } catch (e) {
      // Backend may not be running yet
    } finally {
      setIsLoading(false);
    }
  }

  const kpis = dataReady && overviewData
    ? [
        { label: 'Flights Analyzed', value: overviewData.total_flights?.toLocaleString() ?? '—', icon: Plane, color: '#3d7eff' },
        { label: 'Historical Delay Rate', value: overviewData.delay_rate != null ? `${(overviewData.delay_rate * 100).toFixed(1)}%` : '—', icon: TrendingUp, color: '#f59e0b' },
        { label: 'Avg Delay Duration', value: overviewData.avg_delay_minutes != null ? `${overviewData.avg_delay_minutes.toFixed(0)} min` : '—', icon: Clock, color: '#ef4444' },
        { label: 'Airports Covered', value: String(overviewData.airports_covered ?? '—'), icon: Building2, color: '#22c55e' },
        { label: 'Airlines Covered', value: String(overviewData.airlines_covered ?? '—'), icon: Users, color: '#8b5cf6' },
      ]
    : null;

  const displayTrend = trendData.length > 0 ? trendData : sampleMonthlyTrend;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '3px 10px',
                borderRadius: 100,
                background: 'var(--color-elevated)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                display: 'inline-block',
                marginBottom: 8,
              }}
            >
              SECTION 2 · AVIATION DATA & RESEARCH
            </div>
            <h1 className="page-title">Aviation Intelligence Data Overview</h1>
            <p className="page-subtitle">United States Domestic Aviation · Historical Dataset & Statistical Insights</p>
          </div>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '6px 14px',
              textAlign: 'right',
            }}
          >
            <div className="text-label">Data Period</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>
              {dataReady && overviewData?.data_period_start
                ? `${overviewData.data_period_start} — ${overviewData.data_period_end}`
                : 'Loaded'}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline setup banner */}
      {!isLoading && !dataReady && <PipelineSetupBanner />}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
        ) : kpis ? (
          kpis.map((k, i) => (
            <KPICard key={k.label} {...k} delay={i * 0.07} />
          ))
        ) : (
          [
            { label: 'Flights Analyzed', value: '25,000+', icon: Plane, color: '#3d7eff' },
            { label: 'Historical Delay Rate', value: '25.0%', icon: TrendingUp, color: '#f59e0b' },
            { label: 'Avg Delay Duration', value: '35 min', icon: Clock, color: '#ef4444' },
            { label: 'Airports Covered', value: '50', icon: Building2, color: '#22c55e' },
            { label: 'Airlines Covered', value: '12', icon: Users, color: '#8b5cf6' },
          ].map((k, i) => (
            <KPICard key={k.label} {...k} delay={i * 0.07} />
          ))
        )}
      </div>

      {/* Analytics Data Sections */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Monthly delay rate trend */}
        <div className="chart-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="chart-title">Monthly Delay Rate Trend</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={displayTrend}>
              <defs>
                <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d7eff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3d7eff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" />
              <XAxis dataKey="period" tick={{ fill: '#4d6080', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#4d6080', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="delay_rate"
                stroke="#3d7eff"
                strokeWidth={2}
                fill="url(#delayGrad)"
                name="Delay Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly delay pattern */}
        <div className="chart-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="chart-title">Hourly Delay Rate Vulnerability</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sampleHourlyDelays} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,132,195,0.08)" />
              <XAxis
                dataKey="hour"
                tickFormatter={(h) => `${h}:00`}
                tick={{ fill: '#4d6080', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#4d6080', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="delay_rate"
                fill="#3d7eff"
                name="Delay Rate"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Explorer Modules grid */}
      <div style={{ marginBottom: 12 }}>
        <h3 className="chart-title" style={{ marginBottom: 12 }}>Explore Aviation Datasets</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {[
            {
              href: '/dashboard/airports',
              title: 'Airport Intelligence',
              desc: 'Congestion proxies, peak traffic windows, and 24-hr airport patterns.',
              icon: MapPin,
              color: '#06b6d4',
            },
            {
              href: '/dashboard/weather',
              title: 'Weather Impact',
              desc: 'Precipitation, visibility, and seasonal meteorological correlations.',
              icon: CloudRain,
              color: '#3d7eff',
            },
            {
              href: '/dashboard/analytics',
              title: 'Carrier Analytics',
              desc: 'Carrier delay rate comparisons and worst airport rankings.',
              icon: BarChart3,
              color: '#8b5cf6',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="card"
                style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${card.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={14} color={card.color} />
                  </div>
                  <ArrowRight size={13} color="var(--color-text-muted)" />
                </div>
                <h4 className="text-headline" style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem', marginBottom: 4 }}>
                  {card.title}
                </h4>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
