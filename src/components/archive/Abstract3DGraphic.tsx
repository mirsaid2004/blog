"use client";

import { motion } from "framer-motion";

export default function Abstract3DGraphic() {
    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center pointer-events-none perspective-[1000px]">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0%,transparent_60%)] -z-10 mix-blend-screen" />

            {/* 3D Tesseract Complex */}
            <motion.div
                className="relative w-40 h-40"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 180] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
                {/* Outer Box */}
                <Cube size={160} color="border-cyan-400/30" />

                {/* Inner Box rotating in opposite direction */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-20 h-20"
                    style={{ transformStyle: "preserve-3d", marginLeft: "-40px", marginTop: "-40px" }}
                    animate={{ rotateX: [360, 0], rotateY: [360, 0], rotateZ: [360, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                    <Cube size={80} color="border-purple-500/40 bg-purple-500/5 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]" />
                </motion.div>
            </motion.div>
        </div>
    );
}

function Cube({ size, color }: { size: number, color: string }) {
    const half = size / 2;
    const commonClass = `absolute inset-0 border flex items-center justify-center bg-cyan-500/5 ${color} backdrop-blur-[1px] shadow-[inset_0_0_20px_rgba(56,189,248,0.1)]`;

    return (
        <>
            {/* Front */}
            <div className={commonClass} style={{ transform: `translateZ(${half}px)` }} />
            {/* Back */}
            <div className={commonClass} style={{ transform: `rotateY(180deg) translateZ(${half}px)` }} />
            {/* Left */}
            <div className={commonClass} style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }} />
            {/* Right */}
            <div className={commonClass} style={{ transform: `rotateY(90deg) translateZ(${half}px)` }} />
            {/* Top */}
            <div className={commonClass} style={{ transform: `rotateX(90deg) translateZ(${half}px)` }} />
            {/* Bottom */}
            <div className={commonClass} style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }} />
        </>
    );
}
