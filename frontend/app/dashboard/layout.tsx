'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlaneTakeoff,
  MapPin,
  CloudRain,
  BarChart3,
  FlaskConical,
  Database,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  LineChart,
} from 'lucide-react';
import { api } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
}

// ── Isolated Navigation Items for Aviation Data & Intelligence Only ───────
const DATA_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview & KPIs', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/airports', label: 'Airport Intelligence', icon: MapPin },
  { href: '/dashboard/weather', label: 'Weather Impact', icon: CloudRain },
  { href: '/dashboard/analytics', label: 'Exploratory Analytics', icon: BarChart3 },
  { href: '/dashboard/mllab', label: 'ML Engineering Lab', icon: FlaskConical },
  { href: '/dashboard/comparison', label: 'Model Evaluation', icon: LineChart },
  { href: '/dashboard/datasources', label: 'Data Sources & Limits', icon: Database },
];

type SystemStatus = 'checking' | 'online' | 'offline' | 'no_data';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus>('checking');
  const [dataReady, setDataReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPredictorView = pathname.startsWith('/dashboard/predictor');

  useEffect(() => {
    checkSystemStatus();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function checkSystemStatus() {
    try {
      await api.health();
      setStatus('online');
      const overview = await api.overview().catch(() => null);
      if (overview?.status === 'ok') setDataReady(true);

      const models = await api.models().catch(() => null);
      if (models?.status === 'ok' && models?.models?.length > 0) {
        setModelsReady(true);
      }
    } catch {
      setStatus('offline');
    }
  }

  // ── 1. ISOLATED PREDICTOR EXPERIENCE (No Data Sidebar) ──────────────────
  if (isPredictorView) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-void)' }}>
        {/* Predictor Dedicated Top Header */}
        <header
          style={{
            height: 64,
            padding: '0 32px',
            background: 'var(--color-deep)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #3d7eff, #06b6d4)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>✈</span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                AEROCAST
              </span>
            </Link>
            <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 100,
                background: 'rgba(61, 126, 255, 0.1)',
                border: '1px solid rgba(61, 126, 255, 0.25)',
              }}
            >
              <Sparkles size={12} color="#3d7eff" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3d7eff', letterSpacing: '0.06em' }}>
                FLIGHT PREDICTOR TOOL
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: 12 }}
            >
              Switch to Aviation Data & Intelligence <ArrowRight size={13} />
            </button>
          </div>
        </header>

        {/* Predictor Content (Full-width clean workspace) */}
        <main style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--color-void)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ── 2. ISOLATED AVIATION DATA & INTELLIGENCE EXPERIENCE ───────────────
  return (
    <div className="app-layout">
      {/* Mobile Top Navigation Header */}
      <div className="mobile-header-bar">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #3d7eff, #06b6d4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✈</span>
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#0f172a' }}>AEROCAST</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', color: '#0f172a' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar for Data & Analytics Only */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div
          style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: 'linear-gradient(135deg, #3d7eff, #06b6d4)',
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✈</span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  AEROCAST
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>
                  DATA & ANALYTICS PORTAL
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Predictor Mode Switcher Button */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => router.push('/dashboard/predictor')}
            className="btn-primary"
            style={{ width: '100%', padding: '9px 12px', fontSize: 11, justifyContent: 'center' }}
          >
            <PlaneTakeoff size={13} />
            Launch Predictor Tool
          </button>
        </div>

        {/* Section Header */}
        <div style={{ padding: '14px 20px 6px' }}>
          <span className="text-label" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
            AVIATION DATA & INTELLIGENCE
          </span>
        </div>

        {/* Data Navigation items */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
          {DATA_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} className="nav-icon flex-shrink-0" />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && (
                  <ChevronRight size={12} style={{ color: '#3d7eff', opacity: 0.6 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* System status */}
        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            SYSTEM STATUS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <StatusRow
              label="API Server"
              status={status === 'checking' ? 'checking' : status === 'online' ? 'ok' : 'error'}
            />
            <StatusRow
              label="Data Pipeline"
              status={status !== 'online' ? 'unknown' : dataReady ? 'ok' : 'warning'}
            />
            <StatusRow
              label="ML Models"
              status={status !== 'online' ? 'unknown' : modelsReady ? 'ok' : 'warning'}
              note="Run training"
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function StatusRow({
  label,
  status,
  note,
}: {
  label: string;
  status: 'ok' | 'error' | 'warning' | 'checking' | 'unknown';
  note?: string;
}) {
  const colors = {
    ok: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    checking: '#4d6080',
    unknown: '#4d6080',
  };

  const labels = {
    ok: 'READY',
    error: 'OFFLINE',
    warning: note?.toUpperCase() ?? 'SETUP NEEDED',
    checking: 'CHECKING',
    unknown: '—',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {status === 'checking' ? (
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: colors[status],
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: colors[status],
              boxShadow: `0 0 5px ${colors[status]}`,
            }}
          />
        )}
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', color: colors[status] }}>
          {labels[status]}
        </span>
      </div>
    </div>
  );
}
