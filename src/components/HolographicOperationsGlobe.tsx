import React, { useEffect, useRef, useState } from "react";
import { Activity, Radio, Cpu, Wifi, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HolographicOperationsGlobeProps {
  activeExamsCount?: number;
  activeLabsCount?: number;
  totalCandidates?: number;
  className?: string;
}

export function HolographicOperationsGlobe({
  activeExamsCount = 6,
  activeLabsCount = 8,
  totalCandidates = 1840,
  className = "",
}: HolographicOperationsGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.25, y: 0.35 });
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener("resize", handleResize);

    // Generate 3D points on a sphere (Fibonacci sphere algorithm)
    const numPoints = 120;
    const points: { x: number; y: number; z: number; isHub?: boolean; pulse?: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Make some points special active hubs
      const isHub = i % 14 === 0;
      points.push({ x, y, z, isHub, pulse: Math.random() * Math.PI * 2 });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      const dispW = canvas.offsetWidth;
      const dispH = canvas.offsetHeight;
      const radius = Math.min(dispW, dispH) * 0.36;
      const centerX = dispW / 2;
      const centerY = dispH / 2;

      ctx.clearRect(0, 0, dispW, dispH);

      // Auto-rotation when not dragging
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.005;
        rotationRef.current.x = 0.25 + Math.sin(time * 0.5) * 0.08;
      }

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;

      // Sort points from back to front for depth rendering
      const projected = points.map((p) => {
        // Rotate around Y
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);
        let x1 = p.x * cosY + p.z * sinY;
        let z1 = -p.x * sinY + p.z * cosY;

        // Rotate around X
        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const scale = 380 / (380 + z2 * radius);
        const projX = centerX + x1 * radius * scale;
        const projY = centerY + y2 * radius * scale;

        return {
          projX,
          projY,
          depth: z2,
          scale,
          isHub: p.isHub,
          pulse: p.pulse,
        };
      });

      projected.sort((a, b) => b.depth - a.depth);

      // Render outer glow ambient ring
      const grad = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.35);
      grad.addColorStop(0, "rgba(99, 102, 241, 0.12)");
      grad.addColorStop(0.5, "rgba(56, 189, 248, 0.06)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Draw subtle latitude rings
      for (let lat = -1; lat <= 1; lat += 0.5) {
        const ringRad = radius * Math.sqrt(Math.max(0, 1 - lat * lat));
        const ringY = centerY + lat * radius * Math.cos(rx);
        ctx.beginPath();
        ctx.ellipse(centerX, ringY, ringRad, ringRad * Math.abs(Math.sin(rx)) * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw connecting lines between nearby points
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.depth < -0.2) continue; // skip far back
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dist = Math.hypot(p1.projX - p2.projX, p1.projY - p2.projY);
          if (dist < 42) {
            const alpha = (1 - dist / 42) * 0.22 * Math.max(0, p1.depth + 0.6);
            ctx.beginPath();
            ctx.moveTo(p1.projX, p1.projY);
            ctx.lineTo(p2.projX, p2.projY);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw points / nodes
      projected.forEach((p) => {
        const alpha = Math.max(0.15, (p.depth + 1) / 2);
        if (p.isHub) {
          // Special active hub with 3D pulse
          const pulseSize = 3 + Math.sin(time * 3 + (p.pulse || 0)) * 2;
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, pulseSize * p.scale * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(236, 72, 153, ${alpha * 0.4})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.projX, p.projY, 3 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, 1.8 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(129, 140, 248, ${alpha * 0.85})`;
          ctx.fill();
        }
      });

      // Scanning radar beam sweep
      const sweepAngle = time * 2;
      const sweepX = centerX + Math.cos(sweepAngle) * radius * 0.95;
      const sweepY = centerY + Math.sin(sweepAngle) * radius * 0.45;
      const sweepGrad = ctx.createLinearGradient(centerX, centerY, sweepX, sweepY);
      sweepGrad.addColorStop(0, "rgba(56, 189, 248, 0.4)");
      sweepGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Mouse drag handlers for interactive 3D orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
    setIsInteractive(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(-0.9, Math.min(0.9, rotationRef.current.x - deltaY * 0.008));

    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-slate-950/90 via-indigo-950/40 to-slate-900/80 p-5 shadow-2xl backdrop-blur-2xl card-3d ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 3D Dynamic Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-sky-500/20 blur-3xl animate-pulse" />

      {/* Header HUD */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/40 shadow-inner">
            <Radio className="size-5 text-indigo-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-white font-display uppercase">
                3D Holographic Operations Radar
              </h3>
              <Badge className="bg-indigo-500/30 text-indigo-300 border-indigo-400/30 text-[10px] uppercase font-mono px-2 py-0.5">
                Real-Time Space
              </Badge>
            </div>
            <p className="text-xs text-indigo-200/70 font-sans">
              Interactive 3D spatial node tracking active CBT testing centers, labs & candidate attendance streams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10 gap-1.5 font-mono">
            <Wifi className="size-3 text-emerald-400 animate-pulse" />
            Zero Packet Loss · 4ms
          </Badge>
          <span className="text-[11px] text-indigo-300/60 hidden sm:inline">
            {isInteractive ? "🖐️ Drag to orbit 3D globe" : "✨ Click & drag to rotate"}
          </span>
        </div>
      </div>

      {/* Main Content Area with 3D Canvas & Floating Stat Pills */}
      <div className="relative mt-2 grid grid-cols-1 lg:grid-cols-12 items-center gap-4">
        {/* Left HUD Telemetry */}
        <div className="lg:col-span-3 space-y-3 z-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-indigo-400/40 hover:bg-white/10 hover:-translate-y-1 transform-gpu">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold uppercase tracking-wider text-[10px]">CBT Lab Nodes</span>
              <Cpu className="size-3.5 text-sky-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-display">{activeLabsCount}</span>
              <span className="text-[11px] text-emerald-400 font-semibold font-mono">100% Online</span>
            </div>
            <p className="text-[10px] text-indigo-200/60 mt-0.5">Dual OS & High-Speed Gigabit LAN</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-indigo-400/40 hover:bg-white/10 hover:-translate-y-1 transform-gpu">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Active Tests Hub</span>
              <Activity className="size-3.5 text-pink-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-display">{activeExamsCount}</span>
              <span className="text-[11px] text-indigo-300 font-mono">Parallel Sessions</span>
            </div>
            <p className="text-[10px] text-indigo-200/60 mt-0.5">Midterms & CBT Lab Assessments</p>
          </div>
        </div>

        {/* Center 3D Interactive Canvas */}
        <div className="lg:col-span-6 relative h-64 sm:h-72 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          />

          {/* Floating Center Radar Badge */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center size-20 rounded-full border border-indigo-400/30 bg-slate-950/60 backdrop-blur-lg shadow-2xl">
              <Eye className="size-5 text-indigo-300 animate-pulse" />
              <span className="text-[9px] font-mono text-indigo-200 uppercase font-bold mt-0.5">3D HUB</span>
            </div>
          </div>
        </div>

        {/* Right HUD Telemetry */}
        <div className="lg:col-span-3 space-y-3 z-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-indigo-400/40 hover:bg-white/10 hover:-translate-y-1 transform-gpu">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Candidates</span>
              <Radio className="size-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-display">
                {totalCandidates.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">Synced</span>
            </div>
            <p className="text-[10px] text-indigo-200/60 mt-0.5">99.4% Biometric / QR Check-in Rate</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-indigo-400/40 hover:bg-white/10 hover:-translate-y-1 transform-gpu">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Security Integrity</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] border-none px-1.5 py-0">SECURE</Badge>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300 font-display">100%</span>
              <span className="text-[11px] text-indigo-300 font-mono">0 Incidents</span>
            </div>
            <p className="text-[10px] text-indigo-200/60 mt-0.5">Lockdown Browser & CCTV Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
