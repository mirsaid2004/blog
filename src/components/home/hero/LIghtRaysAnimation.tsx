'use client';
import { useTheme } from 'next-themes';
import LightRays from './LightRays';

function LightRaysAnimation() {

  const { theme } = useTheme();

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

  return (
    <LightRays {...settings} />
  )
}

export default LightRaysAnimation;