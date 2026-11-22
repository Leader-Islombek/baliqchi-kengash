"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/core/utils";

/**
 * 1. Interactive 3D Mouse-Tracking Tilt Card + Specular Aurora Sheen
 */
export function Tilt3DCard({
  children,
  className,
  glowColor = "rgba(56, 189, 248, 0.22)",
  maxTilt = 7,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const springX = useSpring(rotateX, { stiffness: 260, damping: 24 });
  const springY = useSpring(rotateY, { stiffness: 260, damping: 24 });

  const sheen = useMotionTemplate`radial-gradient(280px circle at ${mouseX}% ${mouseY}%, ${glowColor}, transparent 70%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateX.set((0.5 - py) * maxTilt * 2);
    rotateY.set((px - 0.5) * maxTilt * 2);
    mouseX.set(px * 100);
    mouseY.set(py * 100);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        className={cn("relative h-full will-change-transform", className)}
      >
        <motion.div
          aria-hidden="true"
          style={{ background: sheen }}
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {children}
      </motion.div>
    </div>
  );
}

/**
 * 2. Real-time 60fps 3D Interactive Sphere of 61 Schools & 7 Direction Rings
 * Pure HTML5 Canvas 3D perspective projection — ultra-fast, zero WebGL crash risk.
 */
interface Point3D {
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;
  schoolNumber: number;
}

const NODE_COLORS = [
  "#22D3EE", // Cyan
  "#60A5FA", // Electric Blue
  "#A78BFA", // Aurora Violet
  "#34D399", // Emerald Mint
  "#38BDF8", // Sky
  "#818CF8", // Indigo
  "#FBBF24", // Gold
];

function createFibonacci61Sphere(): Point3D[] {
  const count = 61;
  const pts: Point3D[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    pts.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
      color: NODE_COLORS[i % NODE_COLORS.length],
      size: i % 9 === 0 ? 3.4 : 2.3,
      schoolNumber: i + 1,
    });
  }
  return pts;
}

export function District3DConstellation({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ x: 0, y: 0, active: false });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points = createFibonacci61Sphere();

    let animId = 0;
    let rotY = 0.4;
    let rotX = 0.25;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 320;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 320;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.38;

      ctx.clearRect(0, 0, w, h);

      if (!reducedMotion) {
        rotY += pointerRef.current.active ? pointerRef.current.x * 0.025 : 0.0055;
        rotX += pointerRef.current.active
          ? (pointerRef.current.y * 0.45 - rotX) * 0.05
          : (0.28 - rotX) * 0.02;
      }

      // Soft central core aura
      const coreGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 1.15);
      coreGlow.addColorStop(0, "rgba(79, 70, 229, 0.42)");
      coreGlow.addColorStop(0.45, "rgba(34, 211, 238, 0.16)");
      coreGlow.addColorStop(1, "rgba(6, 11, 25, 0)");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 3 tilted 3D orbital rings
      const rings = [
        { tiltX: 0.55, tiltZ: 0.3, color: "rgba(34, 211, 238, 0.28)", scale: 1.16 },
        { tiltX: -0.65, tiltZ: -0.45, color: "rgba(139, 92, 246, 0.28)", scale: 1.08 },
        { tiltX: 0.2, tiltZ: 1.05, color: "rgba(16, 185, 129, 0.24)", scale: 1.22 },
      ];
      for (const ring of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.tiltZ + rotY * 0.18);
        ctx.scale(1, Math.max(0.24, Math.abs(Math.cos(ring.tiltX + rotX * 0.35))));
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(0, 0, R * ring.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Project all 61 school nodes into 2D screen space
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = points.map((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;
        const perspective = 2.6 / (2.6 - z2);
        return {
          sx: cx + x1 * R * perspective,
          sy: cy + y2 * R * perspective,
          z: z2,
          scale: perspective,
          color: p.color,
          size: p.size,
        };
      });

      // Subtle glowing network edges between close 3D neighbors
      ctx.lineWidth = 0.7;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const distSq = dx * dx + dy * dy;
          const maxDist = R * 0.48;
          if (distSq < maxDist * maxDist && a.z > -0.45 && b.z > -0.45) {
            const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.28;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // Depth-sort back to front & draw 61 glowing nodes
      projected.sort((a, b) => a.z - b.z);
      for (const n of projected) {
        const depthAlpha = Math.min(1, Math.max(0.22, (n.z + 1.2) / 2.2));
        const r = Math.max(1.2, n.size * n.scale);

        ctx.globalAlpha = depthAlpha * 0.35;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = depthAlpha;
        ctx.fillStyle = n.z > 0.45 ? "#FFFFFF" : n.color;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        animId = requestAnimationFrame(draw);
      }
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
          active: true,
        };
      }}
      onMouseLeave={() => {
        pointerRef.current.active = false;
      }}
      className={cn("relative select-none", className)}
      aria-label="61 ta maktab va 7 ta yo‘nalishning 3D interaktiv modeli"
    >
      <canvas ref={canvasRef} className="h-full w-full block cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-white/20 bg-[#060B19]/70 px-3.5 py-2 text-center backdrop-blur-md shadow-xl">
          <div className="font-display text-lg font-extrabold bg-gradient-to-r from-[#22D3EE] via-[#818CF8] to-[#34D399] bg-clip-text text-transparent">
            61 Maktab
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            3D Ekotizim
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Subtle 3D Perspective Depth Horizon Grid
 */
export function Perspective3DGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-56 overflow-hidden opacity-45"
      style={{
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
      }}
    >
      <div
        className="mx-auto h-full w-[160%] -translate-x-[18%] bk-3d-floor"
        style={{
          transform: "perspective(520px) rotateX(64deg)",
          transformOrigin: "bottom center",
        }}
      />
    </div>
  );
}
