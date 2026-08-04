'use client';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { SearchIcon } from "lucide-react"
import QueryBadgeButton from "./QueryBadgeButton"
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FILTER_CATEGORIES = [
    { label: "All", value: "all" },
    { label: "Frontend", value: "frontend" },
    { label: "Backend", value: "backend" },
    { label: "DevOps", value: "devops" },
    { label: "AI", value: "ai" },
    { label: "Systems", value: "systems" },
]

function HeroFilterings() {
    const { scrollY } = useScroll();
    const { resolvedTheme } = useTheme();
    const [maxY, setMaxY] = useState(5000);
    const [bounds, setBounds] = useState({
        w: 384,
        x: 424,
        initW: 672,
        targetY: 550
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateMaxY = () => {
            const defaultView = document.getElementById("default-home-view");
            const container = containerRef.current;
            if (defaultView && container) {
                const defaultViewBottom = defaultView.getBoundingClientRect().bottom + window.scrollY;

                const style = window.getComputedStyle(container);
                const transform = style.transform;
                let currentTranslateY = 0;
                if (transform && transform !== 'none') {
                    const matrixValues = transform.match(/matrix.*\((.+)\)/);
                    if (matrixValues) {
                        const vals = matrixValues[1].split(', ');
                        if (vals.length >= 6) {
                            currentTranslateY = parseFloat(vals[5]);
                        }
                    }
                }
                const originalTop = container.getBoundingClientRect().top + window.scrollY - currentTranslateY;

                // Dock the Search UI exactly 100px from the top
                const DOCKED_TOP = 100;
                const TRANSITION_END = 400;
                const targetY = TRANSITION_END + DOCKED_TOP - originalTop;

                // 30px gap below the search container
                const gapBetween = 30;

                const stickyDiv = document.querySelector('#top-picks-container > .sticky') as HTMLElement;
                const topPicksHeight = stickyDiv ? stickyDiv.offsetHeight : 0;

                const max = defaultViewBottom - originalTop - container.offsetHeight - gapBetween - topPicksHeight - 20;
                setMaxY(Math.max(0, max));

                const topPicks = document.getElementById("top-picks-container");
                const isDesktop = window.innerWidth >= 1024;
                let tW = 384;
                let tX = 424;
                let iW = Math.min(672, window.innerWidth - 32);

                if (isDesktop && topPicks) {
                    const rect = topPicks.getBoundingClientRect();
                    tW = rect.width;
                    const targetCenter = rect.left + (rect.width / 2);
                    const initialCenter = window.innerWidth / 2;
                    tX = targetCenter - initialCenter;
                } else {
                    tW = iW;
                    tX = 0;
                }

                setBounds({ w: tW, x: tX, initW: iW, targetY });
            }
        };

        const timer = setTimeout(updateMaxY, 300);
        window.addEventListener('resize', updateMaxY);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);

        // Dynamically track height changes (e.g. Tabs expanding)
        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current) {
            resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const height = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height;
                    const DOCKED_TOP = 100;
                    const gapBetween = 30;
                    const stickyOffset = DOCKED_TOP + height + gapBetween;

                    document.documentElement.style.setProperty('--top-picks-sticky-top', `${Math.max(0, stickyOffset)}px`);

                    // Call updateMaxY to recalculate bottom bounds if height changed
                    updateMaxY();
                }
            });
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateMaxY);
            window.removeEventListener('scroll', handleScroll);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    const TRANSITION_END = 400;

    const x = useTransform(scrollY, [0, TRANSITION_END], ["0px", `${bounds.x}px`]);
    const y = useTransform(scrollY, (value) => {
        if (value <= TRANSITION_END) {
            return (value / TRANSITION_END) * bounds.targetY;
        }
        const currentY = bounds.targetY + (value - TRANSITION_END);
        return Math.min(currentY, Math.max(bounds.targetY, maxY));
    });

    const width = useTransform(scrollY, [0, 400], [`${bounds.initW}px`, `${bounds.w}px`]);

    const inputHeight = useTransform(scrollY, [0, TRANSITION_END], ["3.5rem", "2.75rem"]); // 56px to 44px

    // Smooth fade in background/glass effect via CSS classes instead of inline js interpolation,
    // though using Framer Motion to blend opacity of these styles natively works too.
    // For exact match with BlogCard:
    const cardBgClass = isScrolled
        ? "bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border-white/40 dark:border-white/10"
        : "bg-transparent border-transparent shadow-none";

    return (
        <motion.div
            ref={containerRef}
            style={{
                x,
                y,
                width,
                position: "relative",
                zIndex: 40
            }}
            className={`w-full max-w-2xl mx-auto rounded-[2.5rem] p-6 flex flex-col items-center overflow-hidden border transition-colors duration-500 ${cardBgClass}`}
        >
            <motion.div style={{ height: inputHeight, width: "100%", marginBottom: isScrolled ? "0.5rem" : "0" }} className="transition-[margin] duration-300">
                <InputGroup className="w-full h-full rounded-full shadow-lg bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 transition-colors">
                    <InputGroupInput
                        className="h-full ml-2 text-foreground placeholder:text-muted-foreground border-none focus:ring-0 bg-transparent text-base"
                        id="hero-search-input"
                        placeholder="Search for articles, architectures, or tools..."
                    />
                    <InputGroupAddon align="inline-start" className="ml-3">
                        <SearchIcon className="text-muted-foreground size-5" />
                    </InputGroupAddon>
                </InputGroup>
            </motion.div>

            <AnimatePresence>
                {isScrolled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: "0.25rem" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full px-2"
                    >
                        <Tabs defaultValue="articles" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 h-12 bg-background/50 dark:bg-black/20 backdrop-blur-md border border-border/50 rounded-full p-1 gap-1">
                                <TabsTrigger value="articles" className="rounded-full text-sm font-semibold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Articles</TabsTrigger>
                                <TabsTrigger value="posts" className="rounded-full text-sm font-semibold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Posts</TabsTrigger>
                                <TabsTrigger value="series" className="rounded-full text-sm font-semibold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Series</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Badges shown constantly */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 overflow-hidden w-full transition-all">
                {FILTER_CATEGORIES.map((category) => (
                    <QueryBadgeButton
                        key={category.value}
                        value={category.value}
                        label={category.label}
                        scrollY={scrollY}
                    />
                ))}
            </div>

        </motion.div>
    );
}

export default HeroFilterings;