'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function RealisticAirplane3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll Progress Hook
  const { scrollY, scrollYProgress } = useScroll();

  // Smooth Springs for Scroll Parallax
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });
  const smoothScrollY = useSpring(scrollY, { stiffness: 90, damping: 25 });

  // ── Flight Dynamics mapped to Page Scroll ────────────────────────────
  // As user scrolls down the page, the plane banks, pitches upward, climbs & turns
  const planeRotateX = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [8, -14, -4, 10]);
  const planeRotateY = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [-10, 15, -12, 8]);
  const planeRollZ = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [-6, 12, -10, 6]);
  const planeX = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 60, -50, 20]);
  const planeY = useTransform(smoothScrollY, [0, 1000], [0, -180]);
  const planeScale = useTransform(smoothProgress, [0, 0.4, 1], [1, 1.12, 0.92]);

  // ── Multi-Layer Cloud Parallax Offsets mapped to Scroll ───────────────
  const bgCloudsY = useTransform(smoothScrollY, [0, 1000], [0, -120]);
  const midCloudsY = useTransform(smoothScrollY, [0, 1000], [0, -320]);
  const fgCloudsY = useTransform(smoothScrollY, [0, 1000], [0, -650]);

  const [telemetry, setTelemetry] = useState({
    altitude: 35000,
    speed: 510,
    heading: 274,
    bank: 0,
    pitch: 2,
  });

  // Track telemetry based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setTelemetry({
        altitude: Math.round(35000 + latest * 4500),
        speed: Math.round(510 + Math.sin(latest * Math.PI) * 40),
        heading: Math.round((274 + latest * 45) % 360),
        bank: Math.round(Math.sin(latest * Math.PI * 2) * 18),
        pitch: Math.round(2 + Math.cos(latest * Math.PI) * 12),
      });
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        perspective: 1200,
        overflow: 'hidden',
      }}
    >
      {/* ── 1. Deep Atmospheric Sky Background Gradient ────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #93c5fd 0%, #bfdbfe 25%, #dbeafe 55%, #eff6ff 80%, #ffffff 100%)',
        }}
      />

      {/* Volumetric Sun Flare & Atmospheric Lighting */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-12%',
          right: '12%',
          width: 750,
          height: 750,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(219,234,254,0.6) 40%, transparent 75%)',
          pointerEvents: 'none',
          filter: 'blur(35px)',
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 0.98, 0.85] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── 2. LAYER A: Far Background Clouds (Deepest 3D Scroll Plane) ── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          y: bgCloudsY,
          pointerEvents: 'none',
        }}
      >
        {[
          { top: '10%', left: '-5%', width: 550, height: 220, opacity: 0.5, speed: 45 },
          { top: '25%', left: '55%', width: 700, height: 260, opacity: 0.45, speed: 55 },
          { top: '50%', left: '20%', width: 600, height: 240, opacity: 0.4, speed: 50 },
        ].map((cloud, i) => (
          <motion.div
            key={`bg-cloud-${i}`}
            style={{
              position: 'absolute',
              top: cloud.top,
              left: cloud.left,
              width: cloud.width,
              height: cloud.height,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.5) 60%, transparent 80%)',
              filter: 'blur(30px)',
              opacity: cloud.opacity,
            }}
            animate={{ x: [-30, 30, -30] }}
            transition={{ duration: cloud.speed, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* ── 3. LAYER B: Midground Volumetric Cumulus Clouds ─────────────── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          y: midCloudsY,
          pointerEvents: 'none',
        }}
      >
        {[
          { top: '35%', left: '-10%', width: 650, height: 280, blur: 22, opacity: 0.7, speed: 28 },
          { top: '12%', left: '30%', width: 500, height: 200, blur: 18, opacity: 0.65, speed: 32 },
          { top: '58%', left: '50%', width: 750, height: 320, blur: 25, opacity: 0.75, speed: 24 },
          { top: '70%', left: '-5%', width: 800, height: 340, blur: 28, opacity: 0.8, speed: 22 },
        ].map((cloud, i) => (
          <motion.div
            key={`mid-cloud-${i}`}
            style={{
              position: 'absolute',
              top: cloud.top,
              left: cloud.left,
              width: cloud.width,
              height: cloud.height,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.95) 0%, rgba(226,232,240,0.6) 50%, transparent 80%)',
              boxShadow: 'inset 0 -15px 30px rgba(148, 163, 184, 0.15)',
              filter: `blur(${cloud.blur}px)`,
              opacity: cloud.opacity,
            }}
            animate={{ x: [-50, 50, -50] }}
            transition={{ duration: cloud.speed, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* ── 4. Seamless Floating Photorealistic Airliner (Scroll Parallax) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            width: '68vw',
            maxWidth: 960,
            rotateX: planeRotateX,
            rotateY: planeRotateY,
            rotateZ: planeRollZ,
            x: planeX,
            y: planeY,
            scale: planeScale,
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 40px 50px rgba(15, 23, 42, 0.22))',
          }}
          animate={{
            y: [0, -16, 0],
          }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Transparent Airliner PNG Asset (Clean — No Dots) */}
          <img
            src="/airliner_plane.png"
            alt="Photorealistic Commercial Jet Airliner"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </motion.div>
      </div>

      {/* ── 5. LAYER C: Foreground Wispy Clouds (Fast Scroll Parallax) ─── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          y: fgCloudsY,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        {[
          { top: '-5%', left: '60%', width: 500, height: 300, opacity: 0.5, blur: 14, speed: 18 },
          { top: '65%', left: '-10%', width: 700, height: 350, opacity: 0.6, blur: 16, speed: 15 },
          { top: '80%', left: '40%', width: 850, height: 380, opacity: 0.7, blur: 20, speed: 12 },
        ].map((cloud, i) => (
          <motion.div
            key={`fg-cloud-${i}`}
            style={{
              position: 'absolute',
              top: cloud.top,
              left: cloud.left,
              width: cloud.width,
              height: cloud.height,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.5) 50%, transparent 75%)',
              filter: `blur(${cloud.blur}px)`,
              opacity: cloud.opacity,
            }}
            animate={{ x: [-80, 80, -80] }}
            transition={{ duration: cloud.speed, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* ── 6. Live Flight Telemetry HUD Overlay ───────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 40,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 16,
          padding: '16px 26px',
          display: 'flex',
          gap: 32,
          boxShadow: '0 15px 35px -10px rgba(37, 99, 235, 0.15)',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            CRUISING ALTITUDE
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {telemetry.altitude.toLocaleString()} FL
          </div>
        </div>
        <div style={{ width: 1, background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            AIRSPEED
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {telemetry.speed} KTS
          </div>
        </div>
        <div style={{ width: 1, background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            HEADING
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: '#2563eb' }}>
            {telemetry.heading}° NW
          </div>
        </div>
        <div style={{ width: 1, background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            PITCH / BANK
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {telemetry.pitch}° / {telemetry.bank}°
          </div>
        </div>
      </div>
    </div>
  );
}
