"use client";

import { animate, random } from "animejs";
import React, { useEffect, useRef } from "react";
interface ClickEffectProps {
  imageSrc: string;
  children: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  color?: string;
  radius?: number;
  alpha?: number;
  angle?: number;
  lineWidth?: number;
  endPos?: { x: number; y: number };
  draw?: () => void;
}

export default function ClickEffect({ imageSrc, children }: ClickEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleMouseDownRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleResizeRef = useRef<(() => void) | null>(null);
  const cleanupRef = useRef<() => void>(() => {});

  function cleanup() {
    cleanupRef.current();
  }

  function createFireworks() {
    cleanup();

    const lightColors = ["102, 167, 221", "62, 131, 225", "33, 78, 194"];
    const darkColors = ["252, 146, 174", "202, 180, 190", "207, 198, 255"];
    const colors = lightColors;

    const defaultConfig = {
      numberOfParticles: 20,
      orbitRadius: { min: 50, max: 100 },
      circleRadius: { min: 10, max: 20 },
      diffuseRadius: { min: 50, max: 100 },
      animeDuration: { min: 900, max: 1500 },
    };

    let pointerX = 0;
    let pointerY = 0;

    const canvasEl = canvasRef.current!;
    const ctx = canvasEl.getContext("2d")!;

    function setCanvasSize(canvasEl: HTMLCanvasElement) {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
      canvasEl.style.width = `${window.innerWidth}px`;
      canvasEl.style.height = `${window.innerHeight}px`;
    }

    function updateCoords(e: MouseEvent | TouchEvent) {
      pointerX = e instanceof MouseEvent ? e.clientX : (e as TouchEvent).touches[0]?.clientX || (e as TouchEvent).changedTouches[0]?.clientX;
      pointerY = e instanceof MouseEvent ? e.clientY : (e as TouchEvent).touches[0]?.clientY || (e as TouchEvent).changedTouches[0]?.clientY;
    }

    function setParticleDirection(p: Particle) {
      const angle = (random(0, 360) * Math.PI) / 180;
      const value = random(defaultConfig.diffuseRadius.min, defaultConfig.diffuseRadius.max);
      const radius = value;
      return {
        x: p.x + radius * Math.cos(angle),
        y: p.y + radius * Math.sin(angle),
      };
    }

    function createParticle(x: number, y: number): Particle {
      const p: Particle = {
        x,
        y,
        color: `rgba(${colors[Math.floor(random(0, colors.length - 1))]},${random(0.2, 0.8, 2)})`,
        radius: random(defaultConfig.circleRadius.min, defaultConfig.circleRadius.max),
        angle: random(0, 360),
        endPos: setParticleDirection({ x, y } as Particle),
        draw() {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(((this.angle || 0) * Math.PI) / 180);
          ctx.beginPath();
          ctx.moveTo(0, -this.radius!);
          ctx.lineTo(this.radius! * Math.sin(Math.PI / 3), this.radius! * Math.cos(Math.PI / 3));
          ctx.lineTo(-this.radius! * Math.sin(Math.PI / 3), this.radius! * Math.cos(Math.PI / 3));
          ctx.closePath();
          ctx.fillStyle = this.color!;
          ctx.fill();
          ctx.restore();
        },
      };
      return p;
    }

    function createCircle(x: number, y: number): Particle {
      const p: Particle = {
        x,
        y,
        color: "rgb(106, 159, 255)",
        radius: 0.1,
        alpha: 0.35,
        lineWidth: 4,
        draw() {
          ctx.globalAlpha = this.alpha!;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius!, 0, 2 * Math.PI, true);
          ctx.lineWidth = this.lineWidth!;
          ctx.strokeStyle = this.color!;
          ctx.stroke();
          ctx.globalAlpha = 1;
        },
      };
      return p;
    }

    function drawParticles(particles: Particle[], circle: Particle) {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      particles.forEach((particle) => particle.draw?.());
      circle.draw?.();
    }

    function animateParticles(x: number, y: number) {
      const circle = createCircle(x, y);
      const particles: Particle[] = Array.from({ length: defaultConfig.numberOfParticles }, () => createParticle(x, y));
      let finishedAnimations = 0;

      const renderScene = () => {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        particles.forEach((particle) => particle.draw?.());
        circle.draw?.();
      };

      const handleComplete = () => {
        finishedAnimations += 1;
        if (finishedAnimations >= 2) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }
      };

      animate(particles, {
        x(p: Particle) {
          return (p.endPos as { x: number }).x;
        },
        y(p: Particle) {
          return (p.endPos as { y: number }).y;
        },
        radius: 0,
        duration: random(defaultConfig.animeDuration.min, defaultConfig.animeDuration.max),
        ease: "outExpo",
        onRender: renderScene,
        onComplete: handleComplete,
      });

      animate(circle, {
        radius: random(defaultConfig.orbitRadius.min, defaultConfig.orbitRadius.max),
        lineWidth: 0,
        alpha: 0,
        duration: random(1000, 1500),
        ease: "outExpo",
        onRender: renderScene,
        onComplete: handleComplete,
      });
    }

    handleResizeRef.current = () => setCanvasSize(canvasEl);
    handleMouseDownRef.current = (e: MouseEvent) => {
      updateCoords(e);
      animateParticles(pointerX, pointerY);
    };

    document.addEventListener("mousedown", handleMouseDownRef.current);
    window.addEventListener("resize", handleResizeRef.current);
    cleanupRef.current = () => {
      if (handleMouseDownRef.current) document.removeEventListener("mousedown", handleMouseDownRef.current);
      if (handleResizeRef.current) window.removeEventListener("resize", handleResizeRef.current);
    };
    setCanvasSize(canvasEl);
  }

  useEffect(() => {
    createFireworks();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 999,
          pointerEvents: "none",
        }}
      />
      {/* pop image effect can remain; keep your current click image logic if needed */}
      <img src={imageSrc} style={{ display: "none" }} alt="" />
    </div>
  );
}