'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, AlertTriangle, CheckCircle, Clock, Plane, CloudRain, Filter, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export default function LiveRadarTracker() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'LATE_ONLY' | 'HIGH_RISK'>('ALL');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLiveRadar = async () => {
    setLoading(true);
    try {
      const res = await api.liveRadar();
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // Graceful error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRadar();
    const interval = setInterval(fetchLiveRadar, 30000); // Auto-refresh radar every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const flights = data?.live_flights ?? [];
  const filteredFlights = flights.filter((f: any) => {
    if (filter === 'LATE_ONLY') return f.risk_category === 'HIGH' || f.risk_category === 'MODERATE';
    if (filter === 'HIGH_RISK') return f.risk_category === 'HIGH';
    return true;
  });

  const lateCount = flights.filter((f: any) => f.risk_category === 'HIGH').length;

  return (
    <div
      className="card"
      style={{
        background: '#ffffff',
        border: '1.5px solid rgba(226, 232, 240, 0.9)',
        borderRadius: 20,
        padding: '32px 36px',
        boxShadow: '0 12px 36px -10px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* ── Header Bar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #dc2626, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Radio size={22} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="text-headline" style={{ fontSize: '1.3rem', color: '#0f172a' }}>
                Real-Time Flight Delay Radar
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 100, background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
                <div className="status-dot" style={{ width: 6, height: 6, background: '#dc2626' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', letterSpacing: '0.06em' }}>LIVE STREAM</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Live departures across major US hubs evaluated through ML risk scoring.
            </p>
          </div>
        </div>

        {/* Live Filter Tabs & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, border: '1px solid #cbd5e1' }}>
            {[
              { id: 'ALL', label: 'All Live Flights' },
              { id: 'LATE_ONLY', label: `Expected Late (${lateCount})` },
              { id: 'HIGH_RISK', label: 'High Delay Risk' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  background: filter === tab.id ? '#ffffff' : 'transparent',
                  color: filter === tab.id ? '#2563eb' : '#64748b',
                  boxShadow: filter === tab.id ? '0 2px 8px rgba(15, 23, 42, 0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchLiveRadar}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: 12, borderRadius: 10 }}
            title="Refresh Live Flight Radar"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Flight List Grid ──────────────────────────────────────── */}
      {loading && !data ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          Scanning live radar frequencies for upcoming departures...
        </div>
      ) : filteredFlights.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          No flights matching current filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredFlights.map((flight: any, index: number) => {
            const isHigh = flight.risk_category === 'HIGH';
            const isModerate = flight.risk_category === 'MODERATE';
            const isLow = flight.risk_category === 'LOW';

            const badgeBg = isHigh ? 'rgba(220, 38, 38, 0.08)' : isModerate ? 'rgba(217, 119, 6, 0.08)' : 'rgba(22, 163, 74, 0.08)';
            const badgeBorder = isHigh ? 'rgba(220, 38, 38, 0.25)' : isModerate ? 'rgba(217, 119, 6, 0.25)' : 'rgba(22, 163, 74, 0.25)';
            const badgeColor = isHigh ? '#dc2626' : isModerate ? '#d97706' : '#16a34a';

            return (
              <motion.div
                key={flight.flight_num + index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  padding: '18px 24px',
                  background: isHigh ? 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' : '#f8fafc',
                  border: `1.5px solid ${isHigh ? 'rgba(220, 38, 38, 0.3)' : '#cbd5e1'}`,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: isHigh ? '0 8px 20px -6px rgba(220, 38, 38, 0.12)' : 'none',
                }}
              >
                {/* Left: Flight Code & Carrier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: isHigh ? '#fee2e2' : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 800,
                      fontSize: 14,
                      color: isHigh ? '#dc2626' : '#0f172a',
                    }}
                  >
                    {flight.code}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                        {flight.flight_num}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        Gate {flight.gate}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {flight.carrier} · Departs at <strong style={{ color: '#0f172a' }}>{flight.sched_time} Today</strong>
                    </div>
                  </div>
                </div>

                {/* Center: Route Vector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {flight.origin}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ArrowRight size={16} color="#94a3b8" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {flight.dest}
                    </div>
                  </div>
                </div>

                {/* Right: ML Risk Prediction Badge & Delay Expectation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        borderRadius: 100,
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {isHigh ? <AlertTriangle size={13} /> : <CheckCircle size={13} />}
                      {isHigh ? `EXPECTED LATE (+${flight.expected_delay_minutes} MIN)` : isModerate ? `MINOR RISK (+${flight.expected_delay_minutes} MIN)` : 'ON TIME'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      ML Risk Score: <strong style={{ color: badgeColor }}>{Math.round(flight.delay_prob * 100)}%</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>
        Last updated: {lastUpdated || 'Just now'} · Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
