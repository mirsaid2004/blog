"use client";

import Abstract3DGraphic from "./Abstract3DGraphic";

interface CategoryHeroProps {
    eyebrow: string;
    titleLeft: string;
    titleRight: string; // The part with the cyan gradient
    description: string;
}

export default function CategoryHero({
    eyebrow,
    titleLeft,
    titleRight,
    description,
}: CategoryHeroProps) {
    return (
        <section className="relative w-full overflow-hidden border-b border-white/5 bg-background dark:bg-[#0B0F19] pt-24 pb-16 md:pt-32 md:pb-24">
            {/* Background radial gradient to give it that deep glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.1),transparent_70%)] pointer-events-none" />

            <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                {/* Left Side: Text Content */}
                <div className="flex-1 max-w-2xl text-left">
                    <span className="inline-block text-cyan-400 font-bold tracking-wider text-xs md:text-sm uppercase mb-4">
                        {eyebrow}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.1] mb-6">
                        {titleLeft}{" "}
                        <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-blue-500">
                            {titleRight}
                        </span>
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground dark:text-slate-400 leading-relaxed max-w-xl">
                        {description}
                    </p>
                </div>

                {/* Right Side: Graphic */}
                <div className="flex-1 flex flex-col items-center md:items-end justify-center relative">
                    <Abstract3DGraphic />
                </div>
            </div>
        </section>
    );
}
