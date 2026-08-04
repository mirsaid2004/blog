"use client";

import { motion } from "framer-motion";

export default function WireframeGlobe() {
    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80 opacity-60 pointer-events-none select-none flex items-center justify-center">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0%,transparent_60%)] -z-10 mix-blend-screen" />

            <motion.svg
                viewBox="0 0 100 100"
                className="w-full h-full text-cyan-400 opacity-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
            >
                {/* Horizontal Ellipses (Latitudes) */}
                <ellipse cx="50" cy="50" rx="45" ry="15" />
                <ellipse cx="50" cy="50" rx="45" ry="30" />
                <ellipse cx="50" cy="50" rx="45" ry="45" />

                {/* Vertical Ellipses (Longitudes) */}
                <ellipse cx="50" cy="50" rx="15" ry="45" />
                <ellipse cx="50" cy="50" rx="30" ry="45" />

                {/* Diagonal axis line for depth */}
                <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="1 2" className="opacity-40" />
                <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="1 2" className="opacity-40" />

                {/* Outer Circle */}
                <circle cx="50" cy="50" r="45" />
            </motion.svg>
        </div>
    );
}
