'use client';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { SearchIcon } from "lucide-react"
import QueryBadgeButton from "./QueryBadgeButton"
import { motion, useScroll, useSpring, useTransform, AnimatePresence, easeInOut } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setDockPoint, useDockPoint, useIsDocked } from "../scroll-dock";

const FILTER_CATEGORIES = [
    { label: "All", value: "all" },
    { label: "Frontend", value: "frontend" },
    { label: "Backend", value: "backend" },
    { label: "DevOps", value: "devops" },
    { label: "AI", value: "ai" },
    { label: "Systems", value: "systems" },
]

/** Distance from the viewport top the card settles at once pinned. */
const DOCKED_TOP = 100;
/** Breathing room between the pinned card and the Top Picks column below it. */
const GAP_BELOW = 30;
/** Space left under the card where it parks at the end of the default view. */
const BOTTOM_PAD = 20;

/**
 * The card is `position: sticky`, so the browser pins it on the compositor and it
 * can never trail the scroll. It travels as far as the hero section's padding box,
 * which `--hero-sticky-extent` stretches down over the default view (see Hero.tsx).
 *
 * Scroll-linked work is limited to three transforms on this one element, and they
 * are clamped to the dock point - once pinned, nothing recalculates at all.
 */
function HeroFilterings() {
    const { scrollY } = useScroll();
    const dockPoint = useDockPoint();
    const isDocked = useIsDocked();

    const anchorRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const extentRef = useRef(-1);
    const heightRef = useRef(-1);

    const [bounds, setBounds] = useState({ w: 384, x: 0, initW: 672 });

    // Measurement runs on layout changes only - never on scroll.
    useEffect(() => {
        const anchor = anchorRef.current;
        const card = cardRef.current;
        if (!anchor || !card) return;

        const root = document.documentElement;

        const measure = () => {
            const topPicks = document.getElementById("top-picks-container");
            const region = document.getElementById("default-home-view");
            const isDesktop = window.innerWidth >= 1024;

            // Where the card starts, and where it has to end up.
            const initW = Math.min(672, root.clientWidth - 32);
            let w = initW;
            let x = 0;
            if (isDesktop && topPicks) {
                const rect = topPicks.getBoundingClientRect();
                w = rect.width;
                x = rect.left + rect.width / 2 - root.clientWidth / 2;
            }
            setBounds((prev) =>
                prev.w === w && prev.x === x && prev.initW === initW
                    ? prev
                    : { w, x, initW }
            );

            // The anchor is a zero-height sibling, so it always reports the card's
            // natural (unstuck) position even while the card is pinned.
            const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
            setDockPoint(Math.max(1, Math.round(anchorTop - DOCKED_TOP)));

            if (!region) return;

            // Stretch the sticky container so the card unpins just above the point
            // where the Top Picks column runs out of room.
            const sidebar = topPicks?.querySelector<HTMLElement>(":scope > .sticky");
            const sidebarHeight = isDesktop ? sidebar?.offsetHeight ?? 0 : 0;
            const regionBottom = region.getBoundingClientRect().bottom + window.scrollY;
            const parkBottom = regionBottom - sidebarHeight - GAP_BELOW - BOTTOM_PAD;
            const extent = Math.max(0, Math.round(parkBottom - anchorTop - card.offsetHeight));

            if (extent === extentRef.current) return;
            extentRef.current = extent;
            root.style.setProperty("--hero-sticky-extent", `${extent}px`);
        };

        const publishHeight = (height: number) => {
            const rounded = Math.round(height);
            if (rounded === heightRef.current) return;
            heightRef.current = rounded;
            root.style.setProperty(
                "--top-picks-sticky-top",
                `${DOCKED_TOP + rounded + GAP_BELOW}px`
            );
            // A taller card also moves where it parks.
            measure();
        };

        // Observing our own card would loop forever if we reacted to its animated
        // width, so read the height off the entry and bail out unless it changed.
        const cardObserver = new ResizeObserver(([entry]) => {
            publishHeight(
                entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
            );
        });
        cardObserver.observe(card);

        // Content below reflows as images/fonts land; neither feeds back into us.
        const layoutObserver = new ResizeObserver(() => measure());
        const region = document.getElementById("default-home-view");
        const topPicks = document.getElementById("top-picks-container");
        if (region) layoutObserver.observe(region);
        if (topPicks) layoutObserver.observe(topPicks);

        publishHeight(card.offsetHeight);
        measure();

        window.addEventListener("resize", measure);
        return () => {
            cardObserver.disconnect();
            layoutObserver.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    // The morph finishes when the card docks. Driving it from a spring rather than
    // raw scrollY smooths out discrete wheel steps; vertical motion is still native
    // scroll / sticky, so the card never trails the page.
    const travel = Math.max(1, dockPoint);
    const progress = useSpring(
        useTransform(scrollY, [0, travel], [0, 1], { ease: easeInOut }),
        { stiffness: 260, damping: 34, mass: 0.6, restDelta: 0.0005 }
    );
    const x = useTransform(progress, [0, 1], [0, bounds.x]);
    const width = useTransform(progress, [0, 1], [bounds.initW, bounds.w]);
    const inputHeight = useTransform(progress, [0, 1], [56, 44]);

    const cardBgClass = isDocked
        ? "bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border-white/40 dark:border-white/10"
        : "bg-transparent border-transparent shadow-none";

    return (
        <>
            {/* Zero-height marker for the card's natural position. */}
            <div ref={anchorRef} aria-hidden className="h-0" />

            <motion.div
                ref={cardRef}
                style={{ x, width, top: `${DOCKED_TOP}px` }}
                className={`sticky z-40 mx-auto max-w-full rounded-[2.5rem] p-6 flex flex-col items-center overflow-hidden border pointer-events-auto will-change-transform transition-colors duration-500 ${cardBgClass}`}
            >
                <motion.div
                    style={{ height: inputHeight, width: "100%" }}
                    className={`transition-[margin] duration-300 ${isDocked ? "mb-2" : "mb-0"}`}
                >
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
                    {isDocked && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: "0.25rem" }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full px-2"
                        >
                            <Tabs defaultValue="articles" className="w-full">
                                <TabsList className="w-full grid grid-cols-3 h-12 bg-background/50 dark:bg-black/20 border border-border/50 rounded-full p-1 gap-1">
                                    <TabsTrigger value="articles" className="rounded-full text-sm font-semibold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Articles</TabsTrigger>
                                    <TabsTrigger value="posts" className="rounded-full text-sm font-semibold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Posts</TabsTrigger>
                                    <TabsTrigger value="series" className="rounded-full text-sm font-semibold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Series</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Badges shown constantly */}
                <div className="flex flex-wrap justify-center gap-2 mt-6 overflow-hidden w-full">
                    {FILTER_CATEGORIES.map((category) => (
                        <QueryBadgeButton
                            key={category.value}
                            value={category.value}
                            label={category.label}
                        />
                    ))}
                </div>
            </motion.div>
        </>
    );
}

export default HeroFilterings;
