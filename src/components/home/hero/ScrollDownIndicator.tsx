'use client';
import { motion, useScroll, useTransform } from "framer-motion";

function ScrollDownIndicator() {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (<>
        {/* Smooth Scroll Indicator */}
        < motion.div
            style={{ opacity }}
            className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Scroll
            </span>
            <div className="w-px h-12 bg-linear-to-b from-muted-foreground to-transparent" />
        </motion.div >
    </>
    )
}

export default ScrollDownIndicator