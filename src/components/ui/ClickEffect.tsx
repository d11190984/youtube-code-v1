"use client";

import React, { useEffect, useRef } from "react";

interface ClickEffectProps {
  children: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  alpha: number;
}

export default function ClickEffect({ children }: ClickEffectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  // image pop behavior (unchanged)
  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnFireworks(x, y, rect); // spawn fireworks at click
  };

  // spawn fireworks (adds particles to particlesRef)
  function spawnFireworks(x: number, y: number, rect: DOMRect | null) {
    const px = rect ? x : x;
    const py = rect ? y : y;
    const colors = [
      "#66a7dd",
      "#3e83e1",
      "#2150c2",
      "#fcb0ae",
      "#cab4be",
      "#cfc6ff",
      "#e9b3ed",
      "#6aa0ff",
    ];
    const count = 28 + Math.floor(Math.random() * 12);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 4;
      const p: Particle = {
        x: px,
        y: py,
        vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
        vy: Math.sin(angle) * speed * (0.6 + Math.random() * 0.8),
        life: 60 + Math.random() * 40,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      };
      particlesRef.current.push(p);
    }
  }

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d")!;
    const setSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    };
    setSize();

    const onResize = () => {
      setSize();
    };
    window.addEventListener("resize", onResize);

    function tick() {
      const particles = particlesRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // update & draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // physics
        p.vy += 0.04; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.alpha = Math.max(0, p.life / 80);

        // draw
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // trailing spark
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        if (Math.random() < 0.02) {
          ctx.fillRect(p.x + (Math.random() - 0.5) * 6, p.y + (Math.random() - 0.5) * 6, 1, 1);
        }

        if (p.life <= 0 || p.alpha <= 0.01) {
          particles.splice(i, 1);
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    }

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      particlesRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={handleClick}
      style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
    >
      {children}

      {/* canvas for fireworks */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
      {/* no image rendering — fireworks only */}
    </div>
  );
}