"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import LightRays from "./LightRays";

function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Light mode settings - subtle elegant rays
  const lightModeSettings = {
    raysOrigin: "top-center" as const,
    raysColor: "#0072f5",
    raysSpeed: 1.2,
    lightSpread: 0.3,
    rayLength: 2,
    followMouse: true,
    mouseInfluence: 0.09,
    noiseAmount: 0.1,
    distortion: 0,
    className: "absolute top-0 left-0",
    pulsating: false,
    fadeDistance: 0.1,
    saturation: 1,
  };

  // Dark mode settings - bright white rays
  const darkModeSettings = {
    raysOrigin: "top-center" as const,
    raysColor: "#fff",
    raysSpeed: 1,
    lightSpread: 0.5,
    rayLength: 3,
    followMouse: true,
    mouseInfluence: 0.1,
    noiseAmount: 0,
    distortion: 0,
    className: "absolute top-0 left-0",
    pulsating: false,
    fadeDistance: 1,
    saturation: 1,
  };

  // Use dark mode settings by default, light mode if explicitly set
  const settings = theme === "light" ? lightModeSettings : darkModeSettings;

  if (!mounted) return null;

  return (
    <div className="relative w-full min-h-screen">
      <section className="py-40 text-center animate-renderFromBottom">
        <h1
          className={
            "text-5xl/normal md:text-7xl/normal font-extrabold mb-6 bg-[linear-gradient(180deg,var(--color-slate-200),var(--color-foreground))] dark:bg-[linear-gradient(180deg,var(--color-white)_45%,var(--color-slate-700))] bg-clip-text text-transparent"
          }
        >
          Engineering Insights
        </h1>
        <p className="text-foreground text-lg max-w-2xl mx-auto">
          Deep dives into software architecture, modern web technologies, and
          scalable systems design.
        </p>
      </section>
      <div className="max-w-2xl mx-auto mb-16 animate-renderFromBottom">
        <div className="relative glass-capsule rounded-full overflow-hidden mb-8">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </span>
          <input
            className="w-full bg-transparent border-none pl-14 pr-6 py-4 focus:ring-0 text-slate-100 placeholder:text-slate-500"
            placeholder="Search for articles, architectures, or tools..."
            type="text"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="px-6 py-2 rounded-full glass-capsule text-sm font-medium hover:border-cyan-accent/50 transition-colors text-cyan-accent">
            All
          </button>
          <button className="px-6 py-2 rounded-full glass-capsule text-sm font-medium hover:border-cyan-accent/50 transition-colors text-slate-400">
            Frontend
          </button>
          <button className="px-6 py-2 rounded-full glass-capsule text-sm font-medium hover:border-cyan-accent/50 transition-colors text-slate-400">
            Backend
          </button>
          <button className="px-6 py-2 rounded-full glass-capsule text-sm font-medium hover:border-cyan-accent/50 transition-colors text-slate-400">
            DevOps
          </button>
          <button className="px-6 py-2 rounded-full glass-capsule text-sm font-medium hover:border-cyan-accent/50 transition-colors text-slate-400">
            AI
          </button>
          <button className="px-6 py-2 rounded-full glass-capsule text-sm font-medium hover:border-cyan-accent/50 transition-colors text-slate-400">
            Systems
          </button>
        </div>
      </div>
      <LightRays {...settings} />
    </div>
  );
}

export default Hero;
