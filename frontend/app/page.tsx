'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BarChart3, ArrowRight, Activity, Zap } from 'lucide-react';

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          fontFamily: 'Space Grotesk',
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B' }}>
        {label}
      </span>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 450], [1, 0]);
  const heroY = useTransform(scrollY, [0, 450], [0, -40]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #F0F7FF 0%, #F8FAFC 35%, #FFFFFF 100%)',
        minHeight: '100vh',
        color: '#0F172A',
        fontFamily: 'var(--font-body)',
        overflowX: 'hidden',
      }}
    >
      {/* Background Decorative Ambient Glow */}
      <div
        style={{
          position: 'fixed',
          top: -100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          height: 500,
          background: 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.06) 50%, rgba(255, 255, 255, 0) 80%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Light Glassmorphism Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 68,
          zIndex: 50,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Activity size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#0F172A', letterSpacing: '-0.01em' }}>
              AEROINTEL
            </div>
            <div style={{ fontSize: 9, color: '#2563EB', letterSpacing: '0.08em', fontWeight: 700 }}>
              AVIATION INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
            style={{
              padding: '9px 20px',
              fontSize: 13,
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              fontWeight: 500,
            }}
          >
            Aviation Data Platform
          </button>
          <button
            onClick={() => router.push('/dashboard/predictor')}
            className="btn-primary"
            style={{
              padding: '9px 22px',
              fontSize: 13,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              color: '#FFFFFF',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            Use Flight Predictor <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Light Hero Section */}
      <section
        style={{
          width: '100%',
          minHeight: '85vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 120,
          paddingBottom: 60,
          zIndex: 1,
        }}
      >
        <motion.div
          style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 10 }}
          className="flex flex-col items-center text-center"
        >
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 100,
              marginBottom: 28,
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div className="status-dot" style={{ width: 8, height: 8, background: '#2563EB', borderRadius: '50%' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#1E40AF',
                textTransform: 'uppercase',
              }}
            >
              US Domestic Aviation ML Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-hero"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            style={{
              maxWidth: 900,
              padding: '0 24px',
              fontSize: '3.6rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: '#0F172A',
            }}
          >
            Predict Flight Delays.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Understand Sky Disruptions.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{
              fontSize: 18,
              color: '#475569',
              maxWidth: 640,
              margin: '24px auto 0',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            High-precision Machine Learning framework powered by BTS flight history and Open-Meteo weather parameters with real-time SHAP explainability.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            style={{ marginTop: 36, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <button
              onClick={() => router.push('/dashboard/predictor')}
              className="btn-primary"
              style={{
                padding: '14px 36px',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '0.02em',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Zap size={18} />
              USE FLIGHT PREDICTOR
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
              style={{
                padding: '14px 36px',
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 10,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <BarChart3 size={18} />
              EXPLORE AVIATION DATA
            </button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            style={{
              display: 'flex',
              gap: 32,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 56,
              padding: '20px 36px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            }}
          >
            <StatBadge value="50+" label="US Airports" />
            <div style={{ width: 1, background: '#E2E8F0' }} />
            <StatBadge value="12" label="Carriers" />
            <div style={{ width: 1, background: '#E2E8F0' }} />
            <StatBadge value="Real" label="BTS Records" />
            <div style={{ width: 1, background: '#E2E8F0' }} />
            <StatBadge value="SHAP" label="Explainability" />
          </motion.div>
        </motion.div>
      </section>

      {/* Two Independent Portals */}
      <section
        style={{
          padding: '90px 24px',
          maxWidth: 1280,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-label" style={{ marginBottom: 8, color: '#2563EB', fontWeight: 700, letterSpacing: '0.08em' }}>
            SYSTEM ARCHITECTURE
          </p>
          <h2
            className="text-display"
            style={{ color: '#0F172A', marginBottom: 16, fontSize: '2.4rem', fontWeight: 700 }}
          >
            Two Independent Portals
          </h2>
          <p style={{ color: '#475569', fontSize: 16, maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
            AeroIntel keeps user-focused flight predictions completely separated from raw statistical database analytics.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 28,
            marginTop: 48,
          }}
        >
          {/* Card 1: Consumer Flight Predictor */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 100%)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 16,
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 32px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#2563EB',
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  display: 'inline-block',
                  marginBottom: 20,
                }}
              >
                EXPERIENCE 1 · USER PREDICTOR TOOL
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>
                Flight Delay Predictor
              </h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, marginBottom: 24 }}>
                A clean, distraction-free tool for travelers and airline operators to evaluate specific upcoming flights. Input origin, destination, carrier, and time to get instant ML delay probability and SHAP factor explanations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  { title: 'Delay Risk Classifier', desc: 'Predicts probability of delay ≥15 min (BTS standard)' },
                  { title: 'Expected Duration Estimate', desc: 'Regression model estimates expected delay minutes' },
                  { title: 'SHAP Waterfall Factors', desc: 'Displays exact positive & negative risk contributors' },
                  { title: 'Pre-Flight Feature Isolation', desc: 'Strictly zero target leakage from post-event fields' },
                ].map((item) => (
                  <div key={item.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/predictor')}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 10, background: 'linear-gradient(135deg, #2563EB, #06B6D4)', color: '#FFFFFF', fontWeight: 600, boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)' }}
            >
              LAUNCH PREDICTOR TOOL <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Card 2: Aviation Data Platform */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 16,
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#475569',
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: '#F1F5F9',
                  display: 'inline-block',
                  marginBottom: 20,
                  border: '1px solid #CBD5E1',
                }}
              >
                EXPERIENCE 2 · AVIATION DATA PLATFORM
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>
                Aviation Intelligence & Data
              </h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, marginBottom: 24 }}>
                A dedicated research workspace for data scientists, airport planners, and aviation analysts to inspect historical delay patterns, airport congestion proxies, weather impacts, and ML metrics.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  { title: 'Airport Density & Congestion', desc: '24-hour departure volume patterns & hourly heatmaps' },
                  { title: 'Meteorological Correlations', desc: 'Precipitation, wind speed, visibility & seasonal trends' },
                  { title: 'Exploratory Carrier Analytics', desc: 'Historical carrier delay rates & airport rankings' },
                  { title: 'ML Engineering Lab', desc: 'ROC-AUC, Precision, Recall, F1, MAE & SHAP metrics' },
                ].map((item) => (
                  <div key={item.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}
            >
              EXPLORE AVIATION DATA <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Production ML Pipeline Architecture */}
      <section
        style={{
          padding: '80px 24px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-label" style={{ marginBottom: 8, color: '#2563EB', fontWeight: 700, letterSpacing: '0.08em' }}>
              DATA ENGINEERING ARCHITECTURE
            </p>
            <h2 style={{ color: '#0F172A', marginBottom: 40, fontSize: '2rem', fontWeight: 700 }}>
              Production ML Pipeline Architecture
            </h2>
          </motion.div>

          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              flexWrap: 'wrap',
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {[
              { label: 'BTS\nFlight Data', color: '#2563EB' },
              { label: '→', color: '#94A3B8', isArrow: true },
              { label: 'Open-Meteo\nWeather', color: '#0284C7' },
              { label: '→', color: '#94A3B8', isArrow: true },
              { label: 'Feature\nEngineering', color: '#7C3AED' },
              { label: '→', color: '#94A3B8', isArrow: true },
              { label: 'XGBoost\nClassifier', color: '#2563EB' },
              { label: '+', color: '#94A3B8', isArrow: true },
              { label: 'GBT\nRegressor', color: '#0284C7' },
              { label: '→', color: '#94A3B8', isArrow: true },
              { label: 'SHAP\nExplainability', color: '#D97706' },
            ].map((node, i) =>
              node.isArrow ? (
                <span
                  key={i}
                  style={{ color: node.color, fontSize: 20, padding: '0 6px', fontWeight: 400 }}
                >
                  {node.label}
                </span>
              ) : (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${node.color}35`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    textAlign: 'center',
                    margin: '6px 2px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: node.color,
                      fontFamily: 'JetBrains Mono',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.4,
                    }}
                  >
                    {node.label}
                  </div>
                </motion.div>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 48px',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #E2E8F0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
          AEROINTEL
        </span>
        <p style={{ fontSize: 12, color: '#64748B' }}>
          Built on Bureau of Transportation Statistics data & Open-Meteo weather API.
          Historical analysis & probability models. Not for operational flight dispatch.
        </p>
      </footer>
    </div>
  );
}

