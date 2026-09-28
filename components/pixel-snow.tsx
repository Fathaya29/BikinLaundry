"use client";

import { useEffect, useRef } from "react";

type PixelSnowProps = {
  color?: string;
  flakeSize?: number;
  minFlakeSize?: number;
  pixelResolution?: number;
  speed?: number;
  depthFade?: number;
  farPlane?: number;
  density?: number;
  direction?: number;
  brightness?: number;
  gamma?: number;
  variant?: "square" | "round" | "snowflake";
  className?: string;
  style?: React.CSSProperties;
};

type Flake = { x: number; y: number; size: number; drift: number; opacity: number };

export default function PixelSnow({
  color = "#ffffff",
  minFlakeSize = 1.25,
  speed = 1.25,
  density = 0.3,
  direction = 125,
  brightness = 1,
  className = "",
  style,
}: PixelSnowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const host = canvas.parentElement;
    if (!host) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    const wind = Math.cos((direction * Math.PI) / 180);
    const fall = Math.max(0.35, Math.sin((direction * Math.PI) / 180));

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(Math.max(12, width * height * density * 0.00012));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: minFlakeSize + Math.random() * 2.5,
        drift: (Math.random() - 0.5) * 0.35,
        opacity: 0.22 + Math.random() * 0.6,
      }));
    };

    const render = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      for (const flake of flakes) {
        context.globalAlpha = Math.min(1, flake.opacity * brightness);
        context.fillRect(Math.round(flake.x), Math.round(flake.y), Math.ceil(flake.size), Math.ceil(flake.size));
        flake.x += (wind * 0.32 + flake.drift) * speed;
        flake.y += (0.55 + fall * 0.65) * speed;
        if (flake.y > height + 6) flake.y = -6;
        if (flake.x > width + 6) flake.x = -6;
        if (flake.x < -6) flake.x = width + 6;
      }
      context.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [brightness, color, density, direction, minFlakeSize, speed]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} style={style} />;
}