import { useEffect, useRef } from "react";

interface FireworksOverlayProps {
  durationMs?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
  flicker: boolean;
}

interface Burst {
  x: number;
  y: number;
  delayMs: number;
  colorPalette: string[];
}

const PALETTES = [
  ["#facc15", "#fde047", "#ffffff", "#fbbf24"], // Gold / Yellow
  ["#38bdf8", "#06b6d4", "#ffffff", "#67e8f9"], // Cyan / Sky Blue
  ["#f43f5e", "#ec4899", "#f472b6", "#fda4af"], // Pink / Rose
  ["#34d399", "#10b981", "#6ee7b7", "#a7f3d0"], // Emerald / Mint
  ["#facc15", "#38bdf8", "#f43f5e", "#ffffff"], // Multi-color festive
];

export function FireworksOverlay({ durationMs = 3200, onComplete }: FireworksOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;
    const startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];

    // Staggered burst origins matching the reference screenshot media_1795454294185_58bcc848.jpg
    const bursts: Burst[] = [
      { x: 0.22, y: 0.28, delayMs: 50, colorPalette: PALETTES[1] },  // Cyan burst left
      { x: 0.50, y: 0.18, delayMs: 150, colorPalette: PALETTES[0] }, // Gold burst center-top
      { x: 0.78, y: 0.25, delayMs: 250, colorPalette: PALETTES[2] }, // Pink burst right
      { x: 0.35, y: 0.38, delayMs: 400, colorPalette: PALETTES[3] }, // Emerald burst mid-left
      { x: 0.65, y: 0.32, delayMs: 550, colorPalette: PALETTES[0] }, // Gold burst mid-right
      { x: 0.15, y: 0.20, delayMs: 700, colorPalette: PALETTES[4] }, // Multi burst high-left
      { x: 0.85, y: 0.18, delayMs: 850, colorPalette: PALETTES[1] }, // Cyan burst high-right
      { x: 0.45, y: 0.26, delayMs: 1000, colorPalette: PALETTES[4] }, // Grand multi finale center
    ];

    const launchedBursts = new Set<number>();

    const launchBurst = (burst: Burst) => {
      const cx = burst.x * canvas.width;
      const cy = burst.y * canvas.height;
      const count = 55 + Math.floor(Math.random() * 25);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5.5;
        const color = burst.colorPalette[Math.floor(Math.random() * burst.colorPalette.length)];

        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          radius: 1.5 + Math.random() * 2.5,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.015,
          flicker: Math.random() > 0.4,
        });
      }
    };

    const render = (now: number) => {
      if (!isRunning || !ctx) return;
      const elapsed = now - startTime;

      // Check for scheduled bursts
      bursts.forEach((burst, idx) => {
        if (!launchedBursts.has(idx) && elapsed >= burst.delayMs) {
          launchedBursts.add(idx);
          launchBurst(burst);
        }
      });

      // Clear canvas with slight transparency for motion trails
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.965; // Air friction
        p.vy = p.vy * 0.965 + 0.045; // Gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.flicker && Math.random() < 0.25 ? p.alpha * 0.4 : p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Check if finished
      if (elapsed > durationMs && particles.length === 0) {
        isRunning = false;
        if (onComplete) onComplete();
        return;
      }

      if (elapsed > durationMs + 800) {
        isRunning = false;
        if (onComplete) onComplete();
        return;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [durationMs, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}
