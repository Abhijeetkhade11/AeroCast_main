'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, ArrowRight, AlertTriangle, TrendingUp, TrendingDown, Info, RotateCcw, Sparkles, Clock, Calendar, ArrowLeftRight, ShieldCheck, Cpu, Compass, Search, ChevronDown, Check, CloudRain, Wind, Thermometer, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import type { Airport, Airline, PredictResponse, RiskCategory, ShapFactor } from '@/lib/types';

// ── Analysis Steps ────────────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  'Assembling flight profile',
  'Loading historical BTS patterns',
  'Evaluating weather context',
  'Computing airport congestion proxy',
  'Running XGBoost ML classifier',
  'Running delay regressor engine',
  'Calculating SHAP explanation waterfall',
  'Generating intelligence report',
];

// ── Quick Time Presets ───────────────────────────────────────────────────
const TIME_PRESETS = [
  { label: '08:00 Morning Peak', hour: 8, minute: 0, tag: 'MORNING' },
  { label: '13:30 Afternoon Flight', hour: 13, minute: 30, tag: 'MIDDAY' },
  { label: '18:30 Evening Rush', hour: 18, minute: 30, tag: 'EVENING' },
  { label: '22:15 Night Departure', hour: 22, minute: 15, tag: 'NIGHT' },
];

// ── Risk Config ───────────────────────────────────────────────────────────
const RISK_CONFIG: Record<RiskCategory, { color: string; bg: string; border: string; label: string }> = {
  LOW: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.3)', label: 'Low Delay Risk' },
  MODERATE: { color: '#d97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)', label: 'Moderate Delay Risk' },
  HIGH: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', label: 'High Delay Risk' },
};

