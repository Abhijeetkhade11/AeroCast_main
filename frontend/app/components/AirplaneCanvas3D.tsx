'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function AirplaneCanvas3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState({
    altitude: 35000,
    speed: 510,
    heading: 274,
    bank: 0,
    pitch: 2,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── 1. Scene, Camera, Renderer ───────────────────────────────────────
    const scene = new THREE.Scene();

    // Bright atmospheric fog gradient
    scene.background = new THREE.Color('#e0eeff');
    scene.fog = new THREE.FogExp2('#e0eeff', 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── 2. Lighting ──────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 2.5);
    sunLight.position.set(10, 20, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const skyLight = new THREE.HemisphereLight('#38bdf8', '#e0eeff', 1.0);
    scene.add(skyLight);

    // ── 3. Construct 3D Commercial Airplane Model ───────────────────────
    const planeGroup = new THREE.Group();

    // Materials
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1,
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xebf2fa,
      roughness: 0.2,
      metalness: 0.2,
    });
    const accentBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.2,
      metalness: 0.4,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.8,
    });

    // 3A. Fuselage Main Body
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.48, 6.2, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, fuselageMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    planeGroup.add(bodyMesh);

    // Nose Cone (Radome)
    const noseGeo = new THREE.ConeGeometry(0.55, 1.3, 32);
    const noseMesh = new THREE.Mesh(noseGeo, fuselageMat);
    noseMesh.rotation.x = -Math.PI / 2;
    noseMesh.position.z = 3.75;
    planeGroup.add(noseMesh);

    // Tail Nose Cone
    const tailConeGeo = new THREE.ConeGeometry(0.48, 1.8, 32);
    const tailConeMesh = new THREE.Mesh(tailConeGeo, fuselageMat);
    tailConeMesh.rotation.x = Math.PI / 2;
    tailConeMesh.position.z = -4.0;
    planeGroup.add(tailConeMesh);

    // Cockpit Window Glass
    const cockpitGeo = new THREE.SphereGeometry(0.54, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const cockpitMesh = new THREE.Mesh(cockpitGeo, glassMat);
    cockpitMesh.position.set(0, 0.22, 3.1);
    cockpitMesh.rotation.x = -0.3;
    planeGroup.add(cockpitMesh);

    // 3B. Main Swept Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(4.8, -1.8);
    wingShape.lineTo(4.6, -2.4);
    wingShape.lineTo(0, -1.2);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    
    // Right Wing
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.rotation.x = Math.PI / 2;
    rightWing.position.set(0.2, 0, 0.4);
    rightWing.castShadow = true;
    planeGroup.add(rightWing);

    // Left Wing
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.rotation.x = Math.PI / 2;
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-0.2, 0, 0.4);
    leftWing.castShadow = true;
    planeGroup.add(leftWing);

    // Winglets
    const wingletGeo = new THREE.BoxGeometry(0.06, 0.8, 0.4);
    const rightWinglet = new THREE.Mesh(wingletGeo, accentBlueMat);
    rightWinglet.position.set(4.75, 0.35, -1.7);
    rightWinglet.rotation.z = -0.3;
    planeGroup.add(rightWinglet);

    const leftWinglet = new THREE.Mesh(wingletGeo, accentBlueMat);
    leftWinglet.position.set(-4.75, 0.35, -1.7);
    leftWinglet.rotation.z = 0.3;
    planeGroup.add(leftWinglet);

    // 3C. Jet Engines (Turbofans under wings)
    const engineCylinderGeo = new THREE.CylinderGeometry(0.32, 0.3, 1.2, 24);
    const engineFanGeo = new THREE.CircleGeometry(0.28, 16);

    const rightEngine = new THREE.Mesh(engineCylinderGeo, engineMat);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(1.7, -0.4, 0.8);
    rightEngine.castShadow = true;
    planeGroup.add(rightEngine);

    const leftEngine = new THREE.Mesh(engineCylinderGeo, engineMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-1.7, -0.4, 0.8);
    leftEngine.castShadow = true;
    planeGroup.add(leftEngine);

    // 3D. Vertical Tail Fin
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(0, 2.2);
    tailShape.lineTo(-1.1, 1.8);
    tailShape.lineTo(-1.8, 0);
    tailShape.closePath();

    const tailGeo = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    const tailFin = new THREE.Mesh(tailGeo, accentBlueMat);
    tailFin.position.set(0, 0.4, -3.2);
    tailFin.castShadow = true;
    planeGroup.add(tailFin);

    // Horizontal Tail Stabilizers
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(1.8, -0.7);
    stabShape.lineTo(1.7, -1.1);
    stabShape.lineTo(0, -0.6);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, extrudeSettings);
    const rightStab = new THREE.Mesh(stabGeo, wingMat);
    rightStab.rotation.x = Math.PI / 2;
    rightStab.position.set(0.2, 0.2, -3.8);
    planeGroup.add(rightStab);

    const leftStab = new THREE.Mesh(stabGeo, wingMat);
    leftStab.rotation.x = Math.PI / 2;
    leftStab.scale.set(-1, 1, 1);
    leftStab.position.set(-0.2, 0.2, -3.8);
    planeGroup.add(leftStab);

    // Wingtip Strobes
    const greenStrobeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const greenStrobeMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const rightStrobe = new THREE.Mesh(greenStrobeGeo, greenStrobeMat);
    rightStrobe.position.set(4.8, 0.05, -1.8);
    planeGroup.add(rightStrobe);

    const redStrobeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const redStrobeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leftStrobe = new THREE.Mesh(redStrobeGeo, redStrobeMat);
    leftStrobe.position.set(-4.8, 0.05, -1.8);
    planeGroup.add(leftStrobe);

    planeGroup.position.set(0, 0, 0);
    planeGroup.rotation.y = Math.PI; // Face forward/perspective
    scene.add(planeGroup);

    // ── 4. Floating Cloud Particle Field ─────────────────────────────────
    const cloudCount = 35;
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < cloudCount; i++) {
      const puff = new THREE.Mesh(cloudGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 15 - 2,
        (Math.random() - 0.5) * 50 - 10
      );
      puff.scale.setScalar(1 + Math.random() * 2.5);
      cloudGroup.add(puff);
    }
    scene.add(cloudGroup);

    // ── 5. Mouse Steering & Animation Loop ──────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetRotZ = 0;
    let targetRotX = 0;
    let targetRotY = Math.PI;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      mouseX = x;
      mouseY = y;

      targetRotZ = -x * 0.75; // Bank roll
      targetRotX = y * 0.4;   // Pitch
      targetRotY = Math.PI - x * 0.35; // Yaw heading steer

      setTelemetry({
        altitude: Math.round(35000 - y * 800),
        speed: Math.round(510 + x * 20),
        heading: Math.round((274 + x * 15 + 360) % 360),
        bank: Math.round(-x * 25),
        pitch: Math.round(-y * 12),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth flight interpolation (lerp)
      planeGroup.rotation.z += (targetRotZ - planeGroup.rotation.z) * 0.05;
      planeGroup.rotation.x += (targetRotX - planeGroup.rotation.x) * 0.05;
      planeGroup.rotation.y += (targetRotY - planeGroup.rotation.y) * 0.05;

      // Gentle floating bob
      planeGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.15;

      // Drift clouds backwards past airplane
      cloudGroup.children.forEach((c) => {
        c.position.z += 0.25;
        if (c.position.z > 20) {
          c.position.z = -40;
          c.position.x = (Math.random() - 0.5) * 40;
        }
      });

      // Flashing wingtip strobes
      const flash = Math.sin(elapsedTime * 8) > 0.7;
      greenStrobeMat.color.setHex(flash ? 0x4ade80 : 0x052e16);
      redStrobeMat.color.setHex(flash ? 0xf87171 : 0x450a0a);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Flight Telemetry HUD Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 28,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 12,
          padding: '12px 18px',
          display: 'flex',
          gap: 24,
          boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.12)',
          pointerEvents: 'none',
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            ALTITUDE
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {telemetry.altitude.toLocaleString()} FL
          </div>
        </div>
        <div style={{ width: 1, background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            AIRSPEED
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {telemetry.speed} KTS
          </div>
        </div>
        <div style={{ width: 1, background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            HEADING
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
            {telemetry.heading}° NW
          </div>
        </div>
        <div style={{ width: 1, background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
            BANK / PITCH
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {telemetry.bank}° / {telemetry.pitch}°
          </div>
        </div>
      </div>
    </div>
  );
}
