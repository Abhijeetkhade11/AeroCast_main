'use client';

import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle } from 'lucide-react';

const SOURCES = [
  {
    name: 'BTS On-Time Performance Data',
    org: 'Bureau of Transportation Statistics',
    desc:
      'US Department of Transportation official source for domestic flight on-time performance statistics. Includes scheduled and actual departure/arrival times, delay causes, cancellation codes, and distance data for all US domestic carriers.',
    coverage: 'All US domestic commercial carriers · Monthly data from 1987–present',
    access: 'Manual CSV download via BTS portal (free, no account required)',
    url: 'https://www.transtats.bts.gov/DL_SelectFields.aspx',
    fields: ['FlightDate', 'Carrier', 'Origin', 'Dest', 'CRSDepTime', 'DepDelay', 'ArrDelay', 'Cancelled', 'Distance'],
    color: '#3d7eff',
    official: true,
  },
  {
    name: 'Open-Meteo Historical Weather API',
    org: 'Open-Meteo',
    desc:
      'Free historical weather API providing daily and hourly meteorological observations derived from ERA5 reanalysis data. Fetched programmatically by airport coordinates. No API key required for free tier.',
    coverage: 'Global · Daily historical data from 1940–present',
    access: 'Free REST API · No API key required · Rate limiting applied',
    url: 'https://open-meteo.com/en/docs/historical-weather-api',
    fields: ['precipitation_sum', 'windspeed_10m_max', 'temperature_2m_mean', 'visibility', 'snowfall_sum'],
    color: '#06b6d4',
    official: false,
  },
  {
    name: 'OurAirports Airport Database',
    org: 'OurAirports',
    desc:
      'Public domain airport database containing IATA/ICAO codes, geographic coordinates, names, cities, states, and timezone data for airports worldwide. Used for mapping airports to weather station coordinates and UI metadata.',
    coverage: 'Global · 50,000+ airports · Updated regularly by community',
    access: 'Public domain CSV download or direct use',
    url: 'https://ourairports.com/data/',
    fields: ['ident', 'iata_code', 'latitude_deg', 'longitude_deg', 'municipality', 'iso_region', 'local_code'],
    color: '#8b5cf6',
    official: false,
  },
];

const LIMITATIONS = [
  {
    title: 'Historical data only',
    desc:
      'AeroIntel is not a live flight tracking system. All predictions are based on historical patterns and do not reflect current operational conditions.',
  },
  {
    title: 'BTS data coverage',
    desc:
      'BTS reports only domestic US flights operated by certificated air carriers. Regional commuter flights operated under major carrier codes may not be fully represented.',
  },
  {
    title: 'Weather matching methodology',
    desc:
      'Weather is matched to flights by origin airport location and date using Open-Meteo\'s ERA5-based reanalysis. ERA5 reanalysis is a reconstruction, not direct observation, and may differ from actual station readings at individual airports.',
  },
  {
    title: 'Prediction limitations',
    desc:
      'ML models are trained on historical data and cannot account for unprecedented events, real-time operational disruptions, or conditions outside the training distribution (e.g., new weather extremes, COVID-era scheduling changes).',
  },
  {
    title: 'Congestion index is a proxy',
    desc:
      'The airport congestion index is calculated from historical departure volumes and delay rates. It does not represent official ATC sector capacity or FAA slot controls.',
  },
  {
    title: 'Association ≠ causation',
    desc:
      'Weather impact analyses show historical associations between weather variables and delay rates. Multiple confounding factors exist (airline schedules, aircraft rotations, ATC traffic flow management) and causal claims are not made.',
  },
  {
    title: 'Target leakage prevention',
    desc:
      'Models exclusively use pre-flight information (no actual departure times, post-event delay causes, or arrival data). Some information available in an actual operational context (e.g., real-time ATIS, NOTAM data) is not included.',
  },
];

function SourceCard({ source, index }: { source: typeof SOURCES[0]; index: number }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{ marginBottom: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: source.color,
                boxShadow: `0 0 6px ${source.color}`,
              }}
            />
            <h3 className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
              {source.name}
            </h3>
            {source.official && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 100,
                  background: 'rgba(34,197,94,0.1)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.2)',
                  letterSpacing: '0.06em',
                }}
              >
                OFFICIAL GOVERNMENT DATA
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-sky)', fontWeight: 500 }}>{source.org}</p>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}
        >
          Visit Source <ExternalLink size={11} />
        </a>
      </div>

      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 14 }}>
        {source.desc}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div className="text-label" style={{ marginBottom: 4 }}>DATA COVERAGE</div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{source.coverage}</p>
        </div>
        <div>
          <div className="text-label" style={{ marginBottom: 4 }}>ACCESS METHOD</div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{source.access}</p>
        </div>
      </div>

      <div>
        <div className="text-label" style={{ marginBottom: 6 }}>FIELDS USED</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {source.fields.map((f) => (
            <span
              key={f}
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: `${source.color}12`,
                border: `1px solid ${source.color}25`,
                color: 'var(--color-text-secondary)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function DataSourcesPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <p className="text-label" style={{ marginBottom: 6 }}>Transparency</p>
        <h1 className="page-title">Built on Real Data</h1>
        <p className="page-subtitle">
          Every analysis, chart, and prediction in AeroIntel is grounded in official and reputable
          public datasets. No fabricated metrics. No invented data.
        </p>
      </div>

      {SOURCES.map((source, i) => (
        <SourceCard key={source.name} source={source} index={i} />
      ))}

      {/* Limitations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <h2 className="text-display" style={{ fontSize: '1.2rem' }}>
            Data Limitations & Disclaimers
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {LIMITATIONS.map((lim, i) => (
            <motion.div
              key={lim.title}
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                {lim.title}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                {lim.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: '16px 20px',
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--color-text-secondary)' }}>Intended use:</strong> AeroIntel
            is a portfolio project demonstrating end-to-end ML engineering with real data. It is not
            intended for operational flight planning or decisions. Predictions should be interpreted as
            probability estimates based on historical patterns, not forecasts of actual flight outcomes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