// ── Custom Searchable Airport Select ──────────────────────────────────────
function CustomAirportSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: Airport[];
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.iata === value);

  const filteredOptions = options.filter(
    (o) =>
      o.iata.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Select Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {selected ? `${selected.iata} — ${selected.city}` : placeholder}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
            {selected?.name ?? ''}
          </div>
        </div>
        <ChevronDown
          size={18}
          color="#64748b"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 100,
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: 14,
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.18)',
              overflow: 'hidden',
              maxHeight: 320,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input Filter */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search airport code or city (e.g. JFK, Chicago)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 13,
                  color: '#0f172a',
                  fontWeight: 500,
                }}
              />
            </div>

            {/* List of Airport Options */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                  No matching airports found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.iata === value;
                  return (
                    <div
                      key={opt.iata}
                      onClick={() => {
                        onChange(opt.iata);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#2563eb' : '#0f172a' }}>
                          <span style={{ fontFamily: 'JetBrains Mono', color: '#2563eb', marginRight: 6 }}>{opt.iata}</span>
                          {opt.city}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{opt.name}</div>
                      </div>
                      {isSelected && <Check size={16} color="#2563eb" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Custom Searchable Airline Select ─────────────────────────────────────
function CustomAirlineSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: Airline[];
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.code === value);

  const filteredOptions = options.filter(
    (o) =>
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Select Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {selected ? `${selected.name} (${selected.code})` : placeholder}
          </div>
        </div>
        <ChevronDown
          size={18}
          color="#64748b"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 100,
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: 14,
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.18)',
              overflow: 'hidden',
              maxHeight: 280,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input Filter */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search airline name or code (e.g. Delta, AA)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 13,
                  color: '#0f172a',
                  fontWeight: 500,
                }}
              />
            </div>

            {/* List of Airline Options */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                  No matching airlines found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.code === value;
                  return (
                    <div
                      key={opt.code}
                      onClick={() => {
                        onChange(opt.code);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#2563eb' : '#0f172a' }}>
                        {opt.name} <span style={{ fontFamily: 'JetBrains Mono', color: '#64748b', fontSize: 11, marginLeft: 4 }}>({opt.code})</span>
                      </div>
                      {isSelected && <Check size={16} color="#2563eb" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Analysis Loader ───────────────────────────────────────────────────────
function AnalysisLoader({ step }: { step: number }) {
  return (
    <div
      style={{
        padding: '50px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        background: '#ffffff',
        borderRadius: 20,
        border: '1.5px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.1)',
      }}
    >
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid rgba(37, 99, 235, 0.2)',
            borderTopColor: '#2563eb',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlaneTakeoff size={24} color="#2563eb" />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          Computing Flight Risk Intelligence
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Executing pre-flight feature matrix through ML classifier & regressor...
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ANALYSIS_STEPS.map((s, i) => (
          <motion.div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 14px',
              borderRadius: 10,
              background: i === step ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
              border: `1px solid ${i === step ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}`,
              opacity: i <= step ? 1 : 0.3,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: i < step ? '#16a34a' : i === step ? '#2563eb' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {i < step ? '✓' : i === step ? '•' : ''}
            </div>
            <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: i <= step ? '#0f172a' : '#64748b' }}>
              {s}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Radial Gauge Component ───────────────────────────────────────────────
function DelayGauge({ probability, risk }: { probability: number; risk: RiskCategory }) {
  const config = RISK_CONFIG[risk];
  const pct = Math.round(probability * 100);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashArray = circumference * (probability * 0.75);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 170, height: 170 }}>
        <svg width="170" height="170" viewBox="0 0 170 170">
          <circle
            cx="85"
            cy="85"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={circumference * 0.875}
            strokeLinecap="round"
          />
          <motion.circle
            cx="85"
            cy="85"
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="12"
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={circumference * 0.875}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dashArray} ${circumference - dashArray}` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${config.color}50)` }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
              fontFamily: 'Space Grotesk',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: config.color,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {pct}%
          </motion.div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginTop: 4, letterSpacing: '0.08em' }}>
            DELAY RISK
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          padding: '6px 20px',
          borderRadius: 100,
          background: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        {config.label.toUpperCase()}
      </motion.div>
    </div>
  );
}

// ── SHAP Factor Row ──────────────────────────────────────────────────────
function ShapRow({ factor, maxAbs, delay }: { factor: ShapFactor; maxAbs: number; delay: number }) {
  const isRisk = factor.direction === 'increases_risk';
  const pct = Math.abs(factor.shap_value) / maxAbs;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      style={{
        padding: '10px 14px',
        background: isRisk ? 'rgba(239, 68, 68, 0.04)' : 'rgba(34, 197, 94, 0.04)',
        border: `1px solid ${isRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'}`,
        borderRadius: 10,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{factor.display_name ?? factor.feature}</span>
          {factor.feature.startsWith('wx_') && (
            <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
              WEATHER
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 12,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            color: isRisk ? '#dc2626' : '#16a34a',
          }}
        >
          {isRisk ? '+' : ''}{factor.shap_value.toFixed(3)}
        </span>
      </div>

      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
        <motion.div
          style={{
            height: '100%',
            background: isRisk ? 'linear-gradient(90deg, #f87171, #dc2626)' : 'linear-gradient(90deg, #4ade80, #16a34a)',
            borderRadius: 3,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ delay: delay + 0.1, duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div style={{ fontSize: 11, color: '#64748b' }}>{factor.description}</div>
    </motion.div>
  );
}

// ── Result Studio Panel ─────────────────────────────────────────────────
function ResultPanel({ result, onReset }: { result: PredictResponse; onReset: () => void }) {
  const maxAbs = Math.max(...result.shap_factors.map((f) => Math.abs(f.shap_value)), 0.001);
  const riskFactors = result.shap_factors.filter((f) => f.direction === 'increases_risk');
  const reducers = result.shap_factors.filter((f) => f.direction === 'decreases_risk');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          className="card"
          style={{
            background: '#ffffff',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1.5px solid rgba(226, 232, 240, 0.9)',
          }}
        >
          <div className="text-label" style={{ marginBottom: 16 }}>OVERALL DELAY PROBABILITY</div>
          <DelayGauge probability={result.delay_probability} risk={result.risk_category} />

          {result.expected_delay_minutes != null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              style={{
                marginTop: 20,
                padding: '16px 20px',
                background: '#f8fafc',
                borderRadius: 12,
                textAlign: 'center',
                width: '100%',
                border: '1px solid #cbd5e1',
              }}
            >
              <div className="text-label" style={{ marginBottom: 6 }}>EXPECTED DELAY DURATION</div>
              <div
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                +{result.expected_delay_minutes} min
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                Regression estimate · ±15 min typical uncertainty
              </div>
            </motion.div>
          )}

          {result.historical_context && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              style={{
                marginTop: 14,
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: 12,
                width: '100%',
                border: '1px solid #cbd5e1',
              }}
            >
              <div className="text-label" style={{ marginBottom: 8 }}>HISTORICAL ROUTE CONTEXT</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
                <div>
                  • Similar flights: <strong style={{ color: '#0f172a' }}>{result.historical_context.similar_flights_count.toLocaleString()}</strong>
                </div>
                <div>
                  • Historical delay rate:{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {(result.historical_context.avg_delay_rate * 100).toFixed(1)}%
                  </strong>
                </div>
                <div>
                  • Average historical delay:{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {result.historical_context.avg_delay_minutes} min
                  </strong>
                </div>
              </div>
            </motion.div>
          )}

          {/* Weather & Live Forecast Context Card */}
          {result.weather_used && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              style={{
                marginTop: 14,
                padding: '16px 18px',
                background: '#ffffff',
                borderRadius: 12,
                width: '100%',
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="text-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f172a' }}>
                  <CloudRain size={14} color="#2563eb" /> PREDICTION WEATHER
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: result.weather_source === 'forecast' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: result.weather_source === 'forecast' ? '#059669' : '#d97706',
                    border: `1px solid ${result.weather_source === 'forecast' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  }}
                >
                  {result.weather_source === 'forecast' ? `FORECAST (${result.weather_days_out ?? 0}D OUT)` : 'SEASONAL AVG'}
                </div>
              </div>

              {/* 4 Weather Value Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CloudRain size={11} color="#3b82f6" /> Precip
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {result.weather_used.precip_mm} mm
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wind size={11} color="#3b82f6" /> Wind Speed
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {result.weather_used.wind_speed_kmh} km/h
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Thermometer size={11} color="#ef4444" /> Temp
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {result.weather_used.temp_c} °C
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={11} color="#10b981" /> Visibility
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {result.weather_used.visibility_km} km
                  </div>
                </div>
              </div>

              {/* Weather Explainability Summary */}
              {result.weather_impact_summary && (
                <div
                  style={{
                    background: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 11,
                    color: '#1e3a8a',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={11} /> WEATHER IMPACT EXPLAINABILITY
                  </div>
                  {result.weather_impact_summary}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ background: '#ffffff', padding: 28, border: '1.5px solid rgba(226, 232, 240, 0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color="#2563eb" />
              </div>
              <div>
                <h3 className="text-headline" style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                  SHAP Explainability Waterfall
                </h3>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  Exact pre-flight features driving this specific prediction model result.
                </p>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#2563eb',
                background: 'rgba(37, 99, 235, 0.08)',
                padding: '4px 12px',
                borderRadius: 100,
              }}
            >
              PRE-FLIGHT ONLY
            </div>
          </div>

          {/* Weather Explainability Banner above SHAP list */}
          {result.weather_impact_summary && (
            <div
              style={{
                marginBottom: 20,
                padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(240, 253, 244, 0.95))',
                border: '1px solid rgba(191, 219, 254, 0.9)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <CloudRain size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', letterSpacing: '0.04em' }}>
                  WEATHER EXPLAINABILITY SUMMARY
                </div>
                <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 3, lineHeight: 1.5, fontWeight: 500 }}>
                  {result.weather_impact_summary}
                </div>
              </div>
            </div>
          )}

          {result.shap_factors.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={24} className="empty-state-icon" />
              <p>SHAP factor breakdown not available for this model.</p>
            </div>
          ) : (
            <div>
              {riskFactors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#dc2626',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <TrendingUp size={12} />
                    INCREASES DELAY RISK
                  </div>
                  {riskFactors.map((f, i) => (
                    <ShapRow key={f.feature} factor={f} maxAbs={maxAbs} delay={0.2 + i * 0.06} />
                  ))}
                </div>
              )}

              {reducers.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#16a34a',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <TrendingDown size={12} />
                    REDUCES DELAY RISK
                  </div>
                  {reducers.map((f, i) => (
                    <ShapRow key={f.feature} factor={f} maxAbs={maxAbs} delay={0.4 + i * 0.06} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* <div
            style={{
              marginTop: 24,
              padding: '14px 18px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div className="text-label" style={{ fontSize: 9 }}>Classifier</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>
                  {result.classifier_model}
                </div>
              </div>
              {result.regressor_model && (
                <div>
                  <div className="text-label" style={{ fontSize: 9 }}>Regressor</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>
                    {result.regressor_model}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onReset}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: 12, borderRadius: 10 }}
            >
              <RotateCcw size={13} />
              New Prediction
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

// ── Main Flight Predictor Studio Page ──────────────────────────────────
export default function PredictorPage() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [origin, setOrigin] = useState('JFK');
  const [dest, setDest] = useState('LAX');
  const [airline, setAirline] = useState('AA');
  const [flightDate, setFlightDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [depHour, setDepHour] = useState(18);
  const [depMinute, setDepMinute] = useState(30);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.airports().then((r) => setAirports(r.airports));
    api.airlines().then((r) => setAirlines(r.airlines));
  }, []);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(dest);
    setDest(temp);
  };

  async function handleAnalyze() {
    if (origin === dest) {
      setError('Origin and destination airports must be different.');
      return;
    }
    setError(null);
    setResult(null);
    setIsAnalyzing(true);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, 380);

    try {
      const res = await api.predict({
        origin,
        destination: dest,
        airline,
        flight_date: flightDate,
        scheduled_departure_hour: depHour,
        scheduled_departure_minute: depMinute,
      });
      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 450));
      setResult(res);
    } catch (e: any) {
      clearInterval(stepInterval);
      setError(e.message ?? 'Prediction failed. Ensure uvicorn backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const selectedOrigin = airports.find((a) => a.iata === origin);
  const selectedDest = airports.find((a) => a.iata === dest);
  const selectedAirline = airlines.find((a) => a.code === airline);

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Studio Header Banner ────────────────────────────────────── */}
      <div
        style={{
          marginBottom: 32,
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
          border: '1.5px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 20,
          boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#2563eb',
                background: 'rgba(37, 99, 235, 0.12)',
                padding: '4px 12px',
                borderRadius: 100,
              }}
            >
              ML FLIGHT INTELLIGENCE STUDIO
            </div>
            <div className="status-dot" style={{ width: 6, height: 6, background: '#16a34a' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>ML MODELS READY</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', color: '#0f172a' }}>
            Flight Delay Predictor
          </h1>
          <p className="page-subtitle" style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>
            Predict flight disruption risk, estimated delay duration, and SHAP factor causes using pre-flight feature matrix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
              TARGET LEAKAGE PREVENTION
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              Strict D-90 → D-1 Rolling Windows
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Loader or Result or Form ─────────────────────── */}
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <AnalysisLoader step={analysisStep} />
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <ResultPanel result={result} onReset={() => setResult(null)} />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
          >
            {/* 1. Visual Flight Route Dispatcher Card */}
            <div
              className="card"
              style={{
                background: '#ffffff',
                border: '1.5px solid rgba(226, 232, 240, 0.9)',
                borderRadius: 20,
                padding: '32px 36px',
                boxShadow: '0 12px 36px -10px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlaneTakeoff size={18} color="white" />
                  </div>
                  <div>
                    <h2 className="text-headline" style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                      Select Flight Route
                    </h2>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      Choose origin & destination airports from US domestic aviation dataset.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSwapAirports}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12, borderRadius: 100 }}
                  title="Swap Origin and Destination"
                >
                  <ArrowLeftRight size={14} /> Swap Airports
                </button>
              </div>

              {/* Custom Searchable Airport Selection Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 16, alignItems: 'center' }}>
                {/* Origin Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                    border: '1.5px solid rgba(37, 99, 235, 0.25)',
                    borderRadius: 16,
                    padding: '20px 24px',
                  }}
                >
                  <div className="text-label" style={{ marginBottom: 8, color: '#2563eb' }}>
                    DEPARTURE ORIGIN AIRPORT
                  </div>
                  <CustomAirportSelect
                    value={origin}
                    options={airports}
                    onChange={(val) => setOrigin(val)}
                    placeholder="Select Departure Airport..."
                  />
                  <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', gap: 16 }}>
                    <span>City: <strong>{selectedOrigin?.city ?? origin}</strong></span>
                    <span>State: <strong>{selectedOrigin?.state ?? 'US'}</strong></span>
                  </div>
                </div>

                {/* Animated Flight Arc Vector Icon */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div
                    animate={{ x: [-4, 4, -4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(37, 99, 235, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                    }}
                  >
                    <ArrowRight size={20} />
                  </motion.div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 4 }}>NON-STOP</span>
                </div>

                {/* Destination Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                    border: '1.5px solid rgba(37, 99, 235, 0.25)',
                    borderRadius: 16,
                    padding: '20px 24px',
                  }}
                >
                  <div className="text-label" style={{ marginBottom: 8, color: '#2563eb' }}>
                    ARRIVAL DESTINATION AIRPORT
                  </div>
                  <CustomAirportSelect
                    value={dest}
                    options={airports}
                    onChange={(val) => setDest(val)}
                    placeholder="Select Destination Airport..."
                  />
                  <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', gap: 16 }}>
                    <span>City: <strong>{selectedDest?.city ?? dest}</strong></span>
                    <span>State: <strong>{selectedDest?.state ?? 'US'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Airline Carrier & Flight Schedule Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Custom Airline Selector */}
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: 20,
                  padding: '28px 32px',
                }}
              >
                <div className="text-label" style={{ marginBottom: 12, color: '#2563eb' }}>
                  AIRLINE OPERATOR
                </div>
                <h3 className="text-headline" style={{ marginBottom: 16 }}>Select Operating Carrier</h3>
                <CustomAirlineSelect
                  value={airline}
                  options={airlines}
                  onChange={(val) => setAirline(val)}
                  placeholder="Select Airline Carrier..."
                />

                <div
                  style={{
                    marginTop: 20,
                    padding: '14px 18px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                      {selectedAirline?.name ?? airline}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Carrier Code: <strong>{airline}</strong>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#2563eb',
                      background: 'rgba(37, 99, 235, 0.1)',
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    BTS TRACKED
                  </div>
                </div>
              </div>

              {/* Schedule & Time Selector */}
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: 20,
                  padding: '28px 32px',
                }}
              >
                <div className="text-label" style={{ marginBottom: 12, color: '#2563eb' }}>
                  SCHEDULE & DEPARTURE TIME
                </div>
                <h3 className="text-headline" style={{ marginBottom: 16 }}>Date & Departure Hour</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                      Flight Date
                    </div>
                    <input
                      type="date"
                      className="aero-input"
                      value={flightDate}
                      onChange={(e) => setFlightDate(e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: 10 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                      Departure Time (24h)
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="number"
                        className="aero-input"
                        min={0}
                        max={23}
                        value={depHour}
                        onChange={(e) => setDepHour(parseInt(e.target.value, 10) || 0)}
                        placeholder="HH"
                        style={{ padding: '10px', borderRadius: 10, textAlign: 'center', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', alignSelf: 'center' }}>:</span>
                      <input
                        type="number"
                        className="aero-input"
                        min={0}
                        max={59}
                        value={depMinute}
                        onChange={(e) => setDepMinute(parseInt(e.target.value, 10) || 0)}
                        placeholder="MM"
                        style={{ padding: '10px', borderRadius: 10, textAlign: 'center', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Time Presets */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setDepHour(p.hour);
                        setDepMinute(p.minute);
                      }}
                      style={{
                        padding: '5px 10px',
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 8,
                        background: depHour === p.hour ? 'rgba(37, 99, 235, 0.12)' : '#f1f5f9',
                        border: `1px solid ${depHour === p.hour ? 'rgba(37, 99, 235, 0.3)' : '#cbd5e1'}`,
                        color: depHour === p.hour ? '#2563eb' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  padding: '14px 20px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1.5px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: 12,
                  fontSize: 13,
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* High-Impact Glow CTA Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleAnalyze}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '18px 36px',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.04em',
                borderRadius: 16,
                justifyContent: 'center',
                boxShadow: '0 12px 30px -5px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Sparkles size={20} />
              ANALYZE FLIGHT DELAY RISK & SHAP FACTORS
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
